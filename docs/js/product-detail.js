(function () {
  const CATEGORIES = {
    bottles: { label: "Bottles", page: "bottles.html" },
    sippers: { label: "Sippers", page: "sippers.html" },
    kitchenware: { label: "Kitchen Ware", page: "insulation-pads.html" },
    "gift-boxes": { label: "Gift Boxes", page: "giftBoxes.html" },
  };

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function colorImages(color) {
    if (Array.isArray(color?.images) && color.images.length) return color.images.slice();
    if (color?.image) return [color.image];
    return [];
  }

  function productImages(product, colorKey) {
    if (product.colors) {
      const color = colorKey ? product.colors[colorKey] : Object.values(product.colors)[0];
      const files = colorImages(color);
      if (files.length) return files;
    }
    if (Array.isArray(product.images) && product.images.length) return product.images.slice();
    return [product.image];
  }

  function initManualCarousel(container, files, root, alt) {
    const label = alt || "Product";
    if (files.length <= 1) {
      container.innerHTML = `<img src="${root}${esc(files[0])}" alt="${esc(label)}" width="640" height="640" data-product-image />`;
      return {
        setPrimary(src) {
          const img = container.querySelector("[data-product-image]");
          if (img) img.src = `${root}${src}`;
        },
      };
    }

    container.classList.add("feature-slideshow");
    const viewport = document.createElement("div");
    viewport.className = "feature-slideshow__viewport";

    const track = document.createElement("div");
    track.className = "feature-slideshow__track";

    files.forEach((file, index) => {
      const slide = document.createElement("div");
      slide.className = "feature-slideshow__frame";
      const img = document.createElement("img");
      img.src = `${root}${file}`;
      img.alt = `${label} — photo ${index + 1} of ${files.length}`;
      img.width = 640;
      img.height = 640;
      img.loading = index === 0 ? "eager" : "lazy";
      if (index === 0) img.setAttribute("data-product-image", "");
      slide.appendChild(img);
      track.appendChild(slide);
    });

    viewport.appendChild(track);

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "feature-slideshow__nav feature-slideshow__nav--prev";
    prev.setAttribute("aria-label", "Previous image");
    prev.innerHTML = "&#8249;";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "feature-slideshow__nav feature-slideshow__nav--next";
    next.setAttribute("aria-label", "Next image");
    next.innerHTML = "&#8250;";

    const dots = document.createElement("div");
    dots.className = "feature-slideshow__dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", `${label} gallery`);

    const dotButtons = files.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "feature-slideshow__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Show image ${index + 1}`);
      dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
      if (index === 0) dot.classList.add("is-active");
      dots.appendChild(dot);
      return dot;
    });

    container.replaceChildren(viewport, prev, next, dots);

    let current = 0;

    function applySlide(index) {
      current = (index + files.length) % files.length;
      track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
      dotButtons.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }

    prev.addEventListener("click", () => applySlide(current - 1));
    next.addEventListener("click", () => applySlide(current + 1));
    dotButtons.forEach((dot, index) => dot.addEventListener("click", () => applySlide(index)));

    return {
      setPrimary(src) {
        const img = track.querySelector("[data-product-image]");
        if (img) img.src = `${root}${src}`;
      },
    };
  }

  function renderOption(product) {
    if (!product.colors) return "";
    const options = Object.entries(product.colors)
      .map(([value, c]) => `<option value="${esc(value)}">${esc(c.label)}</option>`)
      .join("");
    return `<div class="product-card__option">
      <label for="color-${esc(product.id)}">Color</label>
      <select id="color-${esc(product.id)}" data-color-select>${options}</select>
    </div>`;
  }

  function renderTags(items) {
    if (!items?.length) return "";
    return `<ul class="product-card__tags">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  async function renderProductDetail(root, main) {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const id = params.get("id");
    if (!category || !id) {
      main.innerHTML = `<nav class="product-detail__nav"><a href="${root}products/allProducts.html" class="product-detail__back">← Back to all products</a></nav><p class="product-detail__missing">Product not found. <a href="${root}products/allProducts.html">Browse all products</a></p>`;
      return;
    }

    const res = await fetch(`${root}data/products.json`);
    if (!res.ok) return;
    const { products } = await res.json();
    const product = products.find((p) => p.category === category && p.id === id);
    if (!product) {
      main.innerHTML = `<nav class="product-detail__nav"><a href="${root}products/allProducts.html" class="product-detail__back">← Back to all products</a></nav><p class="product-detail__missing">Product not found. <a href="${root}products/allProducts.html">Browse all products</a></p>`;
      return;
    }

    const cat = CATEGORIES[product.category] || { label: product.category, page: "allProducts.html" };
    const catHref = cat.page.startsWith("../") ? `${root}${cat.page.slice(3)}` : `${root}products/${cat.page}`;
    const specs = product.specs || product.meta;
    const specsHtml = specs?.length ? `<p class="product-card__specs">${specs.map(esc).join(" · ")}</p>` : "";
    const careHtml = product.instructions?.length
      ? `<details class="product-card__details" open><summary>Details & care</summary><p class="product-card__care">${product.instructions.map(esc).join(" · ")}</p></details>`
      : "";

    document.title = `${product.title} | That Random Store`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && product.description) meta.setAttribute("content", product.description.slice(0, 160));

    main.innerHTML = `<nav class="product-detail__nav" aria-label="Product navigation">
        <a href="${catHref}" class="product-detail__back">← Back to ${esc(cat.label)}</a>
      </nav>
      <article class="product-detail product-card" data-category="${esc(product.category)}">
      <div class="product-detail__media product-card__media" data-product-gallery></div>
      <div class="product-detail__info product-card__body">
        <p class="product-detail__breadcrumb">
          <a href="${root}index.html">Home</a> /
          <a href="${catHref}">${esc(cat.label)}</a> /
          ${esc(product.title)}
        </p>
        <h1 class="product-detail__title product-card__title">${esc(product.title)}</h1>
        <div class="product-card__prices">
          <span class="product-card__price">₹${product.price}</span>
          ${product.wasPrice ? `<span class="product-card__price--was">₹${product.wasPrice}</span>` : ""}
        </div>
        ${specsHtml}
        ${product.description ? `<p class="product-detail__description">${esc(product.description)}</p>` : ""}
        ${renderTags(product.perfectFor)}
        ${careHtml}
        <div class="product-card__option-slot">${renderOption(product)}</div>
        <button class="product-detail__btn product-card__btn" type="button" data-add-to-cart>Add to cart</button>
      </div>
    </article>`;

    const gallery = main.querySelector("[data-product-gallery]");
    const label = product.alt || product.title;
    initManualCarousel(gallery, productImages(product), root, label);

    if (product.colors) {
      const select = main.querySelector("[data-color-select]");
      select?.addEventListener("change", () => {
        initManualCarousel(gallery, productImages(product, select.value), root, label);
      });
    }
  }

  window.renderProductDetail = renderProductDetail;
})();
