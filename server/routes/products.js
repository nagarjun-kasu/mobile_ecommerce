const express = require("express");
const router = express.Router();
const products = require("../data/products.js");

// GET /api/products — list all, with optional brand filter and search
router.get("/", (req, res) => {
  let result = [...products];
  const { brand, search, sort, minPrice, maxPrice } = req.query;

  // Filter by brand (case-insensitive)
  if (brand && brand !== "all") {
    result = result.filter(
      (p) => p.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  // Search by name or description
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }

  // Price range filter
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));

  // Sort
  if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
  else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET /api/products/brands — list unique brands
router.get("/brands", (_req, res) => {
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  res.json({ success: true, data: brands });
});

// GET /api/products/:id — single product
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res
      .status(404)
      .json({ success: false, error: { message: "Product not found" } });
  }
  res.json({ success: true, data: product });
});

module.exports = router;
