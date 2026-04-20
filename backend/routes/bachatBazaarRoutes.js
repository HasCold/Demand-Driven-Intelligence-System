const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getRelatedProducts,
  getCategories
} = require('../controllers/bachatBazaar/productController');
const { getAllCategory } = require("../controllers/bachatBazaar/categoryController");

router.get('/products', getProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/products/categories', getCategories);
router.get('/products/:slug', getProductBySlug);
router.get('/products/:slug/related', getRelatedProducts);

// GET /api/categories - all categories with counts
router.get('/', getAllCategory);

module.exports = router;
