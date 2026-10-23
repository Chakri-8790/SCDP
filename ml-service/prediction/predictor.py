"""
Prediction module — uses notebook artifacts (SimpleImputer, not StandardScaler).

Artifacts:
  artifacts/model.pkl    — best model (RF or XGBoost)
  artifacts/imputer.pkl  — fitted SimpleImputer (median)
  artifacts/features.pkl — ordered list of X_train.columns
  artifacts/model_meta.json
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.preprocessor import preprocess_input
from preprocessing.feature_config import DELAY_LABELS, RISK_THRESHOLDS, MODEL_FEATURE_NAMES

ARTIFACTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "artifacts"
)

_model    = None
_imputer  = None
_features = None
_meta     = None


def _load():
    global _model, _imputer, _features, _meta
    if _model is not None:
        return

    model_path   = os.path.join(ARTIFACTS_DIR, "model.pkl")
    imputer_path = os.path.join(ARTIFACTS_DIR, "imputer.pkl")
    feat_path    = os.path.join(ARTIFACTS_DIR, "features.pkl")
    meta_path    = os.path.join(ARTIFACTS_DIR, "model_meta.json")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            "model.pkl not found. Run: python training/train.py"
        )

    _model    = joblib.load(model_path)
    _imputer  = joblib.load(imputer_path)
    _features = joblib.load(feat_path)

    if os.path.exists(meta_path):
        with open(meta_path) as f:
            _meta = json.load(f)


def _risk_level(score: float) -> str:
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= score <= hi:
            return level
    return "Critical"


def _predicted_risk_score(delay_prob: float, raw: dict) -> float:
    """Map delay probability (0-1) + key input signals → 0-100 risk score."""
    base = delay_prob * 100.0

    rs = float(raw.get("risk_score", 50))
    cd = abs(float(raw.get("cost_deviation", 0)))
    si = float(raw.get("safety_incidents", 0))

    rs_contrib = rs * 0.30                      # up to 30 pts from input risk
    cd_adj     = min(cd / 5000.0, 1.0) * 5.0   # up to 5 pts from cost dev
    si_adj     = min(si / 10.0,  1.0) * 3.0    # up to 3 pts from safety

    score = base * 0.65 + rs_contrib + cd_adj + si_adj
    return round(min(100.0, max(0.0, score)), 1)


def _top_importances(n=8) -> list:
    if _meta and _meta.get("feature_importances"):
        imp = _meta["feature_importances"]
    elif hasattr(_model, "feature_importances_") and _features:
        imp = dict(zip(_features, _model.feature_importances_.tolist()))
    else:
        imp = {f: 1.0 / len(MODEL_FEATURE_NAMES) for f in MODEL_FEATURE_NAMES}

    sorted_imp = sorted(imp.items(), key=lambda x: x[1], reverse=True)[:n]
    return [
        {
            "feature":     k,
            "importance":  round(float(v) * 100, 2),
            "displayName": k.replace("_", " ").title(),
        }
        for k, v in sorted_imp
    ]


def predict(raw_data: dict) -> dict:
    """
    Full prediction pipeline.

    Args:
        raw_data: dict with the 19 raw API fields.

    Returns:
        dict compatible with the Node.js predictionController expected shape.
    """
    _load()

    # 1. preprocess → DataFrame (24 cols, notebook order)
    X_row = preprocess_input(raw_data)

    # 2. align columns to training feature list
    for col in _features:
        if col not in X_row.columns:
            X_row[col] = 0.0
    X_row = X_row[_features]

    # 3. impute (matches Cell 48)
    X_imp = pd.DataFrame(
        _imputer.transform(X_row), columns=_features
    )

    # 4. predict
    pred_class = int(_model.predict(X_imp)[0])          # 0 or 1
    proba      = _model.predict_proba(X_imp)[0]         # [p0, p1]
    delay_prob = float(proba[1])

    delay_label = DELAY_LABELS[pred_class]              # "No Delay" / "Delay"
    delay_pct   = round(delay_prob * 100, 1)
    confidence  = round(float(np.max(proba)) * 100, 1)

    # 5. risk score / level
    risk_score = _predicted_risk_score(delay_prob, raw_data)
    risk_level = _risk_level(risk_score)

    return {
        "delayPrediction":    delay_label,
        "delayProbability":   delay_pct,
        "predictedRiskScore": risk_score,
        "riskLevel":          risk_level,
        "confidence":         confidence,
        "majorRiskFactors":   _top_importances(8),
        "classProbabilities": {
            "No Delay": round(float(proba[0]) * 100, 1),
            "Delay":    round(float(proba[1]) * 100, 1),
        },
        "modelInfo": {
            "modelType": _meta.get("best_model", "Unknown") if _meta else "Unknown",
            "trainedAt": _meta.get("trained_at",  "N/A")    if _meta else "N/A",
            "accuracy":  _meta["metrics"].get("accuracy")   if _meta and _meta.get("metrics") else None,
            "f1":        _meta["metrics"].get("f1")         if _meta and _meta.get("metrics") else None,
            "rocAuc":    _meta["metrics"].get("roc_auc")    if _meta and _meta.get("metrics") else None,
        },
    }
