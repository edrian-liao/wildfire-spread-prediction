### ECE 487 Project - Wildfire Spread Prediction

**John Yoo, Shun Sakai, Edrian Liao, Burak Donbekci**

---

🔥 **Wildfire Spread Prediction — Local Web App**

This is a local MVP for visualizing wildfire spread predictions. It combines satellite-inspired fire data visualization with a user-friendly web interface, allowing users to select coordinates, view precomputed predictions, and access relevant response resources.

---

🌍 **Features**

- Leaflet map for selecting fire locations  
- Auto-generated bounding box over valid fire areas  
- Predicted wildfire spread images with labeled context  
- Real-time insights about pixel growth and influential factors  
- Right-aligned 2x2 resource panel linking to FEMA, CAL FIRE, etc.

---

🛠️ **How to Run Locally**

1. Clone the repository and switch to the `burak_webapp` branch:
   git clone https://github.com/edrian-liao/wildfire-spread-prediction.git
   cd wildfire-spread-prediction
   git checkout burak_webapp
2. pip install flask
3. python app.py


<pre>
wildfire-spread-prediction/
├── app.py
├── templates/
│   └── index.html
├── static/
│   ├── script.js
│   ├── style.css
│   ├── Prediction Images/
│   │   └── pred_plot_1.png, pred_plot_2.png, ...
│   └── icons/
│       ├── firetruck.png
│       ├── waterdrop.png
│       ├── helicopter.png
│       └── fema.png
</pre>

---

📌 **Notes**

- Predictions are rotated from a folder of static PNGs (pred_plot_1.png, etc.). 
- All predictions include current, true next-day, and model-predicted overlays.
- The app is not yet deployed — it’s designed to run locally for demos or prototyping.

---
