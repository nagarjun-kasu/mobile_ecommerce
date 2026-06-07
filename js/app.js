/* ═══════════════════════════════════════════════════════════════
   app.js — MobileHub SPA Application
   ═══════════════════════════════════════════════════════════════ */

// ── Brand → Image Mapping ─────────────────────────────────────
const BRAND_IMAGES = {
  Samsung: "/assets/images/samsung.png",
  Apple: "/assets/images/iphone.png",
  Realme: "/assets/images/realme.png",
  OnePlus: "/assets/images/oneplus.png",
  Google: "/assets/images/pixel.png",
};

const BRAND_GRADIENTS = {
  Samsung: "linear-gradient(135deg, #1a1a4e 0%, #2d2d7c 50%, #0c0c2d 100%)",
  Apple: "linear-gradient(135deg, #1c1c2e 0%, #2a2a3e 50%, #0e0e1a 100%)",
  Realme: "linear-gradient(135deg, #1a1a0e 0%, #3d2d1a 50%, #1a0e0a 100%)",
  OnePlus: "linear-gradient(135deg, #1a0e0e 0%, #2d1a1a 50%, #0e0808 100%)",
  Google: "linear-gradient(135deg, #0e1a1a 0%, #1a2d2d 50%, #080e0e 100%)",
};

// ── State ─────────────────────────────────────────────────────
const state = {
  products: [],
  brands: [],
  cart: { items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 },
  currentPage: "home",
  currentBrand: "all",
  currentSort: "",
  searchQuery: "",
  lastOrder: null,
};

// ── DOM References ────────────────────────────────────────────
const $app = document.getElementById("app");
const $cartBadge = document.getElementById("cart-badge");
const $cartSidebar = document.getElementById("cart-sidebar");
const $cartOverlay = document.getElementById("cart-overlay");
const $cartItems = document.getElementById("cart-items");
const $cartFooter = document.getElementById("cart-footer");
const $modalOverlay = document.getElementById("modal-overlay");
const $modal = document.getElementById("product-modal");
const $modalContent = document.getElementById("modal-content");
const $toastContainer = document.getElementById("toast-container");
const $searchInput = document.getElementById("search-input");

// ── Initialize App ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await Promise.all([loadProducts(), loadCart()]);
  renderPage();
}

function bindEvents() {
  // Navigation
  document.getElementById("nav-logo").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("home");
  });

  document.getElementById("nav-orders-btn").addEventListener("click", () => navigate("orders"));

  // Cart toggle
  document.getElementById("cart-toggle-btn").addEventListener("click", toggleCart);
  document.getElementById("cart-close-btn").addEventListener("click", toggleCart);
  $cartOverlay.addEventListener("click", toggleCart);

  // Modal close
  document.getElementById("modal-close").addEventListener("click", closeModal);
  $modalOverlay.addEventListener("click", closeModal);

  // Search
  let searchDebounce;
  $searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.searchQuery = e.target.value;
      if (state.currentPage !== "home") navigate("home");
      else renderProductGrid();
    }, 300);
  });

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 20);
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      if ($cartSidebar.classList.contains("active")) toggleCart();
    }
  });
}

// ── Data Loaders ──────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await API.getProducts();
    state.products = res.data;
    const brandRes = await API.getBrands();
    state.brands = brandRes.data;
  } catch (err) {
    showToast("Failed to load products", "error");
  }
}

async function loadCart() {
  try {
    const res = await API.getCart();
    state.cart = res.data;
    updateCartBadge();
  } catch (err) {
    console.error("Cart load error:", err);
  }
}

// ── Navigation ────────────────────────────────────────────────
function navigate(page, data) {
  state.currentPage = page;
  if (data) Object.assign(state, data);
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPage() {
  switch (state.currentPage) {
    case "home":
      renderHomePage();
      break;
    case "checkout":
      renderCheckoutPage();
      break;
    case "confirmation":
      renderConfirmationPage();
      break;
    case "orders":
      renderOrdersPage();
      break;
  }
}

// ══════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════
function renderHomePage() {
  $app.innerHTML = `
    ${renderHero()}
    <div class="section" id="products-section">
      <div class="section-header">
        <h2 class="section-title">Explore <span class="highlight">All Phones</span></h2>
        <div class="brand-filters" id="brand-filters">
          <button class="brand-pill ${state.currentBrand === "all" ? "active" : ""}" data-brand="all">All Brands</button>
          ${state.brands
            .map(
              (b) =>
                `<button class="brand-pill ${state.currentBrand === b ? "active" : ""}" data-brand="${b}">${b}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="controls-bar">
        <div class="result-count" id="result-count"></div>
        <select class="sort-select" id="sort-select">
          <option value="">Sort by: Featured</option>
          <option value="price_asc" ${state.currentSort === "price_asc" ? "selected" : ""}>Price: Low to High</option>
          <option value="price_desc" ${state.currentSort === "price_desc" ? "selected" : ""}>Price: High to Low</option>
          <option value="rating" ${state.currentSort === "rating" ? "selected" : ""}>Highest Rated</option>
          <option value="name" ${state.currentSort === "name" ? "selected" : ""}>Name: A-Z</option>
        </select>
      </div>
      <div class="product-grid" id="product-grid"></div>
    </div>
    <footer class="footer">
      <p class="footer-text">© 2026 MobileHub. Crafted with <span class="heart">♥</span> for mobile enthusiasts.</p>
    </footer>
  `;

  // Bind brand filters
  document.querySelectorAll(".brand-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentBrand = btn.dataset.brand;
      document.querySelectorAll(".brand-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProductGrid();
    });
  });

  // Bind sort
  document.getElementById("sort-select").addEventListener("change", (e) => {
    state.currentSort = e.target.value;
    renderProductGrid();
  });

  renderProductGrid();
}

// ── Hero ─────────────────────────────────────────────────────
function renderHero() {
  return `
    <section class="hero">
      <div class="hero-bg">
        <img src="/assets/images/hero-banner.png" alt="Hero Background" />
      </div>
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">🔥 New Arrivals 2026</div>
          <h1 class="hero-title">
            Find Your Perfect<br/>
            <span class="gradient-text">Smartphone</span>
          </h1>
          <p class="hero-subtitle">
            Discover the latest flagships from Samsung, Apple, Realme, OnePlus and Google.
            Premium devices at unbeatable prices with free express shipping.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" onclick="document.getElementById('products-section').scrollIntoView({behavior:'smooth'})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Browse Collection
            </button>
            <button class="btn btn-secondary btn-lg" onclick="navigate('orders')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              My Orders
            </button>
          </div>
          <div class="hero-stats">
            <div>
              <div class="hero-stat-value">12+</div>
              <div class="hero-stat-label">Premium Devices</div>
            </div>
            <div>
              <div class="hero-stat-value">5</div>
              <div class="hero-stat-label">Top Brands</div>
            </div>
            <div>
              <div class="hero-stat-value">Free</div>
              <div class="hero-stat-label">Express Shipping</div>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <img src="/assets/images/iphone.png" alt="Featured Phone" />
        </div>
      </div>
    </section>
  `;
}

// ── Product Grid ─────────────────────────────────────────────
function renderProductGrid() {
  let filtered = [...state.products];

  // Brand filter
  if (state.currentBrand !== "all") {
    filtered = filtered.filter((p) => p.brand === state.currentBrand);
  }

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // Sort
  if (state.currentSort === "price_asc") filtered.sort((a, b) => a.price - b.price);
  else if (state.currentSort === "price_desc") filtered.sort((a, b) => b.price - a.price);
  else if (state.currentSort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (state.currentSort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  // Update count
  const countEl = document.getElementById("result-count");
  if (countEl) {
    countEl.innerHTML = `Showing <span>${filtered.length}</span> of <span>${state.products.length}</span> devices`;
  }

  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.4;">🔍</div>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">No phones found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search or filters</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => renderProductCard(p, i)).join("");

  // Bind card clicks
  grid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".add-to-cart-btn")) return;
      openProductModal(Number(card.dataset.id));
    });
  });

  // Bind add-to-cart buttons
  grid.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAddToCart(Number(btn.dataset.id), btn);
    });
  });
}

function renderProductCard(product, index) {
  const image = BRAND_IMAGES[product.brand] || "/assets/images/samsung.png";
  const gradient = BRAND_GRADIENTS[product.brand] || BRAND_GRADIENTS.Samsung;
  const badgeClass = product.badge
    ? `badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`
    : "";
  const savings = product.originalPrice > product.price
    ? (product.originalPrice - product.price).toFixed(0)
    : null;

  return `
    <div class="product-card" data-id="${product.id}" style="animation-delay: ${index * 0.05}s">
      <div class="product-card-image">
        <div class="card-bg" style="background: ${gradient};"></div>
        ${product.badge ? `<span class="product-badge ${badgeClass}">${product.badge}</span>` : ""}
        <img src="${image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <div class="product-card-brand">${product.brand}</div>
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-spec">${product.specs.processor} · ${product.specs.ram} RAM</div>
        <div class="product-card-rating">
          <span class="stars">${renderStars(product.rating)}</span>
          <span class="rating-value">${product.rating}</span>
          <span class="rating-count">(${product.reviews.toLocaleString()})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-price">
            <span class="price-current">$${product.price.toLocaleString()}</span>
            ${product.originalPrice > product.price ? `<span class="price-original">$${product.originalPrice.toLocaleString()}</span>` : ""}
            ${savings ? `<span class="price-savings">Save $${savings}</span>` : ""}
          </div>
          <button class="add-to-cart-btn" data-id="${product.id}" title="Add to Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

// ── Add to Cart ──────────────────────────────────────────────
async function handleAddToCart(productId, btnElement) {
  try {
    btnElement.classList.add("added");
    const res = await API.addToCart(productId);
    state.cart = res.data.cart;
    updateCartBadge();

    const product = state.products.find((p) => p.id === productId);
    showToast(`${product.name} added to cart!`, "success");

    setTimeout(() => btnElement.classList.remove("added"), 600);
    renderCartSidebar();
  } catch (err) {
    showToast("Failed to add to cart", "error");
    btnElement.classList.remove("added");
  }
}

// ── Cart ─────────────────────────────────────────────────────
function toggleCart() {
  const isOpen = $cartSidebar.classList.contains("active");
  $cartSidebar.classList.toggle("active");
  $cartOverlay.classList.toggle("active");
  document.body.style.overflow = isOpen ? "" : "hidden";

  if (!isOpen) {
    renderCartSidebar();
  }
}

function renderCartSidebar() {
  const { items, itemCount, subtotal, tax, total } = state.cart;

  if (!items || items.length === 0) {
    $cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Start adding some amazing phones!</p>
      </div>
    `;
    $cartFooter.innerHTML = "";
    return;
  }

  $cartItems.innerHTML = items
    .map(
      (item) => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image" style="background: ${BRAND_GRADIENTS[item.brand] || BRAND_GRADIENTS.Samsung};">
          <img src="${BRAND_IMAGES[item.brand] || "/assets/images/samsung.png"}" alt="${item.name}" />
        </div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${item.brand}</div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-control">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
          <button class="remove-item-btn" onclick="removeCartItem('${item.id}')">Remove</button>
        </div>
      </div>
    `
    )
    .join("");

  $cartFooter.innerHTML = `
    <div class="cart-totals">
      <div class="cart-total-row">
        <span>Subtotal (${itemCount} items)</span>
        <span>$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="cart-total-row">
        <span>Tax (8%)</span>
        <span>$${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="cart-total-row">
        <span>Shipping</span>
        <span style="color: var(--success); font-weight: 600;">FREE</span>
      </div>
      <div class="cart-total-row total">
        <span>Total</span>
        <span>$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
    <button class="btn btn-gold" style="width: 100%;" onclick="goToCheckout()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      Proceed to Checkout
    </button>
  `;
}

async function updateQuantity(itemId, newQty) {
  if (newQty <= 0) {
    return removeCartItem(itemId);
  }
  try {
    const res = await API.updateCartItem(itemId, newQty);
    state.cart = res.data.cart;
    updateCartBadge();
    renderCartSidebar();
  } catch (err) {
    showToast("Failed to update quantity", "error");
  }
}

async function removeCartItem(itemId) {
  try {
    const res = await API.removeFromCart(itemId);
    state.cart = res.data;
    updateCartBadge();
    renderCartSidebar();
    showToast("Item removed from cart", "success");
  } catch (err) {
    showToast("Failed to remove item", "error");
  }
}

function updateCartBadge() {
  const count = state.cart.itemCount || 0;
  $cartBadge.textContent = count;
  $cartBadge.classList.toggle("visible", count > 0);
}

function goToCheckout() {
  toggleCart();
  navigate("checkout");
}

// ── Product Modal ────────────────────────────────────────────
function openProductModal(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  const image = BRAND_IMAGES[product.brand] || "/assets/images/samsung.png";
  const gradient = BRAND_GRADIENTS[product.brand] || BRAND_GRADIENTS.Samsung;
  const savings = product.originalPrice > product.price
    ? (product.originalPrice - product.price).toFixed(2)
    : null;

  $modalContent.innerHTML = `
    <div class="modal-grid">
      <div class="modal-image-section" style="background: ${gradient};">
        <img src="${image}" alt="${product.name}" />
      </div>
      <div class="modal-details">
        <div class="modal-brand">${product.brand}</div>
        <h2 class="modal-name">${product.name}</h2>
        <div class="modal-rating">
          <span class="stars" style="font-size: 16px;">${renderStars(product.rating)}</span>
          <span class="rating-value">${product.rating}</span>
          <span class="rating-count">(${product.reviews.toLocaleString()} reviews)</span>
        </div>
        <p class="modal-description">${product.description}</p>
        <div class="modal-specs">
          ${Object.entries(product.specs)
            .map(
              ([key, val]) => `
            <div class="spec-item">
              <div class="spec-label">${key}</div>
              <div class="spec-value">${val}</div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="modal-colors">
          <span class="modal-colors-label">Colors:</span>
          ${product.colors
            .map(
              (color, i) =>
                `<span class="color-swatch" style="background: ${color};" title="${product.colorNames?.[i] || ""}" />`
            )
            .join("")}
        </div>
        <div class="modal-price-row">
          <span class="modal-price">$${product.price.toLocaleString()}</span>
          ${product.originalPrice > product.price ? `<span class="modal-original-price">$${product.originalPrice.toLocaleString()}</span>` : ""}
          ${savings ? `<span class="price-savings" style="font-size: 14px;">Save $${savings}</span>` : ""}
        </div>
        <button class="btn btn-primary btn-lg modal-add-btn" onclick="handleAddToCart(${product.id}, this); closeModal();">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;

  $modal.classList.add("active");
  $modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $modal.classList.remove("active");
  $modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

// ══════════════════════════════════════════════════════════════════
// CHECKOUT PAGE
// ══════════════════════════════════════════════════════════════════
function renderCheckoutPage() {
  const { items, itemCount, subtotal, tax, total } = state.cart;

  if (!items || items.length === 0) {
    $app.innerHTML = `
      <div class="confirmation-page">
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.4;">🛒</div>
        <h2 class="confirmation-title">Cart is Empty</h2>
        <p class="confirmation-subtitle">Add some phones before checkout.</p>
        <button class="btn btn-primary" onclick="navigate('home')">Browse Phones</button>
      </div>
    `;
    return;
  }

  $app.innerHTML = `
    <div class="checkout-page">
      <h1 class="checkout-title">Checkout</h1>
      <p class="checkout-subtitle">Complete your order details below</p>
      <div class="checkout-grid">
        <div>
          <div class="checkout-form-section" style="margin-bottom: 24px;">
            <h3 class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Contact Information
            </h3>
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name *</label>
                <input type="text" id="firstName" placeholder="John" required />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input type="text" id="lastName" placeholder="Doe" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" placeholder="john@example.com" required />
              </div>
              <div class="form-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </div>

          <div class="checkout-form-section" style="margin-bottom: 24px;">
            <h3 class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Shipping Address
            </h3>
            <div class="form-row full">
              <div class="form-group">
                <label for="street">Street Address *</label>
                <input type="text" id="street" placeholder="123 Main Street" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="city">City *</label>
                <input type="text" id="city" placeholder="New York" required />
              </div>
              <div class="form-group">
                <label for="state">State *</label>
                <input type="text" id="state" placeholder="NY" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="zipCode">ZIP Code *</label>
                <input type="text" id="zipCode" placeholder="10001" required />
              </div>
              <div class="form-group">
                <label for="country">Country</label>
                <select id="country">
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>

          <div class="checkout-form-section">
            <h3 class="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
              Payment Method
            </h3>
            <div class="form-row full">
              <div class="form-group">
                <label for="cardNumber">Card Number</label>
                <input type="text" id="cardNumber" placeholder="4242 4242 4242 4242" maxlength="19" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="expiry">Expiry Date</label>
                <input type="text" id="expiry" placeholder="MM/YY" maxlength="5" />
              </div>
              <div class="form-group">
                <label for="cvv">CVV</label>
                <input type="text" id="cvv" placeholder="123" maxlength="4" />
              </div>
            </div>
          </div>
        </div>

        <div class="checkout-summary">
          <h3 class="summary-title">Order Summary</h3>
          <div class="summary-items">
            ${items
              .map(
                (item) => `
              <div class="summary-item">
                <div>
                  <div class="summary-item-name">${item.name}</div>
                  <div class="summary-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="summary-item-price">$${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="summary-totals">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-row">
              <span>Tax (8%)</span>
              <span>$${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span class="free-label">FREE</span>
            </div>
            <div class="summary-row grand-total">
              <span>Total</span>
              <span>$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <button class="btn btn-gold btn-lg" style="width: 100%;" id="place-order-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Place Order — $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </button>
          <p style="text-align: center; margin-top: 12px; font-size: 12px; color: var(--text-muted);">
            🔒 Your payment info is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  `;

  // Bind place order
  document.getElementById("place-order-btn").addEventListener("click", handlePlaceOrder);
}

async function handlePlaceOrder() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const street = document.getElementById("street").value.trim();
  const city = document.getElementById("city").value.trim();
  const stateVal = document.getElementById("state").value.trim();
  const zipCode = document.getElementById("zipCode").value.trim();
  const country = document.getElementById("country").value;
  const cardNumber = document.getElementById("cardNumber").value.trim();

  if (!firstName || !lastName || !email || !street || !city || !stateVal || !zipCode) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> Processing...`;

  try {
    const res = await API.placeOrder({
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state: stateVal,
      zipCode,
      country,
      paymentMethod: "credit_card",
      cardLast4: cardNumber ? cardNumber.slice(-4) : "••••",
    });

    state.lastOrder = res.data;
    state.cart = { items: [], itemCount: 0, subtotal: 0, tax: 0, total: 0 };
    updateCartBadge();
    showToast("Order placed successfully! 🎉", "success");
    navigate("confirmation");
  } catch (err) {
    showToast("Failed to place order. Please try again.", "error");
    btn.disabled = false;
    btn.innerHTML = `Place Order`;
  }
}

// ══════════════════════════════════════════════════════════════════
// CONFIRMATION PAGE
// ══════════════════════════════════════════════════════════════════
function renderConfirmationPage() {
  const order = state.lastOrder;
  if (!order) {
    navigate("home");
    return;
  }

  $app.innerHTML = `
    <div class="confirmation-page">
      <div class="confirmation-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <h1 class="confirmation-title">Order Confirmed!</h1>
      <p class="confirmation-subtitle">Thank you, ${order.customer.firstName}! Your order has been placed successfully.</p>

      <div class="order-details-card">
        <div class="order-detail-row">
          <span class="label">Order Number</span>
          <span class="value" style="color: var(--accent-primary-light); font-family: monospace;">${order.orderNumber}</span>
        </div>
        <div class="order-detail-row">
          <span class="label">Email</span>
          <span class="value">${order.customer.email}</span>
        </div>
        <div class="order-detail-row">
          <span class="label">Est. Delivery</span>
          <span class="value" style="color: var(--success);">${new Date(order.estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <div class="order-detail-row">
          <span class="label">Items</span>
          <span class="value">${order.items.length} phone${order.items.length > 1 ? "s" : ""}</span>
        </div>
        ${order.items
          .map(
            (item) => `
          <div class="order-detail-row" style="padding-left: 16px;">
            <span class="label">${item.name} × ${item.quantity}</span>
            <span class="value">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `
          )
          .join("")}
        <div class="order-detail-row" style="border-top: 1px solid var(--border); margin-top: 10px; padding-top: 10px;">
          <span class="label" style="font-weight: 700; color: var(--text-primary);">Total Paid</span>
          <span class="value" style="font-size: 18px; color: var(--accent-gold);">$${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="navigate('orders')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          View All Orders
        </button>
        <button class="btn btn-secondary" onclick="navigate('home')">
          Continue Shopping
        </button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ══════════════════════════════════════════════════════════════════
async function renderOrdersPage() {
  $app.innerHTML = `
    <div class="orders-page">
      <h1 class="orders-title">My Orders</h1>
      <div id="orders-list">
        <div class="product-grid">
          ${[1, 2, 3].map(() => '<div class="skeleton skeleton-card"></div>').join("")}
        </div>
      </div>
    </div>
  `;

  try {
    const res = await API.getOrders();
    const orders = res.data;
    const container = document.getElementById("orders-list");

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="orders-empty">
          <div class="orders-empty-icon">📋</div>
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <button class="btn btn-primary" onclick="navigate('home')">Start Shopping</button>
        </div>
      `;
      return;
    }

    container.innerHTML = orders
      .map(
        (order) => `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <div class="order-number">${order.orderNumber}</div>
              <div class="order-date">${new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</div>
            </div>
            <span class="order-status">${order.status}</span>
          </div>
          <div class="order-items-list">
            ${order.items
              .map(
                (item) => `
              <div class="order-item-row">
                <span>${item.brand} ${item.name} × ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="order-card-footer">
            <div>
              <span style="font-size: 13px; color: var(--text-muted);">Delivery: </span>
              <span style="font-size: 13px; color: var(--success); font-weight: 600;">${new Date(order.estimatedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <div class="order-total">$${order.total.toFixed(2)}</div>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    showToast("Failed to load orders", "error");
  }
}

// ══════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const iconSvg =
    type === "success"
      ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>'
      : '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>';

  toast.innerHTML = `${iconSvg}<span class="toast-message">${message}</span>`;
  $toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
