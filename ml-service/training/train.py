"""
Training script — replicates the notebook pipeline exactly.

Notebook cells replicated:
  Cell 9   — drop duplicates
  Cell 13  — parse timestamp
  Cell 14  — extract hour, day, dayofweek, month
  Cell 21-25 — engineer 5 features
  Cell 27  — replace inf/-inf with NaN
  Cell 28  — impute numeric with median (SimpleImputer)
  Cell 29  — fill categorical NaN with mode
  Cell 32  — compute delay_risk_score
  Cell 36  — label: delay_risk_score >= median → 1
  Cell 41  — drop: time_deviation, performance_score,
             optimization_suggestion, timestamp
  Cell 45  — pd.get_dummies
  Cell 47  — train/test split 80/20, stratify, random_state=42
  Cell 48  — fit SimpleImputer on X_train, transform both
  Cell 50  — RandomForest (n_estimators=500)
  Cell 56  — XGBoost  (n_estimators=500)
  Cell 69  — pick best by F1
  Cell 70-72 — save model.pkl, imputer.pkl, features.pkl

Run:
  python training/train.py                          # synthetic data
  python training/train.py path/to/dataset.csv      # real CSV
"""

import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import joblib
from datetime import datetime

from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report,
)

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("WARNING: xgboost not installed — only RandomForest will be trained.")

from preprocessing.feature_config import (
    MACHINERY_STATUS_MAP,
    MATERIAL_SHORTAGE_MAP,
    MODEL_FEATURE_NAMES,
    DELAY_RISK_WEIGHTS,
)

ARTIFACTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "artifacts"
)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
RANDOM_STATE = 42


# ──────────────────────────────────────────────────────────────────
# helpers
# ──────────────────────────────────────────────────────────────────

def min_max(series: pd.Series) -> pd.Series:
    """Notebook Cell 31."""
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series(0.0, index=series.index)
    return (series - mn) / (mx - mn)


def encode_df(df: pd.DataFrame) -> pd.DataFrame:
    """Encode categorical columns to int before imputation."""
    df = df.copy()
    if df["machinery_status"].dtype == object:
        df["machinery_status"] = (
            df["machinery_status"].str.lower()
            .map(MACHINERY_STATUS_MAP).fillna(2).astype(float)
        )
    if df["material_shortage_alert"].dtype == object:
        df["material_shortage_alert"] = (
            df["material_shortage_alert"].str.lower()
            .map(MATERIAL_SHORTAGE_MAP).fillna(0).astype(float)
        )
    # performance_score: "Excellent"/"Good"/... → numeric
    if "performance_score" in df.columns and df["performance_score"].dtype == object:
        pmap = {"poor": 20, "fair": 40, "good": 60, "excellent": 90}
        df["performance_score"] = (
            df["performance_score"].str.lower().map(pmap).fillna(50).astype(float)
        )
    # optimization_suggestion: text → int
    if "optimization_suggestion" in df.columns and df["optimization_suggestion"].dtype == object:
        omap = {
            "none": 0,
            "optimize material usage": 1,
            "increase workforce": 2,
            "schedule maintenance": 3,
            "reduce energy consumption": 1,
        }
        df["optimization_suggestion"] = (
            df["optimization_suggestion"].str.lower().map(omap).fillna(0).astype(float)
        )
    return df


# ──────────────────────────────────────────────────────────────────
# real-data path
# ──────────────────────────────────────────────────────────────────

def load_real(csv_path: str):
    print(f"Loading real dataset: {csv_path}")
    data = pd.read_csv(csv_path)
    print(f"  Raw shape: {data.shape}")

    # Cell 9 — drop duplicates
    data = data.drop_duplicates().copy()
    print(f"  After dedup: {data.shape}")

    # encode before numeric operations
    data = encode_df(data)

    # Cell 13-14 — parse timestamp, extract time features
    data["timestamp"] = pd.to_datetime(data["timestamp"], errors="coerce")
    data["hour"]      = data["timestamp"].dt.hour.fillna(12).astype(float)
    data["day"]       = data["timestamp"].dt.day.fillna(1).astype(float)
    data["dayofweek"] = data["timestamp"].dt.dayofweek.fillna(0).astype(float)
    data["month"]     = data["timestamp"].dt.month.fillna(1).astype(float)

    # Cell 21-25 — engineered features
    data["worker_productivity"]  = data["task_progress"] / (data["worker_count"] + 1)
    data["material_efficiency"]  = data["task_progress"] / (data["material_usage"] + 1)
    data["equipment_efficiency"] = data["task_progress"] / (data["energy_consumption"] + 1)
    data["environmental_stress"] = data["temperature"] * data["humidity"] / 100.0
    data["safety_risk"]          = data["safety_incidents"] * data["risk_score"]

    # Cell 27
    data.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Cell 28 — impute numeric with median
    num_cols = data.select_dtypes(include=np.number).columns
    imp_pre = SimpleImputer(strategy="median")
    data[num_cols] = imp_pre.fit_transform(data[num_cols])

    # Cell 29 — fill object NaN with mode
    for col in data.select_dtypes(include="object").columns:
        mode = data[col].mode()
        if len(mode):
            data[col].fillna(mode[0], inplace=True)

    # Cell 32 — delay_risk_score
    data["delay_risk_score"] = (
        DELAY_RISK_WEIGHTS["risk_score"]                * min_max(data["risk_score"])
        + DELAY_RISK_WEIGHTS["cost_deviation"]          * min_max(data["cost_deviation"])
        + DELAY_RISK_WEIGHTS["vibration_level"]         * min_max(data["vibration_level"])
        + DELAY_RISK_WEIGHTS["safety_incidents"]        * min_max(data["safety_incidents"])
        + DELAY_RISK_WEIGHTS["equipment_utilization_rate"]
          * (1 - min_max(data["equipment_utilization_rate"]))
        + DELAY_RISK_WEIGHTS["material_shortage_alert"] * min_max(data["material_shortage_alert"])
    )

    # Cell 36 — binary label
    threshold = data["delay_risk_score"].median()
    data["Delay"] = (data["delay_risk_score"] >= threshold).astype(int)
    print(f"  Delay dist: {data['Delay'].value_counts().to_dict()}")

    # Cell 41-42 — drop unused, build X / y
    drop_cols = ["Delay", "delay_risk_score", "time_deviation",
                 "performance_score", "optimization_suggestion", "timestamp"]
    X = data.drop(columns=drop_cols, errors="ignore")
    y = data["Delay"]

    # Cell 45 — dummies (handles remaining object cols)
    X = pd.get_dummies(X, drop_first=True)

    # Align to MODEL_FEATURE_NAMES
    for c in MODEL_FEATURE_NAMES:
        if c not in X.columns:
            X[c] = 0.0
    X = X[MODEL_FEATURE_NAMES]

    return X, y


# ──────────────────────────────────────────────────────────────────
# synthetic fallback
# ──────────────────────────────────────────────────────────────────

def generate_synthetic(n=5500):
    print(f"Generating {n} synthetic samples (no CSV supplied)...")
    rng = np.random.RandomState(RANDOM_STATE)

    temperature     = rng.uniform(-5, 45, n)
    humidity        = rng.uniform(20, 95, n)
    vibration_level = rng.uniform(0, 80, n)
    material_usage  = rng.uniform(10, 800, n)
    machinery_status= rng.choice([2, 1, 0, -1], n, p=[0.55, 0.25, 0.12, 0.08]).astype(float)
    worker_count    = rng.randint(5, 500, n).astype(float)
    energy_consumption = rng.uniform(100, 50000, n)
    task_progress   = rng.uniform(0, 100, n)
    cost_deviation  = rng.uniform(-500, 5000, n)
    safety_incidents= rng.poisson(1.5, n).astype(float)
    equip_util      = rng.uniform(20, 100, n)
    mat_shortage    = rng.choice([0, 1, 2, 3, 4], n, p=[0.45, 0.25, 0.15, 0.10, 0.05]).astype(float)
    risk_score      = rng.uniform(0, 100, n)
    sim_dev         = rng.uniform(-30, 60, n)
    upd_freq        = rng.uniform(5, 480, n)
    hour            = rng.randint(0, 24, n).astype(float)
    day             = rng.randint(1, 29, n).astype(float)
    dayofweek       = rng.randint(0, 7, n).astype(float)
    month           = rng.randint(1, 13, n).astype(float)

    worker_prod = task_progress / (worker_count + 1)
    mat_eff     = task_progress / (material_usage + 1)
    equip_eff   = task_progress / (energy_consumption + 1)
    env_stress  = temperature * humidity / 100.0
    safety_risk = safety_incidents * risk_score

    df = pd.DataFrame({
        "temperature":                temperature,
        "humidity":                   humidity,
        "vibration_level":            vibration_level,
        "material_usage":             material_usage,
        "machinery_status":           machinery_status,
        "worker_count":               worker_count,
        "energy_consumption":         energy_consumption,
        "task_progress":              task_progress,
        "cost_deviation":             cost_deviation,
        "safety_incidents":           safety_incidents,
        "equipment_utilization_rate": equip_util,
        "material_shortage_alert":    mat_shortage,
        "risk_score":                 risk_score,
        "simulation_deviation":       sim_dev,
        "update_frequency":           upd_freq,
        "hour":       hour,
        "day":        day,
        "dayofweek":  dayofweek,
        "month":      month,
        "worker_productivity":  worker_prod,
        "material_efficiency":  mat_eff,
        "equipment_efficiency": equip_eff,
        "environmental_stress": env_stress,
        "safety_risk":          safety_risk,
    })

    df["delay_risk_score"] = (
        DELAY_RISK_WEIGHTS["risk_score"]                * min_max(df["risk_score"])
        + DELAY_RISK_WEIGHTS["cost_deviation"]          * min_max(df["cost_deviation"])
        + DELAY_RISK_WEIGHTS["vibration_level"]         * min_max(df["vibration_level"])
        + DELAY_RISK_WEIGHTS["safety_incidents"]        * min_max(df["safety_incidents"])
        + DELAY_RISK_WEIGHTS["equipment_utilization_rate"]
          * (1 - min_max(df["equipment_utilization_rate"]))
        + DELAY_RISK_WEIGHTS["material_shortage_alert"] * min_max(df["material_shortage_alert"])
    )
    threshold = df["delay_risk_score"].median()
    y = (df["delay_risk_score"] >= threshold).astype(int)
    X = df[MODEL_FEATURE_NAMES].copy()
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    print(f"  Delay dist: {y.value_counts().to_dict()}")
    return X, y


# ──────────────────────────────────────────────────────────────────
# evaluation
# ──────────────────────────────────────────────────────────────────

def evaluate(model, X, y, name):
    yp  = model.predict(X)
    ypr = model.predict_proba(X)[:, 1]
    m = {
        "model":     name,
        "accuracy":  float(accuracy_score(y, yp)),
        "precision": float(precision_score(y, yp, zero_division=0)),
        "recall":    float(recall_score(y, yp, zero_division=0)),
        "f1":        float(f1_score(y, yp, zero_division=0)),
        "roc_auc":   float(roc_auc_score(y, ypr)),
        "confusion_matrix": confusion_matrix(y, yp).tolist(),
        "classification_report": classification_report(
            y, yp, target_names=["No Delay", "Delay"],
            output_dict=True, zero_division=0,
        ),
    }
    print(f"  {name:20s}  acc={m['accuracy']:.4f}  prec={m['precision']:.4f}"
          f"  rec={m['recall']:.4f}  f1={m['f1']:.4f}  auc={m['roc_auc']:.4f}")
    return m


# ──────────────────────────────────────────────────────────────────
# main
# ──────────────────────────────────────────────────────────────────

def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else None

    if csv_path and os.path.isfile(csv_path):
        X, y = load_real(csv_path)
    else:
        if csv_path:
            print(f"WARNING: '{csv_path}' not found — using synthetic data.")
        X, y = generate_synthetic()

    print(f"\nDataset ready — X: {X.shape}  |  y dist: {dict(y.value_counts())}")

    # Cell 47 — split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )
    print(f"Train: {X_train.shape}  Test: {X_test.shape}")

    # Cell 48 — fit imputer on train only
    imputer = SimpleImputer(strategy="median")
    X_train_imp = pd.DataFrame(
        imputer.fit_transform(X_train), columns=X_train.columns, index=X_train.index
    )
    X_test_imp = pd.DataFrame(
        imputer.transform(X_test), columns=X_test.columns, index=X_test.index
    )
    print(f"Missing after imputation — train: {X_train_imp.isnull().sum().sum()}"
          f"  test: {X_test_imp.isnull().sum().sum()}")

    models = {}

    # Cell 50 — Random Forest
    print("\nTraining Random Forest (n_estimators=500)...")
    rf = RandomForestClassifier(
        n_estimators=500, max_depth=None, min_samples_split=2, min_samples_leaf=1,
        max_features="sqrt", class_weight="balanced",
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    rf.fit(X_train_imp, y_train)
    models["RandomForest"] = rf

    # Cell 56 — XGBoost
    if HAS_XGB:
        print("Training XGBoost (n_estimators=500)...")
        xgb = XGBClassifier(
            n_estimators=500, max_depth=5, learning_rate=0.03,
            subsample=0.85, colsample_bytree=0.85, min_child_weight=2,
            gamma=0, reg_alpha=0.05, reg_lambda=1.0,
            objective="binary:logistic", eval_metric="logloss",
            random_state=RANDOM_STATE, n_jobs=-1, verbosity=0,
        )
        xgb.fit(X_train_imp, y_train)
        models["XGBoost"] = xgb

    # evaluate all
    print("\n─── Evaluation ───────────────────────────────────────────────")
    all_metrics = [evaluate(m, X_test_imp, y_test, name) for name, m in models.items()]

    # Cell 69 — best by F1
    best_meta  = max(all_metrics, key=lambda x: x["f1"])
    best_model = models[best_meta["model"]]
    print(f"\nBest model: {best_meta['model']}  "
          f"F1={best_meta['f1']:.4f}  AUC={best_meta['roc_auc']:.4f}")

    # feature importances
    fi = {}
    if hasattr(best_model, "feature_importances_"):
        fi = dict(zip(MODEL_FEATURE_NAMES, best_model.feature_importances_.tolist()))

    # save artifacts (Cells 70-72)
    joblib.dump(best_model,                  os.path.join(ARTIFACTS_DIR, "model.pkl"))
    joblib.dump(imputer,                     os.path.join(ARTIFACTS_DIR, "imputer.pkl"))
    joblib.dump(list(X_train_imp.columns),   os.path.join(ARTIFACTS_DIR, "features.pkl"))

    meta = {
        "best_model":          best_meta["model"],
        "target":              "binary",
        "classes":             ["No Delay", "Delay"],
        "feature_names":       MODEL_FEATURE_NAMES,
        "feature_importances": fi,
        "metrics":             best_meta,
        "all_metrics":         all_metrics,
        "trained_at":          datetime.now().isoformat(),
        "n_samples":           int(len(X)),
        "n_features":          int(len(MODEL_FEATURE_NAMES)),
    }
    with open(os.path.join(ARTIFACTS_DIR, "model_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\nArtifacts saved → {ARTIFACTS_DIR}")
    print("  model.pkl  imputer.pkl  features.pkl  model_meta.json")
    print("\nTraining complete ✓")


if __name__ == "__main__":
    main()
