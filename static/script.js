document.getElementById("uploadForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    let file = document.getElementById("fileInput").files[0];
    if (!file) {
        alert("Please upload an image.");
        return;
    }

    // Show the uploaded image
    let inputImage = document.getElementById("inputImage");
    inputImage.src = URL.createObjectURL(file);
    inputImage.style.display = "block";

    let formData = new FormData();
    formData.append("file", file);

    let response = await fetch("/predict", {
        method: "POST",
        body: formData
    });

    let result = await response.json();

    // Show the predicted output image
    let outputImage = document.getElementById("outputImage");
    outputImage.src = result.output_image;
    outputImage.style.display = "block";
});
