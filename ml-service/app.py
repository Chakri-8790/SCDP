"""
SmartConstruct AI — Flask ML Service
Exposes prediction endpoint to the Node.js backend.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "http://localhost:3000"])


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "SmartConstruct ML Service"}), 200


@app.route("/predict", methods=["POST"])
def predict():
    try:
        raw_data = request.get_json(force=True)
        if not raw_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        from prediction.predictor import predict as run_predict
        result = run_predict(raw_data)

        return jsonify({"success": True, "data": result}), 200

    except FileNotFoundError as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "hint": "Run: python training/train.py to train the model first."
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Prediction error: {str(e)}"}), 500


@app.route("/model/info", methods=["GET"])
def model_info():
    try:
        import json
        meta_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "model_meta.json")
        if not os.path.exists(meta_path):
            return jsonify({"success": False, "message": "Model not trained yet"}), 503
        with open(meta_path) as f:
            meta = json.load(f)
        return jsonify({"success": True, "data": meta}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/model/feature-importance", methods=["GET"])
def feature_importance():
    try:
        import json
        meta_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "model_meta.json")
        if not os.path.exists(meta_path):
            return jsonify({"success": False, "message": "Model not trained yet"}), 503
        with open(meta_path) as f:
            meta = json.load(f)
        importances = meta.get("feature_importances", {})
        sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        result = [{"feature": k, "importance": round(v * 100, 2)} for k, v in sorted_imp]
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"SmartConstruct ML Service running on port {port}")
    print("IMPORTANT: Run 'python training/train.py' first to train the model.")
    app.run(host="0.0.0.0", port=port, debug=debug)
