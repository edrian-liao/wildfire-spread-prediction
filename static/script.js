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
            let percent = Math.min((progress / 10000) * 100, 100);
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

    let currentImage = document.getElementById("currentImage");
    let predictedImage = document.getElementById("outputImage");
    currentImage.src = "/static/input_active_fire.png"; // updated image path
    predictedImage.src = result.output_image;
    currentImage.style.display = "block";
    predictedImage.style.display = "block";

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

    const currentData = await loadImageAsGrayscaleArray(currentImage.src);
    const predictedData = await loadImageAsGrayscaleArray(predictedImage.src);
    const currentBurned = countBurnedPixels(currentData.data);
    const predictedBurned = countBurnedPixels(predictedData.data);
    const growth = predictedBurned - currentBurned;
    const growthPercent = ((growth / currentBurned) * 100).toFixed(1);

    // Update description based on growth
    if (growth > 0) {
        changeDescription.innerText = `🔥 Based on the predicted output, active fire pixels are expected to increase by approximately ${growthPercent}%. This suggests a significant spread in the selected area, likely influenced by surrounding environmental conditions.`;
    } else if (growth < 0) {
        changeDescription.innerText = `🟢 The model predicts a reduction of approximately ${Math.abs(growthPercent)}% in active fire pixels. This may indicate improving conditions or containment within the selected region.`;
    } else {
        changeDescription.innerText = `⚠️ No change in active fire extent is predicted for the selected region. This could mean a pause in fire behavior or stable environmental conditions.`;
    }

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
