from flask import Flask, request, jsonify, send_from_directory, render_template

import os

app = Flask(__name__, static_folder="static", template_folder="templates")

# Serve the main HTML page
@app.route("/")
def home():
    return render_template("index.html")  # Make sure this file exists in "templates/"

# Handle predictions (hardwired for now)
@app.route('/predict', methods=['POST'])
def predict():
    # Retrieve the coordinate inputs
    lat = request.form.get('latitude')
    lon = request.form.get('longitude')

    # If neither both coordinates are provided, return an error
    if not lat or not lon:
        return jsonify({"error": "Please provide valid latitude and longitude coordinates."}), 400

    # For now, return a dummy prediction output
    return jsonify({
        "output_image": "/static/predicted_wildfire.png",
        "show_prediction": True
    })

# Serve static files correctly
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory("static", filename)

if __name__ == '__main__':
    app.run(debug=True)
