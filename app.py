from pathlib import Path

import pandas as pd
from flask import Flask, render_template, request
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "market_prices.csv"


def load_training_data():
    df = pd.read_csv(DATA_PATH)

    if df.empty:
        raise ValueError("Training data file is empty.")

    required_columns = {"crop", "state", "district", "price"}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(f"Training data is missing columns: {sorted(missing_columns)}")

    df = df.copy()
    df["crop_state"] = df["crop"].astype(str) + " | " + df["state"].astype(str)
    return df


def build_model():
    data = load_training_data()

    features = data[["crop", "state", "district", "crop_state"]]
    target = data["price"]

    categorical_features = ["crop", "state", "district", "crop_state"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("regressor", ExtraTreesRegressor(n_estimators=500, random_state=42)),
        ]
    )

    model.fit(features, target)

    cv_score = cross_val_score(model, features, target, cv=5, scoring="r2").mean()
    return model, data, cv_score


MODEL, TRAINING_DATA, MODEL_SCORE = build_model()


@app.context_processor
def inject_global_template_data():
    valid_crops = sorted({value.strip() for value in TRAINING_DATA["crop"].astype(str).tolist()})
    valid_states = sorted({value.strip() for value in TRAINING_DATA["state"].astype(str).tolist()})
    
    selected_crop = ""
    selected_state = ""
    selected_district = ""
    if request.method == "POST":
        selected_crop = request.form.get("crop", "").strip()
        selected_state = request.form.get("state", "").strip()
        selected_district = request.form.get("district", "").strip()
        
    crop_averages = {k: int(round(v)) for k, v in TRAINING_DATA.groupby("crop")["price"].mean().to_dict().items()}
        
    return {
        "crops": valid_crops,
        "states": valid_states,
        "selected_crop": selected_crop,
        "selected_state": selected_state,
        "selected_district": selected_district,
        "crop_averages": crop_averages,
        "prediction": None,
        "predicted_price": None,
        "confidence": None
    }


def validate_inputs(crop, state, district):
    errors = []

    crop = (crop or "").strip()
    state = (state or "").strip()
    district = (district or "").strip()

    valid_crops = {value.strip() for value in TRAINING_DATA["crop"].astype(str).tolist()}
    valid_states = {value.strip() for value in TRAINING_DATA["state"].astype(str).tolist()}

    if not crop:
        errors.append("Please select a crop.")
    elif crop not in valid_crops:
        errors.append("Selected crop is not available in the training data.")

    if not state:
        errors.append("Please select a state.")
    elif state not in valid_states:
        errors.append("Selected state is not available in the training data.")

    if not district:
        errors.append("Please enter a district name.")
    elif not district.replace(" ", "").isalpha():
        errors.append("District should contain only letters.")

    return crop, state, district, errors


def calculate_confidence(crop, state, district):
    base_confidence = max(0, min(95, int(round((MODEL_SCORE + 1) * 50))))

    exact_matches = (
        (TRAINING_DATA["crop"].astype(str).str.strip() == crop)
        & (TRAINING_DATA["state"].astype(str).str.strip() == state)
        & (TRAINING_DATA["district"].astype(str).str.strip() == district)
    ).sum()

    crop_state_matches = (
        (TRAINING_DATA["crop"].astype(str).str.strip() == crop)
        & (TRAINING_DATA["state"].astype(str).str.strip() == state)
    ).sum()

    crop_matches = (TRAINING_DATA["crop"].astype(str).str.strip() == crop).sum()

    if exact_matches > 0:
        return max(base_confidence, 92)
    if crop_state_matches > 0:
        return max(base_confidence, 82)
    if crop_matches > 0:
        return max(base_confidence, 70)
    return base_confidence


def predict_price(crop, state, district):
    input_data = pd.DataFrame(
        [{"crop": crop, "state": state, "district": district, "crop_state": f"{crop} | {state}"}]
    )
    predicted_value = float(MODEL.predict(input_data)[0])
    confidence = calculate_confidence(crop, state, district)
    return predicted_value, confidence


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    crop = request.form.get("crop", "")
    state = request.form.get("state", "")
    district = request.form.get("district", "")

    crop, state, district, errors = validate_inputs(crop, state, district)

    if errors:
        return render_template(
            "index.html",
            prediction="Please correct the following errors: " + "; ".join(errors),
            predicted_price=None,
            confidence=None,
        )

    predicted_price, confidence = predict_price(crop, state, district)
    prediction = (
        f"Predicted price for {crop} in {district}, {state} is "
        f"₹{int(round(predicted_price))} per Quintal."
    )

    return render_template(
        "index.html",
        prediction=prediction,
        predicted_price=int(round(predicted_price)),
        confidence=confidence,
    )


if __name__ == "__main__":
    app.run(debug=True)