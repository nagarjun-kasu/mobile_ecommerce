/* ═══════════════════════════════════════════════════════════════
   api.js — Lightweight API Client for MobileHub
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = "https://mobile-ecommerce-0upb.onrender.com";

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

const API = {
  // ── Products ──────────────────────────────────────────────
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? `?${query}` : ""}`);
  },

  getProduct(id) {
    return apiRequest(`/products/${id}`);
  },

  getBrands() {
    return apiRequest("/products/brands");
  },

  // ── Cart ──────────────────────────────────────────────────
  getCart() {
    return apiRequest("/cart");
  },

  addToCart(productId, quantity = 1) {
    return apiRequest("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  },

  updateCartItem(itemId, quantity) {
    return apiRequest(`/cart/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart(itemId) {
    return apiRequest(`/cart/${itemId}`, { method: "DELETE" });
  },

  clearCart() {
    return apiRequest("/cart", { method: "DELETE" });
  },

  // ── Orders ────────────────────────────────────────────────
  placeOrder(customerInfo) {
    return apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(customerInfo),
    });
  },

  getOrders() {
    return apiRequest("/orders");
  },

  getOrder(id) {
    return apiRequest(`/orders/${id}`);
  },
};
