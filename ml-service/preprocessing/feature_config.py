"""
Feature configuration for SmartConstruct AI ML service.
Matches the notebook pipeline exactly:
  - Binary target: Delay (1) / No Delay (0)
  - Drops: time_deviation, performance_score, optimization_suggestion, timestamp
  - Engineers: worker_productivity, material_efficiency, equipment_efficiency,
               environmental_stress, safety_risk
  - Extracts from timestamp: hour, day, dayofweek, month
"""

# ── Raw API input fields (what the frontend sends) ─────────────────
RAW_INPUT_FIELDS = [
    "timestamp",
    "temperature",
    "humidity",
    "vibration_level",
    "material_usage",
    "machinery_status",
    "worker_count",
    "energy_consumption",
    "task_progress",
    "cost_deviation",
    "time_deviation",
    "safety_incidents",
    "equipment_utilization_rate",
    "material_shortage_alert",
    "risk_score",
    "simulation_deviation",
    "update_frequency",
    "optimization_suggestion",
    "performance_score",
]

# ── Features the MODEL was trained on (after notebook preprocessing) ─
# Order must match X_train.columns exactly as produced by the notebook.
MODEL_FEATURE_NAMES = [
    "temperature",
    "humidity",
    "vibration_level",
    "material_usage",
    "machinery_status",
    "worker_count",
    "energy_consumption",
    "task_progress",
    "cost_deviation",
    "safety_incidents",
    "equipment_utilization_rate",
    "material_shortage_alert",
    "risk_score",
    "simulation_deviation",
    "update_frequency",
    # timestamp-derived
    "hour",
    "day",
    "dayofweek",
    "month",
    # engineered
    "worker_productivity",
    "material_efficiency",
    "equipment_efficiency",
    "environmental_stress",
    "safety_risk",
]

# ── Categorical encodings ───────────────────────────────────────────
MACHINERY_STATUS_MAP = {
    "operational": 2,
    "maintenance":  1,
    "idle":         0,
    "breakdown":   -1,
}

MATERIAL_SHORTAGE_MAP = {
    "none":     0,
    "low":      1,
    "medium":   2,
    "high":     3,
    "critical": 4,
}

OPTIMIZATION_SUGGESTION_MAP = {
    "none":     0,
    "minor":    1,
    "moderate": 2,
    "major":    3,
}

# ── Numerical ranges for clipping ──────────────────────────────────
NUMERICAL_RANGES = {
    "temperature":                (-20,    60),
    "humidity":                   (  0,   100),
    "vibration_level":            (  0,   100),
    "material_usage":             (  0,  5000),
    "worker_count":               (  0,  5000),
    "energy_consumption":         (  0, 1e6  ),
    "task_progress":              (  0,   100),
    "cost_deviation":             (-1e6,  1e6),
    "safety_incidents":           (  0,   500),
    "equipment_utilization_rate": (  0,   100),
    "material_shortage_alert":    (  0,     4),
    "risk_score":                 (  0,   100),
    "simulation_deviation":       (-1e4,  1e4),
    "update_frequency":           (  0,  1440),
}

# ── Target labels (binary) ──────────────────────────────────────────
DELAY_LABELS = {
    0: "No Delay",
    1: "Delay",
}

# ── Risk level thresholds (applied to predicted_risk_score 0-100) ───
RISK_THRESHOLDS = {
    "Low":      (  0,  25),
    "Medium":   ( 26,  50),
    "High":     ( 51,  75),
    "Critical": ( 76, 100),
}

# ── delay_risk_score weights (mirrors notebook Cell 32) ────────────
DELAY_RISK_WEIGHTS = {
    "risk_score":                 0.25,
    "cost_deviation":             0.20,
    "vibration_level":            0.15,
    "safety_incidents":           0.15,
    "equipment_utilization_rate": 0.15,  # inverted: (1 - normalised)
    "material_shortage_alert":    0.10,
}
