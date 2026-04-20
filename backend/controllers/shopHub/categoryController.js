const Product = require('../../models/Product');
const { SHOP_HUB } = require('../../shared/constants');

const getAllCategory = async (req, res) => {
  try {
    const cats = await Product.aggregate([
      { $match: { platform: SHOP_HUB } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllCategory };
