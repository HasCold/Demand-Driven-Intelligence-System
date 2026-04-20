const Product = require('../../models/Product');
const { BACHAT_BAZAAR } = require('../../shared/constants');

// GET /api/products — paginated list
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, search, sort, minPrice, maxPrice } = req.query;

    // Build filter
    const filter = {
      platform: {$eq: BACHAT_BAZAAR}
    };
    if (category && category !== 'all') filter.category = category;
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'popular') sortObj = { reviewCount: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name slug thumbnail price originalPrice discount category brand rating reviewCount inStock badge featured shortDescription')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      platform: BACHAT_BAZAAR, 
      featured: true 
    })
      .select('name slug thumbnail price originalPrice discount category brand rating reviewCount badge')
      .limit(8);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      platform: BACHAT_BAZAAR, 
      slug: req.params.slug 
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:slug/related
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      platform: BACHAT_BAZAAR, 
      slug: req.params.slug 
    }).select('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const related = await Product.find({
      platform: BACHAT_BAZAAR, 
      category: product.category,
      slug: { $ne: req.params.slug }
    })
      .select('name slug thumbnail price originalPrice discount rating reviewCount badge')
      .limit(6);

    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', {platform: BACHAT_BAZAAR});
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
