"""
Preprocessing pipeline — matches the notebook pipeline exactly.

Notebook steps replicated:
  Cell 13  — parse timestamp to datetime
  Cell 14  — extract hour, day, dayofweek, month
  Cell 21-25 — engineer 5 derived features
  Cell 27  — replace inf/-inf with NaN
  Drops: time_deviation, performance_score, optimization_suggestion, timestamp
         (those never enter the feature vector)
"""

import numpy as np
import pandas as pd
from datetime import datetime

try:
    from preprocessing.feature_config import (
        MACHINERY_STATUS_MAP,
        MATERIAL_SHORTAGE_MAP,
        NUMERICAL_RANGES,
        MODEL_FEATURE_NAMES,
    )
except ImportError:
    from feature_config import (
        MACHINERY_STATUS_MAP,
        MATERIAL_SHORTAGE_MAP,
        NUMERICAL_RANGES,
        MODEL_FEATURE_NAMES,
    )


# ── helpers ────────────────────────────────────────────────────────

def _parse_timestamp(ts):
    """Return (hour, day, dayofweek, month) from any timestamp value."""
    try:
        if ts is None:
            raise ValueError("no timestamp")
        if isinstance(ts, (int, float)):
            dt = datetime.fromtimestamp(float(ts))
        else:
            s = str(ts).strip()
            for fmt in (
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M",
                "%Y-%m-%d",
            ):
                try:
                    dt = datetime.strptime(s, fmt)
                    break
                except ValueError:
                    continue
            else:
                dt = datetime.now()
        return dt.hour, dt.day, dt.weekday(), dt.month
    except Exception:
        now = datetime.now()
        return now.hour, now.day, now.weekday(), now.month


def _safe_float(value, default=0.0):
    try:
        v = float(value)
        return v if np.isfinite(v) else default
    except (TypeError, ValueError):
        return default


def _clip(value, feature_name, default=0.0):
    v = _safe_float(value, default)
    if feature_name in NUMERICAL_RANGES:
        lo, hi = NUMERICAL_RANGES[feature_name]
        v = max(lo, min(hi, v))
    return v


def _encode_machinery(value):
    if isinstance(value, str):
        return float(MACHINERY_STATUS_MAP.get(value.strip().lower(), 2))
    return float(_safe_float(value, 2.0))


def _encode_shortage(value):
    if isinstance(value, str):
        return float(MATERIAL_SHORTAGE_MAP.get(value.strip().lower(), 0))
    return float(_safe_float(value, 0.0))


# ── main API ────────────────────────────────────────────────────────

def preprocess_input(raw_data: dict) -> pd.DataFrame:
    """
    Convert one raw API dict into a single-row DataFrame with exactly
    the columns MODEL_FEATURE_NAMES (24 features).

    NaN values are left in — the saved imputer handles them.
    """
    r = {}

    # ── timestamp → time features (Cell 14) ─────────────────────
    hour, day, dow, month = _parse_timestamp(raw_data.get("timestamp"))
    r["hour"]      = float(hour)
    r["day"]       = float(day)
    r["dayofweek"] = float(dow)
    r["month"]     = float(month)

    # ── base numerical features ──────────────────────────────────
    r["temperature"]                = _clip(raw_data.get("temperature"),                "temperature")
    r["humidity"]                   = _clip(raw_data.get("humidity"),                   "humidity")
    r["vibration_level"]            = _clip(raw_data.get("vibration_level"),            "vibration_level")
    r["material_usage"]             = _clip(raw_data.get("material_usage"),             "material_usage")
    r["worker_count"]               = _clip(raw_data.get("worker_count"),               "worker_count")
    r["energy_consumption"]         = _clip(raw_data.get("energy_consumption"),         "energy_consumption")
    r["task_progress"]              = _clip(raw_data.get("task_progress"),              "task_progress")
    r["cost_deviation"]             = _clip(raw_data.get("cost_deviation"),             "cost_deviation")
    r["safety_incidents"]           = _clip(raw_data.get("safety_incidents"),           "safety_incidents")
    r["equipment_utilization_rate"] = _clip(raw_data.get("equipment_utilization_rate"), "equipment_utilization_rate")
    r["risk_score"]                 = _clip(raw_data.get("risk_score"),                 "risk_score")
    r["simulation_deviation"]       = _clip(raw_data.get("simulation_deviation"),       "simulation_deviation")
    r["update_frequency"]           = _clip(raw_data.get("update_frequency"),           "update_frequency")

    # ── categorical features ─────────────────────────────────────
    r["machinery_status"]        = _encode_machinery(raw_data.get("machinery_status", 2))
    r["material_shortage_alert"] = _encode_shortage(raw_data.get("material_shortage_alert", 0))

    # ── engineered features (Cells 21-25) ────────────────────────
    tp  = r["task_progress"]
    wc  = r["worker_count"]
    mu  = r["material_usage"]
    ec  = r["energy_consumption"]
    tmp = r["temperature"]
    hum = r["humidity"]
    si  = r["safety_incidents"]
    rs  = r["risk_score"]

    r["worker_productivity"]  = tp / (wc  + 1)
    r["material_efficiency"]  = tp / (mu  + 1)
    r["equipment_efficiency"] = tp / (ec  + 1)
    r["environmental_stress"] = tmp * hum / 100.0
    r["safety_risk"]          = si * rs

    # ── replace any inf/-inf (Cell 27) ───────────────────────────
    for k, v in r.items():
        if not np.isfinite(float(v)):
            r[k] = np.nan

    return pd.DataFrame([r])[MODEL_FEATURE_NAMES]
