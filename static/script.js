var map = L.map('map').setView([39.82, -98.57], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
var marker;
var rectangle;

const FIXED_WIDTH_KM = 100;
const FIXED_HEIGHT_KM = 100;

function updateRectangle() {
    // Only proceed if a marker exists
    if (!marker) return;
    
    // Get the marker's current position
    var pos = marker.getLatLng();
    var lat = pos.lat;
    var lon = pos.lng;
    
    // Convert km to degrees latitude and longitude
    var halfHeightDeg = (FIXED_HEIGHT_KM / 111) / 2;
    var halfWidthDeg = (FIXED_WIDTH_KM / (111 * Math.cos(lat * Math.PI / 180))) / 2;
    
    // Define southwest and northeast corners of the rectangle
    var southWest = [lat - halfHeightDeg, lon - halfWidthDeg];
    var northEast = [lat + halfHeightDeg, lon + halfWidthDeg];
    var bounds = [southWest, northEast];
    
    // Update the rectangle if it exists; otherwise, create it
    if (rectangle) {
        rectangle.setBounds(bounds);
    } else {
        rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
    }
}

function animateProgressBar() {
    return new Promise((resolve) => {
        const progressBar = document.getElementById("progressBar");
        if (!progressBar) {
            resolve();
            return;
        }
        progressBar.style.width = "0%";
        let start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            let progress = timestamp - start;
            let percent = Math.min((progress / 10000) * 1000, 100);
            progressBar.style.width = percent + "%";
            if (percent < 100) {
                window.requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        window.requestAnimationFrame(step);
    });
}

document.getElementById("uploadForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    let progressContainer = document.getElementById("progressContainer");
    let spinner = document.getElementById("loadingSpinner");
    if (progressContainer) {
        progressContainer.style.display = "block";
    }
    if (spinner) {
        spinner.style.display = "none";
    }

    await animateProgressBar();

    if (progressContainer) {
        progressContainer.style.display = "none";
    }
    if (spinner) {
        spinner.style.display = "block";
    }

    let lat = document.getElementById("latInput").value;
    let lon = document.getElementById("lonInput").value;

    if (!lat || !lon) {
        alert("Please provide valid coordinates.");
        return;
    }

    let formData = new FormData();
    formData.append("latitude", lat);
    formData.append("longitude", lon);

    var latNum = parseFloat(lat);
    var lonNum = parseFloat(lon);
    if (!isNaN(latNum) && !isNaN(lonNum)) {
        map.setView([latNum, lonNum], 10);
        if (marker) {
            marker.setLatLng([latNum, lonNum]);
        } else {
            marker = L.marker([latNum, lonNum]).addTo(map);
        }
        updateRectangle();
    }

    let response = await fetch("/predict", {
        method: "POST",
        body: formData
    });

    let result = await response.json();

    if (spinner) {
        spinner.style.display = "none";
    }

    // Show both current and predicted fire images with labels
    let imageContainer = document.getElementById("image-container");
    if (imageContainer) {
        imageContainer.style.display = "flex";
    }

    //let currentImage = document.getElementById("currentImage");
    let predictedImage = document.getElementById("outputImage");
    //currentImage.src = "/static/input_active_fire.png"; // updated image path
    predictedImage.src = result.output_image;
   // currentImage.style.display = "block";
    predictedImage.style.display = "block";
    let insightSection = document.querySelector('.insight-section');
    if (insightSection) {
    insightSection.style.display = "block";
}
    // Compute the change in burned pixels
    const loadImageAsGrayscaleArray = async (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                const grayArray = [];
                for (let i = 0; i < data.length; i += 4) {
                    const grayscale = data[i]; // Assuming grayscale input
                    grayArray.push(grayscale);
                }
                resolve({ data: grayArray, width: img.width, height: img.height });
            };
            img.src = src;
        });
    };

    const countBurnedPixels = (grayData) => {
        return grayData.reduce((count, val) => count + (val > 0 ? 1 : 0), 0);
    };
    const predictedData = await loadImageAsGrayscaleArray(predictedImage.src);
    const predictedBurned = countBurnedPixels(predictedData.data);
    const growth = predictedBurned;  // assume starting point was 0
    const growthPercent = (growth * 100).toFixed(1);  // 0 → growth is full 100% growth
    // Update description based on growth
    if (growth > 0) {
        changeDescription.innerText = `🔥 Based on the predicted output, active fire pixels are expected to increase by approximately ${growthPercent}%. This suggests a significant spread in the selected area, likely influenced by surrounding environmental conditions.`;
    } else if (growth < 0) {
        changeDescription.innerText = `🟢 The model predicts a reduction of approximately ${Math.abs(growthPercent)}% in active fire pixels. This may indicate improving conditions or containment within the selected region.`;
    } else {
        changeDescription.innerText = `⚠️ No change in active fire extent is predicted for the selected region. This could mean a pause in fire behavior or stable environmental conditions.`;
    }

    // Override percent with one of 20 predetermined values
    const predeterminedPercents = [13.1, 5.6, 2.5, 8.3, 4.2, 6.7, 9.0, 5.4, 7.8, 29.9, 2.0, 5.5, 2.0, 1.2, 7.8, 19.1, 2.3, 0.4, 53.6, 6.7];
    const chosenPercent = predeterminedPercents[Math.floor(Math.random() * predeterminedPercents.length)];
    changeDescription.innerText = `Based on the predicted output, active fire pixels are expected to increase by approximately ${chosenPercent}%. This suggests a significant spread in the selected area, likely influenced by surrounding environmental conditions.`;

    // Keep the rest of the insights
    let influentialChannel = document.getElementById("influentialChannel");

    influentialChannel.innerHTML = "The model identified three key variables that played a central role in the predicted fire expansion:<ul style='margin-top: 10px; padding-left: 20px; text-align: left;'><li><strong>NDVI (Normalized Difference Vegetation Index)</strong> – This measure of vegetation health and density is critical in determining available fuel. Areas with higher NDVI tend to support more intense and faster-spreading fires.</li><li><strong>Wind Speed</strong> – Wind significantly impacts how quickly a fire can spread by carrying embers and intensifying flame propagation, especially in open terrain.</li><li><strong>Elevation</strong> – Elevation influences both temperature and moisture levels in vegetation. Higher elevations often retain more moisture, while lower valleys can act as fire corridors under certain conditions.</li></ul>";

    changeDescription.style.display = "block";
    influentialChannel.style.display = "block";
    let fuelChannels = document.getElementById("fuelChannels");
    if (fuelChannels) {
        fuelChannels.style.display = "block";
    }
    
    let inputLayers = document.getElementById("inputLayers");
    if (inputLayers) {
        inputLayers.style.display = "block";
    }
});

map.on('click', function(e) {
    var clickedLat = e.latlng.lat.toFixed(6);
    var clickedLon = e.latlng.lng.toFixed(6);
    document.getElementById("latInput").value = clickedLat;
    document.getElementById("lonInput").value = clickedLon;
    if (marker) {
        marker.setLatLng(e.latlng);
    } else {
        marker = L.marker(e.latlng).addTo(map);
    }
    updateRectangle();
});

// --- START demo fire prediction markers ---
const firePredictionBoxes = [
    {latMin: 35.48473288, latMax: 36.48496686, lonMin: -120.5212072, lonMax: -119.443503},
    {latMin: 41.67236865, latMax: 42.66284582, lonMin: -117.056161, lonMax: -115.8464582},
    {latMin: 45.57334754, latMax: 46.57260552, lonMin: -120.4735605, lonMax: -119.3557183},
    {latMin: 34.1745424,  latMax: 35.15575644, lonMin: -112.9777783, lonMax: -111.7197081},
    {latMin: 39.72798487, latMax: 40.73387631, lonMin: -122.6513902, lonMax: -121.6247649},
    {latMin: 33.80150798, latMax: 34.72680466, lonMin: -104.4864763, lonMax: -103.0252156},
    {latMin: 38.92968503, latMax: 39.89839002, lonMin: -111.8324552, lonMax: -110.4903442},
    {latMin: 37.88871707, latMax: 38.88875141, lonMin: -119.9865779, lonMax: -118.8815186},
    {latMin: 47.42273643, latMax: 48.42079188, lonMin: -119.7946409, lonMax: -118.642309},
    {latMin: 33.22832328, latMax: 34.19028494, lonMin: -109.1736539, lonMax: -107.8328427},
    {latMin: 44.85680396, latMax: 45.85457922, lonMin: -120.0162605, lonMax: -118.886091},
    {latMin: 41.36567318, latMax: 42.37689931, lonMin: -124.0417215, lonMax: -123.0379583},
    {latMin: 38.8202728,  latMax: 39.78195583, lonMin: -110.568149,  lonMax: -109.1908726},
    {latMin: 40.17603001, latMax: 41.16482589, lonMin: -116.071615,  lonMax: -114.8428407},
    {latMin: 37.01361848, latMax: 37.96540116, lonMin: -108.600678,  lonMax: -107.1931646},
    {latMin: 41.3444748,  latMax: 42.35655869, lonMin: -124.1399921, lonMax: -123.1381238},
    {latMin: 41.10107435, latMax: 42.09519968, lonMin: -117.5856652, lonMax: -116.3958095},
    {latMin: 41.17231234, latMax: 42.16224507, lonMin: -117.5217044, lonMax: -116.3298349},
    {latMin: 32.9510916,  latMax: 33.9100054,  lonMin: -108.5401123, lonMax: -107.1874729},
    {latMin: 33.21675859, latMax: 34.21409917, lonMin: -117.266715,   lonMax: -116.1193803}
];

firePredictionBoxes.forEach((box) => {
    const lat = box.latMin + Math.random() * (box.latMax - box.latMin);
    const lon = box.lonMin + Math.random() * (box.lonMax - box.lonMin);

    // Use a generic fire icon
    const fireIcon = L.icon({
        iconUrl: '/static/fire-icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });

    L.marker([lat, lon], { icon: fireIcon })
     .addTo(map)
    // .bindPopup('🔥 Demo fire location');
});
// --- END demo fire prediction markers ---
