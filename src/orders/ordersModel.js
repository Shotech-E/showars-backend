// This schema will be used to store order information. It includes the order ID, a list of products, the total amount, the customer's email, and the current status of the order. The status can be one of the following: "pending", "processing", "shipped", or "completed". The timestamps field will automatically store the date and time when the order is created or updated.

const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    products: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      }
    ],
    amount: Number,
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed"],
      default: "pending"
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
