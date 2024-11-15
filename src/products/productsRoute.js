const express = require("express");
const router = express.Router();
const Products = require("./productsModel");
const Reviews = require("../reviews/reviewsModel");
const User = require("../users/userModel"); 
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// POST A NEW PRODUCT
router.post("/create-product", async (req, res) => {
  try {
    const newProduct = new Products({
      ...req.body,
    });
    const savedProduct = await newProduct.save();
    // CALCULATE REVIEWS
    const reviews = await Reviews.find({ productId: savedProduct._id });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      const avgRating = totalRating / reviews.length;
      savedProduct.rating = avgRating;
      await savedProduct.save();
    }

    res.status(201).send({ message: "Product posted successfully" });
  } catch (error) {
    console.error("Error in creating product", error);
    res.status(500).send({ message: "Error in creating product" });
  }
});

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const {
      category,
      colour,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (colour && colour !== "all") {
      filter.colour = colour;
    }
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      }
    }

    const skip = (page - 1) * parseInt(limit);
    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    const products = await Products.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "email")
      .sort({ createdAt: -1 });
    res.status(200).send({ products, totalPages, totalProducts });
  } catch (error) {
    console.error("Error in getting products", error);
    res.status(500).send({ message: "Error in getting products" });
  }
});

// GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId).populate(
      "author",
      "email username"
    );
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    const reviews = await Reviews.find({ productId }).populate(
      "userId",
      "email username"
    );
    res.status(200).send({product, reviews});
  } catch (error) {
    console.error("Error in getting product", error);
    res.status(500).send({ message: "Error in getting product" });
  }
});

// UPDATE A PRODUCT
router.patch("/update-product/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Products.findByIdAndUpdate(
      productId,
      { ...req.body },
      {
        new: true,
      }
    );
    if (!updatedProduct) {
      return res.status(404).send({ message: "Product not found" });
    }
    res
      .status(200)
      .send({
        message: "Product updated successfully",
        product: updatedProduct,
      });
  } catch (error) {
    console.error("Error in updating product", error);
    res.status(500).send({ message: "Error in updating product" });
  }
});

// DELETE A PRODUCT
router.delete("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Products.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).send({ message: "Product not found" });
      }
      
    // Delete Reviews Related To  The Product
    await Reviews.deleteMany({ productId: productId });  
      res.status(200).send({ message: "Product deleted successfully" });
      
  } catch (error) {
    console.error("Error in deleting product", error);
    res.status(500).send({ message: "Error in deleting product" });
  }
});

// GET RELATED PRODUCTS
router.get("/related-products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({ message: "Product Id is required" });
    }

    const product = await Products.findById(id);

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    const titleRegex = new RegExp(
      product.name
        .split(" ")
        .filter((word) => word.length > 1)
        .join("|"),
      "i"
    );

    const relatedProducts = await Products.find({
      _id: { $ne: id }, // Exclude the current product
      $or: [
        { name: { $regex: titleRegex } }, // Match similar names
        { category: product.category }, // Match similar categories
      ],
    });

    res.status(200).send(relatedProducts);
  } catch (error) {
    console.error("Error in getting related products", error);
    res.status(500).send({ message: "Error in getting related products" });
  }
});

module.exports = router;