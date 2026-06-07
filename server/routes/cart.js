const express = require("express");
const router = express.Router();
const products = require("../data/products.js");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartTotal,
} = require("../models/cart.js");

// GET /api/cart — get cart contents with totals
router.get("/", (_req, res) => {
  const cartData = getCartTotal();
  res.json({ success: true, data: cartData });
});

// POST /api/cart — add item to cart
router.post("/", (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, error: { message: "productId is required" } });
  }

  const product = products.find((p) => p.id === Number(productId));
  if (!product) {
    return res
      .status(404)
      .json({ success: false, error: { message: "Product not found" } });
  }

  const cartItem = addToCart("default", product, Number(quantity));
  const cartData = getCartTotal();

  res.status(201).json({
    success: true,
    message: `${product.name} added to cart`,
    data: { item: cartItem, cart: cartData },
  });
});

// PUT /api/cart/:id — update item quantity
router.put("/:id", (req, res) => {
  const { quantity } = req.body;

  if (quantity === undefined) {
    return res
      .status(400)
      .json({ success: false, error: { message: "quantity is required" } });
  }

  const updated = updateCartItem("default", req.params.id, Number(quantity));
  if (!updated) {
    return res
      .status(404)
      .json({ success: false, error: { message: "Cart item not found" } });
  }

  const cartData = getCartTotal();
  res.json({ success: true, data: { item: updated, cart: cartData } });
});

// DELETE /api/cart/:id — remove item from cart
router.delete("/:id", (req, res) => {
  const removed = removeFromCart("default", req.params.id);
  if (!removed) {
    return res
      .status(404)
      .json({ success: false, error: { message: "Cart item not found" } });
  }

  const cartData = getCartTotal();
  res.json({
    success: true,
    message: `${removed.name} removed from cart`,
    data: cartData,
  });
});

// DELETE /api/cart — clear entire cart
router.delete("/", (_req, res) => {
  clearCart();
  res.json({ success: true, message: "Cart cleared", data: getCartTotal() });
});

module.exports = router;
