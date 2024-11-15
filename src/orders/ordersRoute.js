const express = require("express");
const router = express.Router();
const Order = require("./ordersModel");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
// const stripe = require("stripe")(
//   "sk_test_51QE7lZLe2VbPgG0NBFeRqJ6noTxWLyLLWhYkzUvhjuoFcCwWrKPO8bv93T3UFvbh10cwMK2Ai9t2m6Dm0RXBh4zF00f1JAEL1P"
// );
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", async (req, res) => {
  const { products } = req.body;
  try {
    const lineItems = products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: [product.image],
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cancel`,
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session", error);
    res.status(500).json({ error: "Failed creating checkout session" });
  }
});

// CONFIRM PAYMENT
router.post("/confirm-payment", async (req, res) => {
  const { session_id } = req.body;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "payment_intent"],
    });

    const paymentIntentId = session.payment_intent.id;
    let order = await Order.findOne({ orderId: paymentIntentId });

    if (!order) {
      const lineItems = session.line_items.data.map((item) => ({
        productId: item.price.product,
        quantity: item.quantity,
      }));

      const amount = session.amount_total / 100;
      order = new Order({
        orderId: paymentIntentId,
        amount,
        products: lineItems,
        email: session.customer_details.email,
        status:
          session.payment_intent.status === "succeeded" ? "pending" : "failed",
      });
    } else {
      order.status =
        session.payment_intent.status === "succeeded" ? "pending" : "failed";
    }
    await order.save();
    res.json({ order });
  } catch (error) {
    console.error("Error confirming payment", error);
    res.status(500).json({ error: "Failed confirming payment" });
  }
});

// GET ORDER BY email address
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }
  try {
    const orders = await Order.find({ email: email });
    if (orders.length === 0 || !orders) {
      return res
        .status(400)
        .send({ orders: 0, message: "No order found for this email" });
    }
    res.status(200).send({ orders });
  } catch (error) {
    console.error("Error getting order by email", error);
    res.status(500).send({ message: "Failed getting order by email" });
  }
});

// get order by Id

router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).send(order);
  } catch (error) {
    console.error("Error getting order by ID", error);
    res.status(500).send({ message: "Failed getting order by ID" });
  }
});

// GET ALL ORDERS
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    if (orders.length === 0) {
      return res.status(404).send({ message: "No order found", orders: [] });
    }
    res.status(200).send(orders);
  } catch (error) {
    console.error("Error getting all orders", error);
    res.status(500).send({ message: "Failed getting all orders" });
  }
});

// UPDATE ORDER STATUS
router.patch("/update-order-status/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).send({ message: "Status is required" });
  }
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
      );
      
    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
      res.status(200).send({ message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status", error);
    res.status(500).send({ message: "Failed updating order status" });
  }
});

// DELETE ORDER
router.delete(
  "/delete-order/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      const deletedOrder = await Order.findByIdAndDelete(id);
      if (!deletedOrder) {
        return res.status(404).send({ message: "Order not found" });
      }
      res
        .status(200)
        .send({ message: "Order deleted successfully", order: deletedOrder });
    } catch (error) {
      console.error("Error deleting order", error);
      res.status(500).send({ message: "Failed deleting order" });
    }
  }
);

module.exports = router;
