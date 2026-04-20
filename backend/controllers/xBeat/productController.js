const Product = require('../../models/Product');
const { BACHAT_BAZAAR, SHOP_HUB } = require('../../shared/constants');
const {
  dedupeProductsByName,
  sortMergedByRecency,
  normalizeProductName,
  platformLabel,
} = require('../../utils/xBeatProductMerge');

const AGGREGATE_PLATFORMS = [BACHAT_BAZAAR, SHOP_HUB];

const listSelect =
  'name slug description shortDescription price originalPrice discount category brand platform images thumbnail stock inStock rating reviewCount tags featured badge specifications createdAt updatedAt';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validPlatform(p) {
  return AGGREGATE_PLATFORMS.includes(p);
}

/**
 * GET /api/v1/x-beat/products
 * Aggregates Bachat Bazaar + ShopHub; collapses rows that share the same product name into one listing.
 */
exports.getProducts = async (req, res) => {
  try {
    const { search, category, platform, brand } = req.query;

    const filter = { platform: { $in: AGGREGATE_PLATFORMS } };

    if (platform && validPlatform(platform)) {
      filter.platform = platform;
    }

    if (category && category !== 'all') {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
    }

    if (brand) {
      filter.brand = new RegExp(`^${escapeRegex(brand)}$`, 'i');
    }

    if (search && search.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { shortDescription: new RegExp(q, 'i') },
      ];
    }

    const raw = await Product.find(filter)
      .select(listSelect)
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean();

    const merged = sortMergedByRecency(dedupeProductsByName(raw));

    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/x-beat/meta
 * Distinct categories and brands across both platforms (for filter UI).
 */
exports.getMeta = async (req, res) => {
  try {
    const base = { platform: { $in: AGGREGATE_PLATFORMS } };
    const [categories, brands] = await Promise.all([
      Product.distinct('category', base),
      Product.distinct('brand', base),
    ]);
    res.json({
      success: true,
      data: {
        categories: categories.filter(Boolean).sort(),
        brands: brands.filter(Boolean).sort(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/x-beat/products/:platform/:slug
 * Includes availability[] + availablePlatformLabels when the same name exists on both sites.
 */
exports.getProductByPlatformSlug = async (req, res) => {
  try {
    const { platform, slug } = req.params;
    if (!validPlatform(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    const product = await Product.findOne({ platform, slug }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const trimmedName = String(product.name || '').trim();
    const nameRegex = new RegExp(`^${escapeRegex(trimmedName)}$`, 'i');

    const siblings = await Product.find({
      platform: { $in: AGGREGATE_PLATFORMS },
      _id: { $ne: product._id },
      name: nameRegex,
    })
      .select('platform slug price originalPrice')
      .lean();

    const selfEntry = {
      product_id: String(product._id),
      platform: product.platform,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      label: platformLabel(product.platform),
    };

    const siblingEntries = siblings.map((o) => ({
      product_id: String(o._id),
      platform: o.platform,
      slug: o.slug,
      price: o.price,
      originalPrice: o.originalPrice,
      label: platformLabel(o.platform),
    }));

    product.availability = [selfEntry, ...siblingEntries].sort((a, b) => (a.price || 0) - (b.price || 0));
    product.availablePlatformLabels = [...new Set(product.availability.map((a) => a.label))];
    product.mergedListing = product.availability.length > 1;

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/x-beat/products/:platform/:slug/related
 * Same category, both platforms, name-deduped; excludes current product (all name twins).
 */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { platform, slug } = req.params;
    if (!validPlatform(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    const current = await Product.findOne({ platform, slug }).select('category name').lean();
    if (!current) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const norm = normalizeProductName(current.name);

    const candidates = await Product.find({
      platform: { $in: AGGREGATE_PLATFORMS },
      category: current.category,
    })
      .select(listSelect)
      .limit(120)
      .lean();

    const filtered = candidates.filter(
      (p) =>
        !(p.platform === platform && p.slug === slug) && normalizeProductName(p.name) !== norm
    );

    const merged = sortMergedByRecency(dedupeProductsByName(filtered)).slice(0, 12);

    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
