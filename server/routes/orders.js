const express = require("express");
const router = express.Router();
const { createOrder, getAllOrders, getOrderById } = require("../models/order.js");
const { getCartTotal, clearCart, getCart } = require("../models/cart.js");

// POST /api/orders — place an order from current cart
router.post("/", (req, res) => {
  const cart = getCart();
  if (!cart || cart.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: { message: "Cart is empty" } });
  }

  const { firstName, lastName, email, phone, street, city, state, zipCode, country, paymentMethod, cardLast4 } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !street || !city || !state || !zipCode) {
    return res.status(400).json({
      success: false,
      error: { message: "All required customer fields must be provided" },
    });
  }

  const totals = getCartTotal();
  const order = createOrder(
    cart,
    { firstName, lastName, email, phone, street, city, state, zipCode, country, paymentMethod, cardLast4 },
    totals
  );

  // Clear cart after successful order
  clearCart();

  res.status(201).json({
    success: true,
    message: "Order placed successfully!",
    data: order,
  });
});

// GET /api/orders — get all orders
router.get("/", (_req, res) => {
  const orders = getAllOrders();
  res.json({ success: true, count: orders.length, data: orders });
});

// GET /api/orders/:id — get single order
router.get("/:id", (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res
      .status(404)
      .json({ success: false, error: { message: "Order not found" } });
  }
  res.json({ success: true, data: order });
});

module.exports = router;
