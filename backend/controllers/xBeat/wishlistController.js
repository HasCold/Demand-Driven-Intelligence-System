const mongoose = require('mongoose');
const User = require('../../models/User');
const Product = require('../../models/Product');
const { BACHAT_BAZAAR, SHOP_HUB } = require('../../shared/constants');

const AGGREGATE_PLATFORMS = [BACHAT_BAZAAR, SHOP_HUB];

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wishlist').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const productIds = (user.wishlist || []).map((id) => String(id));
    res.json({ success: true, data: { productIds } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body || {};
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Valid productId is required' });
    }

    const product = await Product.findById(productId).select('platform').lean();
    if (!product || !AGGREGATE_PLATFORMS.includes(product.platform)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oid = new mongoose.Types.ObjectId(productId);
    const user = await User.findById(req.user.id).select('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const has = user.wishlist.some((id) => String(id) === String(productId));
    const inWishlist = !has;

    await User.findByIdAndUpdate(req.user.id, {
      [has ? '$pull' : '$addToSet']: { wishlist: oid },
    });

    res.json({ success: true, data: { inWishlist } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
