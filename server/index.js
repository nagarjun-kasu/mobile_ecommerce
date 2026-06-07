const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products.js");
const cartRoutes = require("./routes/cart.js");
const orderRoutes = require("./routes/orders.js");
const { errorHandler, notFound } = require("./middleware/errorHandler.js");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "..", "client")));

// ── API Routes ─────────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── SPA Fallback — serve index.html for all non-API routes ─────
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

// ── Error Handling ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🚀  MobileHub E-Commerce Server               ║
  ║                                                  ║
  ║   Local:   http://localhost:${PORT}                ║
  ║   API:     http://localhost:${PORT}/api             ║
  ║                                                  ║
  ║   Press Ctrl+C to stop                           ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
