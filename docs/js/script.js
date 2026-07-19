const image = document.getElementById("product-image");
const color = document.getElementById("color");

const images = {
    yellow: "../images/bottles_yellow.jpeg",
    pink: "../images/bottles.jpeg",
    blue: "../images/bottles.jpeg"
};

color.addEventListener("change", function () {
    image.src = images[this.value];
});