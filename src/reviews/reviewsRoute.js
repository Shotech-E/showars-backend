const express = require("express");
const router = express.Router();
const Reviews = require("./reviewsModel");
const Products = require("../products/productsModel");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");   

// POST A NEW REVIEW
router.post("/post-review", async (req, res) => {
    try {
        const { comment, rating, productId, userId } = req.body;
        
        if ( !comment || !rating || !productId || !userId) {
            return res.status(400).send({ message: "All fields are required" });
        }

        const existingReview = await Reviews.findOne({ productId, userId });

        if (existingReview) {
            // Update the existing review
            existingReview.comment = comment;
            existingReview.rating = rating;
            await existingReview.save();
        } else {
            // CREATE NEW REVIEW
            const newReview = new Reviews({
                comment,
                rating,
                productId,
                userId
            });
            await newReview.save();
        }

        // CALCULATE THE AVERAGE RATINGS
        const reviews = await Reviews.find({ productId });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            const avgRating = totalRating / reviews.length;
            const product = await Products.findById(productId)
            if (product) {
                product.rating = avgRating;
                await product.save({validateBeforeSave: false});
            } else {
                return res.status(404).send({ message: "Product not found"});
            }
        }
        
        res.status(200).send({
            message: "Review posted successfully",
            reviews: reviews
         });

    } catch (error) {
        console.error("Error in creating review", error);
        res.status(500).send({ message: "Failed in creating review" });
    }
});

// GET TOTAL REVIEWS COUNT
router.get("/total-reviews", async (req, res) => {
    try {
        const totalReviews = await Reviews.countDocuments({});
        res.status(200).send({totalReviews});
        // res.send({ totalReviews: reviews.length });

    } catch (error) {
        console.error("Error in getting total reviews for product", error);
        res.status(500).send({ message: "Failed in getting total reviews for product" });
    }
});


// GET REVIEWS BY USER ID
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!userId) { 
        return res.status(400).send({ message: "User ID is required" });
    }

    try {
        const reviews = await Reviews.find({ userId: userId }).sort({ createdAt: -1 });
        
        if (reviews.length === 0) {
            return res.status(404).send({ message: "No reviews found for this user" });
        }
        res.status(200).send(reviews);

    } catch (error) {
        console.error("Error in getting reviews for user", error);
        res.status(500).send({ message: "Failed in getting reviews for user" });
        
    }

})

module.exports = router;