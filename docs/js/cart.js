(function () {
  const STORAGE_KEY = "trs_cart_v1";

  function config() {
    return window.STORE_CONFIG || { storeName: "That Random Store", whatsappNumber: "", currencySymbol: "₹" };
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function formatMoney(amount) {
    const n = Number(amount);
    if (Number.isNaN(n)) return "";
    return `${config().currencySymbol}${n.toLocaleString("en-IN")}`;
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function cartCount(items) {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  function cartTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function productFromCard(card) {
    const titleEl = card.querySelector(".product-card__title");
    const priceEl = card.querySelector(".product-card__price");
    const imgEl = card.querySelector(".product-card__media img");
    const colorSelect = card.querySelector("[data-color-select]");

    const name = titleEl?.textContent?.trim() || "Product";
    const priceText = priceEl?.textContent?.replace(/[^\d.]/g, "") || "0";
    const price = Number.parseFloat(priceText) || 0;
    const option = colorSelect?.value ? { color: colorSelect.options[colorSelect.selectedIndex].text } : null;
    const optionKey = option ? `-${slugify(option.color)}` : "";
    const id = `${slugify(window.location.pathname)}-${slugify(name)}${optionKey}`;

    let image = imgEl?.getAttribute("src") || "";
    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, window.location.href).pathname;
      } catch {
        /* keep relative */
      }
    }

    return { id, name, price, image, option };
  }

  function addItem(product) {
    const items = loadCart();
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        option: product.option,
        quantity: 1,
      });
    }
    saveCart(items);
    return items;
  }

  function updateQuantity(id, delta) {
    let items = loadCart();
    const item = items.find((i) => i.id === id);
    if (!item) return items;
    item.quantity += delta;
    if (item.quantity <= 0) items = items.filter((i) => i.id !== id);
    saveCart(items);
    return items;
  }

  function removeItem(id) {
    const items = loadCart().filter((i) => i.id !== id);
    saveCart(items);
    return items;
  }

  function clearCart() {
    saveCart([]);
    return [];
  }

  function createOrderId() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TRS-${y}${m}${day}-${rand}`;
  }

  function buildWhatsAppUrl(items, orderId, details) {
    const { storeName, whatsappNumber } = config();
    if (!whatsappNumber) return null;

    const ref = orderId || createOrderId();
    const lines = [
      `*Order reference: ${ref}*`,
      "",
      `Hi ${storeName}! I'd like to place an order:`,
      "",
      ...items.map((item, index) => {
        const opt = item.option?.color ? ` (${item.option.color})` : "";
        return `${index + 1}. ${item.name}${opt} × ${item.quantity} — ${formatMoney(item.price * item.quantity)}`;
      }),
      "",
      `*Total: ${formatMoney(cartTotal(items))}*`,
      "",
      "*Delivery details:*",
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      `Email: ${details.email || "—"}`,
      `Address: ${details.address}`,
      "",
      "Please confirm my order. Thank you!",
    ];

    const text = encodeURIComponent(lines.join("\n"));
    return { url: `https://wa.me/${whatsappNumber}?text=${text}`, orderId: ref };
  }

  let els = {};

  function ensureDom() {
    if (document.getElementById("cart-drawer")) return;

    const root = document.createElement("div");
    root.id = "cart-root";
    root.innerHTML = `
      <div class="cart-backdrop" data-cart-close hidden></div>
      <aside id="cart-drawer" class="cart-drawer" aria-hidden="true" aria-labelledby="cart-drawer-title">
        <header class="cart-drawer__header">
          <h2 id="cart-drawer-title" class="cart-drawer__title">Your cart</h2>
          <button type="button" class="cart-drawer__close" data-cart-close aria-label="Close cart">&times;</button>
        </header>
        <div class="cart-drawer__body">
          <div data-cart-items></div>
          <form class="cart-checkout" id="cart-checkout-form" data-cart-checkout hidden novalidate>
            <p class="cart-checkout__title">Delivery details</p>
            <label class="cart-checkout__field">
              <span>Name</span>
              <input type="text" name="name" required autocomplete="name" />
            </label>
            <label class="cart-checkout__field">
              <span>Phone</span>
              <input type="tel" name="phone" required autocomplete="tel" />
            </label>
            <label class="cart-checkout__field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" />
            </label>
            <label class="cart-checkout__field">
              <span>Address</span>
              <textarea name="address" rows="2" required autocomplete="street-address"></textarea>
            </label>
          </form>
        </div>
        <footer class="cart-drawer__footer">
          <div class="cart-drawer__total-row">
            <span>Total</span>
            <strong data-cart-total>${formatMoney(0)}</strong>
          </div>
          <button class="cart-drawer__whatsapp" type="submit" form="cart-checkout-form" data-cart-whatsapp>
            Place order on WhatsApp
          </button>
          <p class="cart-drawer__note">Add your details, then send the order on WhatsApp for confirmation.</p>
          <button type="button" class="cart-drawer__clear" data-cart-clear>Clear cart</button>
        </footer>
      </aside>
      <div class="cart-toast" data-cart-toast hidden role="status">Added to cart</div>
    `;
    document.body.appendChild(root);

    els = {
      drawer: root.querySelector("#cart-drawer"),
      backdrop: root.querySelector(".cart-backdrop"),
      items: root.querySelector("[data-cart-items]"),
      total: root.querySelector("[data-cart-total]"),
      whatsapp: root.querySelector("[data-cart-whatsapp]"),
      checkout: root.querySelector("[data-cart-checkout]"),
      toast: root.querySelector("[data-cart-toast]"),
      counts: () => document.querySelectorAll("[data-cart-count]"),
    };
  }

  function mountHeaderButton() {
    const nav = document.querySelector(".site-header__nav");
    if (!nav || nav.querySelector("[data-cart-open]")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "site-header__cart";
    btn.setAttribute("data-cart-open", "");
    btn.setAttribute("aria-label", "Open shopping cart");
    btn.innerHTML = `Cart <span class="site-header__cart-count" data-cart-count hidden>0</span>`;
    nav.appendChild(btn);
  }

  function setDrawerOpen(open) {
    els.drawer?.setAttribute("aria-hidden", open ? "false" : "true");
    els.drawer?.classList.toggle("is-open", open);
    els.backdrop?.toggleAttribute("hidden", !open);
    document.body.classList.toggle("cart-open", open);
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message || "Added to cart";
    els.toast.removeAttribute("hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => els.toast.setAttribute("hidden", ""), 3200);
  }

  function renderCart(items) {
    if (!els.items) return;

    const count = cartCount(items);
    els.counts().forEach((el) => {
      el.textContent = String(count);
      el.toggleAttribute("hidden", count === 0);
    });

    els.total.textContent = formatMoney(cartTotal(items));

    const canCheckout = items.length > 0 && config().whatsappNumber;
    els.checkout?.toggleAttribute("hidden", !canCheckout);
    if (canCheckout) {
      els.whatsapp?.classList.remove("is-disabled");
      els.whatsapp?.removeAttribute("aria-disabled");
    } else {
      els.whatsapp?.classList.add("is-disabled");
      els.whatsapp?.setAttribute("aria-disabled", "true");
    }

    if (!items.length) {
      els.items.innerHTML = `<p class="cart-drawer__empty">Your cart is empty. Browse our categories and add something you love.</p>`;
      return;
    }

    els.items.innerHTML = items
      .map(
        (item) => `
      <article class="cart-line" data-cart-id="${item.id}">
        <div class="cart-line__info">
          <h3 class="cart-line__name">${item.name}${
            item.option?.color ? `<span class="cart-line__opt">${item.option.color}</span>` : ""
          }</h3>
          <p class="cart-line__price">${formatMoney(item.price)} each</p>
        </div>
        <div class="cart-line__actions">
          <div class="cart-qty">
            <button type="button" data-qty-minus aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-qty-plus aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-line__remove" data-cart-remove>Remove</button>
        </div>
      </article>
    `
      )
      .join("");
  }

  function refresh() {
    renderCart(loadCart());
  }

  function bindEvents() {
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-cart-checkout]");
      if (!form) return;
      event.preventDefault();
      if (els.whatsapp?.classList.contains("is-disabled")) return;

      const items = loadCart();
      if (!items.length) return;
      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const details = {
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
        address: String(data.get("address") || "").trim(),
      };

      const result = buildWhatsAppUrl(items, null, details);
      if (!result) return;
      window.open(result.url, "_blank", "noopener,noreferrer");
      showToast(`Reference ${result.orderId} — sent on WhatsApp`);
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-cart-open]")) {
        setDrawerOpen(true);
        return;
      }
      if (event.target.closest("[data-cart-close]")) {
        setDrawerOpen(false);
        return;
      }

      const addBtn = event.target.closest("[data-add-to-cart]");
      if (addBtn) {
        const card = addBtn.closest(".product-card");
        if (!card) return;
        addItem(productFromCard(card));
        refresh();
        showToast("Added to cart");
        addBtn.classList.add("is-added");
        window.setTimeout(() => addBtn.classList.remove("is-added"), 600);
        return;
      }

      const line = event.target.closest(".cart-line");
      if (line) {
        const id = line.getAttribute("data-cart-id");
        if (event.target.closest("[data-qty-plus]")) {
          updateQuantity(id, 1);
          refresh();
        } else if (event.target.closest("[data-qty-minus]")) {
          updateQuantity(id, -1);
          refresh();
        } else if (event.target.closest("[data-cart-remove]")) {
          removeItem(id);
          refresh();
        }
        return;
      }

      if (event.target.closest("[data-cart-clear]")) {
        clearCart();
        refresh();
        return;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    });
  }

  function mountFooterWhatsApp() {
    const link = document.querySelector("[data-footer-whatsapp]");
    if (!link) return;
    const { whatsappNumber } = config();
    if (!whatsappNumber) {
      link.closest(".site-footer__item")?.remove();
      return;
    }
    const text = encodeURIComponent("Hi, can I get some assitance.");
    link.href = `https://wa.me/${whatsappNumber}?text=${text}`;
  }

  function initStoreCart() {
    ensureDom();
    mountHeaderButton();
    mountFooterWhatsApp();
    bindEvents();
    refresh();
  }

  window.initStoreCart = initStoreCart;
})();
