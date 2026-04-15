function normalizeSpecs(specifications) {
  if (!specifications || typeof specifications !== 'object') return {};
  if (specifications instanceof Map) {
    return Object.fromEntries(specifications);
  }
  return { ...specifications };
}

function buildImages(p) {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images;
  }
  if (p.thumbnail) return [p.thumbnail];
  return ['https://via.placeholder.com/600x600?text=Product'];
}

function starCountFromRating(rating) {
  const n = Number(rating);
  if (Number.isNaN(n) || n <= 0) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function formatReviewDate(d) {
  if (d == null || d === '') return '';
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const dt = new Date(d);
  if (!Number.isNaN(dt.getTime())) {
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return String(d);
}

function mapReviews(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) return [];
  return reviews.map((r, i) => ({
    id: i + 1,
    name: r.user || 'Customer',
    date: formatReviewDate(r.date),
    review: r.comment || '',
    rateCount: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 3))),
    avatar: r.avatar || '',
  }));
}

/**
 * Maps a Bachat Bazaar API product document to the xbeat UI shape.
 */
function normalizeNameKey(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function mapDbProductToXbeat(p) {
  const platform = p.platform;
  const slug = p.slug;
  const specs = normalizeSpecs(p.specifications);
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const isFeatured = Boolean(p.featured);
  const isHero = tags.map((t) => String(t).toLowerCase()).includes('hero');

  let tag;
  if (isHero) tag = 'hero-product';
  else if (isFeatured) tag = 'featured-product';

  const availability = Array.isArray(p.availability) ? p.availability : [];
  const mergedListing = availability.length > 1;
  const availablePlatformLabels = Array.isArray(p.availablePlatformLabels)
    ? p.availablePlatformLabels
    : availability.map((a) => a.label).filter(Boolean);

  const detailPath = `/product-details/${encodeURIComponent(platform)}/${encodeURIComponent(slug)}`;
  const id =
    mergedListing
      ? `merged::${encodeURIComponent(normalizeNameKey(p.name))}`
      : `${platform}::${slug}`;

  const listPrice = p.price;
  const originalPrice =
    p.originalPrice != null && p.originalPrice > 0 ? p.originalPrice : listPrice;

  const priceRange = p.priceRange;

  return {
    id,
    productId: p?._id ? String(p._id) : undefined,
    platform,
    slug,
    detailPath,
    path: '/product-details/',
    mergedListing,
    availability,
    availablePlatformLabels,
    priceRange,
    tag,
    tagline: p.shortDescription || (p.description ? String(p.description).slice(0, 90) : ''),
    heroImage: p.thumbnail || buildImages(p)[0],
    images: buildImages(p),
    brand: p.brand || 'Generic',
    title: p.name,
    info: p.shortDescription || '',
    description: p.description || '',
    category: p.category,
    type: specs.Type || specs['Headphone Type'] || specs.Material || specs.Capacity || '—',
    connectivity: specs.Connectivity || specs.Charging || specs['Network'] || '—',
    finalPrice: listPrice,
    originalPrice,
    quantity: 1,
    ratings: p.reviewCount ?? 0,
    rateCount: starCountFromRating(p.rating),
    inStock: p.inStock !== false,
    reviews: mapReviews(p.reviews),
    specifications: specs,
  };
}
