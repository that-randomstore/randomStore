(function () {
  const script = document.currentScript;
  const root = script?.dataset.root ?? "";
  const relatedPath = script?.dataset.related;
  const partialsBase = `${root}partials/`;

  async function loadHeader() {
    const target = document.getElementById("site-header");
    if (!target) return;

    const subpage = script?.dataset.subpage === "true";

    try {
      const response = await fetch(`${partialsBase}header.html`);
      if (!response.ok) return;
      let html = await response.text();
      html = html.replaceAll("{{ROOT}}", root);
      html = html.replace(
        "{{HEADER_INNER_MODIFIER}}",
        subpage ? "site-header__inner--subpage" : "site-header__inner--home"
      );
      html = html.replace(
        "{{HEADER_BRAND}}",
        subpage
          ? `<a href="${root}index.html" class="site-header__brand" aria-label="That Random Store home">
              <img src="${root}images/logo.png" alt="" class="site-header__brand-logo" width="44" height="44" />
              <span class="site-header__brand-text">That Random Store</span>
            </a>`
          : ""
      );
      target.innerHTML = html;
    } catch {
      /* offline or file:// */
    }
  }

  async function loadPartial(relativePath, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
      const response = await fetch(relativePath);
      if (!response.ok) return;
      let html = await response.text();
      html = html.replaceAll("{{ROOT}}", root);
      target.innerHTML = html;
    } catch {
      /* offline or file:// — partials require a local server or GitHub Pages */
    }
  }

  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      items.forEach((el) => el.classList.add("reveal--visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  async function boot() {
    const tasks = [
      loadHeader(),
      loadPartial(`${partialsBase}footer.html`, "site-footer"),
    ];

    if (relatedPath) {
      tasks.push(loadPartial(`${root}${relatedPath}`, "related-section"));
    }

    await Promise.all(tasks);
    await loadProducts(root);
    initScrollReveal();
    await loadStoreConfig(root);
    await loadScript(`${root}js/cart.js`);
    window.initStoreCart?.();
  }

  async function loadProducts(root) {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) return;
    try {
      await loadScript(`${root}js/products.js`);
      await window.renderProductGrid?.(root, grid);
    } catch {
      /* offline or file:// */
    }
  }

  async function loadStoreConfig(root) {
    try {
      await loadScript(`${root}js/store-config.local.js`);
      return;
    } catch {
      /* no local file */
    }
    await loadScript(`${root}js/store-config.example.js`);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(el);
    });
  }

  boot();
})();
