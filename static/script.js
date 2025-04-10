var map = L.map('map').setView([34.0522, -118.2437], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
var marker;
var rectangle;

const FIXED_WIDTH_KM = 133.5;
const FIXED_HEIGHT_KM = 115.5;

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

document.getElementById("uploadForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    let spinner = document.getElementById("loadingSpinner");
    if (spinner) {
        spinner.style.display = "block";
    }

    let file = document.getElementById("fileInput").files[0];
    let lat = document.getElementById("latInput").value;
    let lon = document.getElementById("lonInput").value;

    if (!file && (!lat || !lon)) {
        alert("Please upload an image or provide coordinates.");
        return;
    }

    if (file) {
        // Show the uploaded image
        let inputImage = document.getElementById("inputImage");
        inputImage.src = URL.createObjectURL(file);
        inputImage.style.display = "block";
    }

    let formData = new FormData();
    if (file) {
        formData.append("file", file);
    }

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

    // Show the predicted output image
    let outputImage = document.getElementById("outputImage");
    outputImage.src = result.output_image;
    outputImage.style.display = "block";

    let downloadButton = document.getElementById("downloadButton");
    if (downloadButton) {
        downloadButton.href = result.output_image;
        downloadButton.style.display = "block";
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
