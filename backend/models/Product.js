const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: String, required: true },
  avatar: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const priceHistorySchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "Jan 2024"
  price: { type: Number, required: true }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 }, // percentage
    category: { type: String, required: true },
    brand: { type: String, default: 'Generic' },
    platform: { type: String, required: true }, 
    images: [{ type: String }], // Array of image URLs (2-3)
    thumbnail: { type: String }, // Main image for list view
    stock: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    reviews: [reviewSchema],
    priceHistory: [priceHistorySchema], // last 12 months
    tags: [{ type: String }],
    specifications: { type: Map, of: String },
    featured: { type: Boolean, default: false },
    badge: { type: String, enum: ['new', 'hot', 'sale', 'top', ''], default: '' }
  },
  { timestamps: true }
);

// compound unique index
productSchema.index({ slug: 1, platform: 1}, {unique: true});

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
