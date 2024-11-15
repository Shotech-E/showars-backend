const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: String,
    description: String,
    price: {
      type: Number,
      required: true,
    },
    oldPrice: Number,
    image: String,
    colour: String,
    rating: {
      type: Number,
      default: 0,
    },
    author: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Products = model("Product", ProductSchema);
module.exports = Products;
