const { v4: uuidv4 } = require("uuid");

// In-memory order store
const orders = [];

function createOrder(cartItems, customerInfo, totals) {
  const order = {
    id: uuidv4(),
    orderNumber: `MEC-${Date.now().toString(36).toUpperCase()}`,
    items: cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    })),
    customer: {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: {
        street: customerInfo.street,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
        country: customerInfo.country || "United States",
      },
    },
    payment: {
      method: customerInfo.paymentMethod || "credit_card",
      last4: customerInfo.cardLast4 || "****",
    },
    subtotal: totals.subtotal,
    tax: totals.tax,
    shipping: 0,
    total: totals.total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  };

  orders.push(order);
  return order;
}

function getAllOrders() {
  return orders.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getOrderById(id) {
  return orders.find((o) => o.id === id);
}

module.exports = { createOrder, getAllOrders, getOrderById };
