const express = require("express");
const User = require("../users/userModel");
const Order = require("../orders/ordersModel");
const Reviews = require("../reviews/reviewsModel");
const Products = require("../products/productsModel");
const router = express.Router();

// GET USER STATS BY EMAIL
router.get("/user-stats/:email", async (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).send({ message: "Email is required" });
    }
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send({ message: "User not found" });
        }
        // res.status(200).send({ user });

        // sum of all orders
        const totalPaymentResult = await Order.aggregate([
            { $match: { email: email } },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
        ]);
        const totalPaymentAmount = totalPaymentResult.length > 0 ? totalPaymentResult[0].totalAmount : 0;

        // get total reviews
        const totalReviews = await Reviews.countDocuments({ userId: user._id });

        // get total products purchased
        const purchasedProductIds = await Order.distinct("products.productId", { email: email });
        const totalProductsPurchased = purchasedProductIds.length;

        res.status(200).send({ totalPaymentAmount, totalReviews, totalProductsPurchased });
        
    } catch (error) {
        console.error("Error getting user stats by email", error);
        res.status(500).send({ message: "Failed getting user stats by email" });
    }
});

// Admin Status
router.get("/admin-stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Products.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalReviews = await Reviews.countDocuments();

        // Calculate total earning
        const totalEarningsResult = await Order.aggregate([
            { $group: { _id: null, totalEarnings: { $sum: "$amount" } }, },
        ]);
        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarnings.toFixed(2) : 0;

        const monthlyEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    monthlyEarnings: { $sum: "$amount" },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            }
        ]);

        // Formate monthly Earnings
        const monthlyEarnings = monthlyEarningsResult.map((entry) => ({
            month: entry._id.month,
            year: entry._id.year,
            earnings: entry.monthlyEarnings,
        }))

        res.status(200).send({ totalUsers, totalProducts, totalOrders, totalReviews, totalEarnings, monthlyEarnings });

    } catch (error) {
        console.error("Error getting admin stats", error);
        res.status(500).send({ message: "Failed getting admin stats" });
    }
});
module.exports = router