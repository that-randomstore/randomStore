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

const categoryFilter = document.querySelector("[data-category-filter]");
if (categoryFilter) {
  const cards = document.querySelectorAll(".product-grid .product-card[data-category]");
  categoryFilter.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const category = btn.dataset.filter;
    categoryFilter.querySelectorAll("[data-filter]").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    cards.forEach((card) => {
      card.hidden = category !== "all" && card.dataset.category !== category;
    });
  });
}
