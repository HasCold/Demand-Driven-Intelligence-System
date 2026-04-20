const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getRelatedProducts,
  getCategories,
} = require('../controllers/shopHub/productController');
const { getAllCategory } = require('../controllers/shopHub/categoryController');

router.get('/products', getProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/products/categories', getCategories);
router.get('/products/:slug/related', getRelatedProducts);
router.get('/products/:slug', getProductBySlug);

router.get('/', getAllCategory);

module.exports = router;
