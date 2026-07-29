(function () {
  const SLIDE_MS = 4000;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initSlideshow(container, filenames, imagesBase) {
    if (!filenames?.length) return;

    const label =
      container.getAttribute("data-alt") ||
      container.closest(".feature-row")?.querySelector(".feature-row__title")?.textContent ||
      "Product";

    const viewport = document.createElement("div");
    viewport.className = "feature-slideshow__viewport";

    const track = document.createElement("div");
    track.className = "feature-slideshow__track";

    filenames.forEach((file, index) => {
      const slide = document.createElement("div");
      slide.className = "feature-slideshow__frame";

      const img = document.createElement("img");
      img.src = `${imagesBase}${file}`;
      img.alt = `${label} — photo ${index + 1} of ${filenames.length}`;
      img.width = 640;
      img.height = 400;
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";

      slide.appendChild(img);
      track.appendChild(slide);
    });

    viewport.appendChild(track);

    const dots = document.createElement("div");
    dots.className = "feature-slideshow__dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", `${label} slideshow`);

    const dotButtons = filenames.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "feature-slideshow__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Show slide ${index + 1}`);
      dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
      if (index === 0) dot.classList.add("is-active");
      dots.appendChild(dot);
      return dot;
    });

    container.replaceChildren(viewport, dots);

    let current = 0;
    let timer = null;
    const multi = filenames.length > 1;

    function applySlide(index) {
      current = (index + filenames.length) % filenames.length;
      track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
      dotButtons.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }

    function next() {
      applySlide(current + 1);
    }

    function startAutoplay() {
      if (!multi || prefersReducedMotion()) return;
      stopAutoplay();
      timer = window.setInterval(next, SLIDE_MS);
    }

    function stopAutoplay() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dotButtons.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        applySlide(index);
        startAutoplay();
      });
    });

    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startAutoplay();
          else stopAutoplay();
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(container);

    if (!multi) {
      dots.hidden = true;
    } else {
      applySlide(0);
      startAutoplay();
    }
  }

  async function boot() {
    const containers = document.querySelectorAll("[data-slideshow-category]");
    if (!containers.length) return;

    const manifestPath =
      document.querySelector("[data-slideshow-manifest]")?.getAttribute("data-slideshow-manifest") ||
      "data/category-images.json";

    let manifest = {};
    try {
      const res = await fetch(manifestPath);
      if (res.ok) manifest = await res.json();
    } catch {
      return;
    }

    containers.forEach((container) => {
      const category = container.getAttribute("data-slideshow-category");
      const base = container.getAttribute("data-images-base") || "images/";
      const files = manifest[category];
      if (files?.length) initSlideshow(container, files, base);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
