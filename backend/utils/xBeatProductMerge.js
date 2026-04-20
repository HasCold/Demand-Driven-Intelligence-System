const { BACHAT_BAZAAR, SHOP_HUB, PLATFORM_DISPLAY_NAMES } = require('../shared/constants');

const AGGREGATE_PLATFORMS = [BACHAT_BAZAAR, SHOP_HUB];

function platformLabel(platform) {
  return PLATFORM_DISPLAY_NAMES[platform] || platform;
}

function normalizeProductName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Groups raw DB rows by normalized product name and returns one merged document per group.
 * Primary row = lowest price (then newest updatedAt).
 */
function mergeProductGroup(group) {
  if (group.length === 1) {
    const p = { ...group[0] };
    p.availability = [
      {
        product_id: String(p._id),
        platform: p.platform,
        slug: p.slug,
        price: p.price,
        originalPrice: p.originalPrice,
        label: platformLabel(p.platform),
      },
    ];
    p.availablePlatformLabels = [platformLabel(p.platform)];
    p.mergedListing = false;
    return p;
  }

  const sorted = [...group].sort((a, b) => {
    const dp = (a.price || 0) - (b.price || 0);
    if (dp !== 0) return dp;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  const primary = sorted[0];
  const availability = sorted.map((p) => ({
    product_id: String(p._id),
    platform: p.platform,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice,
    label: platformLabel(p.platform),
  }));

  const prices = sorted.map((p) => p.price || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const allTags = sorted.flatMap((p) => (Array.isArray(p.tags) ? p.tags : []));
  const uniqueTags = [...new Set(allTags.map((t) => String(t)))];

  const merged = {
    ...primary,
    price: minPrice,
    originalPrice:
      primary.originalPrice != null && primary.originalPrice > 0
        ? primary.originalPrice
        : minPrice,
    platform: primary.platform,
    slug: primary.slug,
    inStock: sorted.some((p) => p.inStock !== false),
    featured: sorted.some((p) => p.featured),
    tags: uniqueTags,
    rating: sorted.reduce((s, p) => s + (Number(p.rating) || 0), 0) / sorted.length,
    reviewCount: sorted.reduce((s, p) => s + (Number(p.reviewCount) || 0), 0),
    availability,
    availablePlatformLabels: [...new Set(availability.map((a) => a.label))],
    priceRange: minPrice !== maxPrice ? { min: minPrice, max: maxPrice } : undefined,
    mergedListing: true,
  };

  return merged;
}

function dedupeProductsByName(products) {
  const map = new Map();

  for (const p of products) {
    const key = normalizeProductName(p.name);
    const bucketKey = key || `__id_${String(p._id)}`;
    if (!map.has(bucketKey)) map.set(bucketKey, []);
    map.get(bucketKey).push(p);
  }

  return [...map.values()].map(mergeProductGroup);
}

function sortMergedByRecency(merged) {
  return [...merged].sort((a, b) => {
    const ta = new Date(a.updatedAt || 0).getTime();
    const tb = new Date(b.updatedAt || 0).getTime();
    return tb - ta;
  });
}

module.exports = {
  AGGREGATE_PLATFORMS,
  normalizeProductName,
  dedupeProductsByName,
  sortMergedByRecency,
  platformLabel,
};
