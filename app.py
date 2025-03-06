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
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    return jsonify({"output_image": "/static/predicted_wildfire.png"})

# Serve static files correctly
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory("static", filename)

if __name__ == '__main__':
    app.run(debug=True)
