(function () {
  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function renderOption(product, root) {
    if (!product.colors) return "";
    const options = Object.entries(product.colors)
      .map(([value, c]) => `<option value="${esc(value)}">${esc(c.label)}</option>`)
      .join("");
    return `<div class="product-card__option">
      <label for="color-${esc(product.id)}">Color</label>
      <select id="color-${esc(product.id)}" data-color-select>${options}</select>
    </div>`;
  }

  function renderSpecs(product) {
    const specs = product.specs || product.meta;
    if (!specs?.length) return "";
    return `<p class="product-card__specs">${specs.map(esc).join(" · ")}</p>`;
  }

  function renderTags(items) {
    if (!items?.length) return "";
    return `<ul class="product-card__tags">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  function renderCare(product) {
    if (!product.instructions?.length) return "";
    return `<details class="product-card__details"><summary>Details & care</summary><p class="product-card__care">${product.instructions.map(esc).join(" · ")}</p></details>`;
  }

  function productUrl(product, root) {
    const q = new URLSearchParams({ category: product.category, id: product.id });
    return `${root}products/product.html?${q}`;
  }

  function renderCard(product, root) {
    const url = productUrl(product, root);
    const imgAttr = product.colors ? " data-product-image" : "";
    const desc = product.description
      ? `<div class="product-card__desc-wrap"><p class="product-card__description">${esc(product.description)}</p><button type="button" class="product-card__desc-toggle" data-desc-toggle>Show more</button></div>`
      : "";
    return `<article class="product-card" data-category="${esc(product.category)}">
      <div class="product-card__media">
        <a href="${url}" class="product-card__link"><img${imgAttr} src="${root}${esc(product.image)}" alt="${esc(product.alt || product.title)}" width="400" height="400" /></a>
      </div>
      <div class="product-card__body">
        <h2 class="product-card__title"><a href="${url}">${esc(product.title)}</a></h2>
        <div class="product-card__prices">
          <span class="product-card__price">₹${product.price}</span>
          ${product.wasPrice ? `<span class="product-card__price--was">₹${product.wasPrice}</span>` : ""}
        </div>
        ${renderSpecs(product)}
        ${desc}
        ${renderTags(product.perfectFor)}
        ${renderCare(product)}
        <div class="product-card__option-slot">${renderOption(product, root)}</div>
        <button class="product-card__btn" type="button" data-add-to-cart>Add to cart</button>
      </div>
    </article>`;
  }

  function initColorSelects(root, grid, products) {
    grid.querySelectorAll(".product-card").forEach((card, i) => {
      const product = products[i];
      if (!product?.colors) return;
      const image = card.querySelector("[data-product-image]");
      const select = card.querySelector("[data-color-select]");
      if (!image || !select) return;
      select.addEventListener("change", () => {
        const next = product.colors[select.value]?.image;
        if (next) image.src = `${root}${next}`;
      });
    });
  }

  function initCategoryFilter() {
    const filterBar = document.querySelector("[data-category-filter]");
    if (!filterBar) return;
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      const category = btn.dataset.filter;
      filterBar.querySelectorAll("[data-filter]").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      document.querySelectorAll(".product-grid .product-card[data-category]").forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
      });
    });
  }

  async function renderProductGrid(root, grid) {
    const category = grid.dataset.products || "all";
    const res = await fetch(`${root}data/products.json`);
    if (!res.ok) return;
    const { products } = await res.json();
    const list = category === "all" ? products : products.filter((p) => p.category === category);
    grid.innerHTML = list.map((p) => renderCard(p, root)).join("");
    initColorSelects(root, grid, list);
    initCategoryFilter();
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-desc-toggle]");
      if (!btn) return;
      const wrap = btn.closest(".product-card__desc-wrap");
      const open = wrap.classList.toggle("is-expanded");
      btn.textContent = open ? "Show less" : "Show more";
    });
  }

  window.renderProductGrid = renderProductGrid;
})();
