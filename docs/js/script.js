const colorImages = {
  yellow: "../images/bottles_yellow.jpeg",
  pink: "../images/bottles.jpeg",
  blue: "../images/bottles.jpeg",
};

document.querySelectorAll(".product-card").forEach((card) => {
  const image = card.querySelector("[data-product-image]");
  const colorSelect = card.querySelector("[data-color-select]");
  if (!image || !colorSelect) return;

  colorSelect.addEventListener("change", () => {
    const next = colorImages[colorSelect.value];
    if (next) image.src = next;
  });
});
