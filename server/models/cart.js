const { v4: uuidv4 } = require("uuid");

// In-memory cart store (keyed by session — single-user demo uses "default")
const carts = new Map();

function getCart(sessionId = "default") {
  if (!carts.has(sessionId)) {
    carts.set(sessionId, []);
  }
  return carts.get(sessionId);
}

function addToCart(sessionId = "default", product, quantity = 1) {
  const cart = getCart(sessionId);
  const existing = cart.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += quantity;
    return existing;
  }

  const cartItem = {
    id: uuidv4(),
    productId: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    quantity,
    addedAt: new Date().toISOString(),
  };

  cart.push(cartItem);
  return cartItem;
}

function updateCartItem(sessionId = "default", itemId, quantity) {
  const cart = getCart(sessionId);
  const item = cart.find((i) => i.id === itemId);
  if (!item) return null;

  if (quantity <= 0) {
    return removeFromCart(sessionId, itemId);
  }

  item.quantity = quantity;
  return item;
}

function removeFromCart(sessionId = "default", itemId) {
  const cart = getCart(sessionId);
  const index = cart.findIndex((i) => i.id === itemId);
  if (index === -1) return null;

  const removed = cart.splice(index, 1)[0];
  return removed;
}

function clearCart(sessionId = "default") {
  carts.set(sessionId, []);
}

function getCartTotal(sessionId = "default") {
  const cart = getCart(sessionId);
  return {
    items: cart,
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: parseFloat(
      cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    ),
    tax: parseFloat(
      (
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.08
      ).toFixed(2)
    ),
    total: parseFloat(
      (
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.08
      ).toFixed(2)
    ),
  };
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartTotal,
};
