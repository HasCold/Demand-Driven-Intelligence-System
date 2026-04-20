import React, { useEffect, useMemo, useState } from 'react';
import { displayMoney } from '../../helpers/utils';
import { fetchPricePredictions } from '../../services/xBeatApi';

const CHART_W = 360;
const CHART_H = 160;
const PAD = 18;

function buildLine(points, minPrice, maxPrice) {
  const range = maxPrice - minPrice || 1;
  const stepX = points.length > 1 ? (CHART_W - PAD * 2) / (points.length - 1) : 0;
  return points
    .map((point, idx) => {
      const x = PAD + idx * stepX;
      const y = CHART_H - PAD - ((point.price - minPrice) / range) * (CHART_H - PAD * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function buildSmoothPath(coords) {
  if (!coords.length) return '';
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

  const path = [`M ${coords[0].x} ${coords[0].y}`];
  for (let i = 0; i < coords.length - 1; i += 1) {
    const current = coords[i];
    const next = coords[i + 1];
    const cx = (current.x + next.x) / 2;
    path.push(`Q ${cx} ${current.y}, ${next.x} ${next.y}`);
  }
  return path.join(' ');
}

function formatHistoryLabel(row) {
  if (row?.date) {
    const d = new Date(row.date);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return String(row?.month || '');
}

function formatPlatformName(platform) {
  const normalized = String(platform || '').toLowerCase();
  if (normalized === 'bachat-bazar') return 'Bachat Bazaar';
  if (normalized === 'shophub') return 'ShopHub';
  return platform || 'Platform';
}

function buildPlatformProductUrl(platform, productSlug) {
  const normalizedPlatform = String(platform || '').toLowerCase();
  const normalizedSlug = String(productSlug || '').trim();
  if (!normalizedSlug) return '';

  if (normalizedPlatform === 'bachat-bazar') {
    return `http://localhost:5173/product/${encodeURIComponent(normalizedSlug)}`;
  }
  if (normalizedPlatform === 'shophub') {
    return `http://localhost:3000/product/${encodeURIComponent(normalizedSlug)}`;
  }
  return '';
}

function DemandChart({ history, predictedPrice }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = useMemo(() => {
    const base = (Array.isArray(history) ? history : [])
      .filter((row) => Number.isFinite(Number(row?.price)))
      .map((row) => ({ label: formatHistoryLabel(row), price: Number(row.price) }));

    if (Number.isFinite(Number(predictedPrice?.price))) {
      base.push({ label: 'Next', price: Number(predictedPrice.price) });
    }
    return base;
  }, [history, predictedPrice]);

  if (!points.length) {
    return <p className="demand_chart_empty">No trend data available.</p>;
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const line = buildLine(points, minPrice, maxPrice);
  const range = maxPrice - minPrice || 1;
  const stepX = points.length > 1 ? (CHART_W - PAD * 2) / (points.length - 1) : 0;
  const coords = points.map((point, idx) => ({
    x: PAD + idx * stepX,
    y: CHART_H - PAD - ((point.price - minPrice) / range) * (CHART_H - PAD * 2),
    label: point.label,
    price: point.price,
  }));
  const smoothPath = buildSmoothPath(coords);
  const areaPath = `${smoothPath} L ${coords[coords.length - 1]?.x || PAD} ${CHART_H - PAD} L ${coords[0]?.x || PAD} ${CHART_H - PAD} Z`;
  const activeIndex = hoverIndex == null ? coords.length - 1 : hoverIndex;
  const activePoint = coords[activeIndex];
  const tooltipX = Math.max(70, Math.min(CHART_W - 70, activePoint?.x || CHART_W / 2));
  const gradientId = `demand-gradient-${points.length}-${Math.round(minPrice)}-${Math.round(maxPrice)}`;

  const handleMove = (event) => {
    if (!coords.length || points.length === 1) return;
    const svgRect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - svgRect.left) / svgRect.width) * CHART_W;
    const clamped = Math.max(PAD, Math.min(CHART_W - PAD, relativeX));
    const idx = Math.round((clamped - PAD) / stepX);
    setHoverIndex(Math.max(0, Math.min(coords.length - 1, idx)));
  };

  return (
    <div className="demand_chart" onMouseLeave={() => setHoverIndex(null)}>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label="Price trend chart"
        onMouseMove={handleMove}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 39, 66, 0.38)" />
            <stop offset="100%" stopColor="rgba(255, 39, 66, 0.02)" />
          </linearGradient>
        </defs>

        <polyline className="demand_chart_ghost_line" points={line} />
        <path className="demand_chart_area" d={areaPath} fill={`url(#${gradientId})`} />
        <path className="demand_chart_smooth_line" d={smoothPath} />

        {coords.map((point, idx) => (
          <circle
            key={`${point.label}-${point.price}-${idx}`}
            className={`demand_chart_point ${idx === activeIndex ? 'active' : ''}`}
            cx={point.x}
            cy={point.y}
            r={idx === activeIndex ? 4 : 2.5}
          />
        ))}

        {activePoint && (
          <>
            <line
              className="demand_chart_crosshair"
              x1={activePoint.x}
              y1={PAD}
              x2={activePoint.x}
              y2={CHART_H - PAD}
            />
            <g transform={`translate(${tooltipX - 64},${Math.max(6, activePoint.y - 58)})`}>
              <rect className="demand_chart_tooltip_bg" width="128" height="44" rx="8" ry="8" />
              <text x="10" y="18" className="demand_chart_tooltip_label">{activePoint.label}</text>
              <text x="10" y="34" className="demand_chart_tooltip_price">{displayMoney(activePoint.price)}</text>
            </g>
          </>
        )}
      </svg>
      <div className="demand_chart_meta">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function buildPlatformMessage(entry, allEntries) {
  const thisPrice = Number(entry?.predictedPrice?.price);
  if (!Number.isFinite(thisPrice) || allEntries.length < 2) {
    return 'This platform has stable demand projection based on recent trend.';
  }

  const competitor = allEntries.find((item) => item.platform !== entry.platform);
  const otherPrice = Number(competitor?.predictedPrice?.price);
  if (!Number.isFinite(otherPrice)) {
    return 'This platform has stable demand projection based on recent trend.';
  }

  const delta = Math.abs(otherPrice - thisPrice);
  const deltaText = displayMoney(delta);
  const ratio = otherPrice > 0 ? ((delta / otherPrice) * 100).toFixed(1) : '0.0';

  if (thisPrice < otherPrice) {
    return `Currently this platform looks more reasonable by ${deltaText} (${ratio}% lower) than ${formatPlatformName(competitor.platform)}.`;
  }
  if (thisPrice > otherPrice) {
    return `Compared to ${formatPlatformName(competitor.platform)}, this option is ${deltaText} (${ratio}% higher) right now.`;
  }
  return `Both platforms are currently at nearly the same predicted price level.`;
}

const DemandAnalytics = ({ productId, availability = [], productSlug = '' }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const productIds = useMemo(() => {
    const fromAvailability = availability
      .map((item) => item?.product_id)
      .filter((id) => typeof id === 'string' && id.trim());
    const fallback = typeof productId === 'string' && productId.trim() ? [productId] : [];
    const source = fromAvailability.length ? fromAvailability : fallback;
    return [...new Set(source)];
  }, [availability, productId]);

  useEffect(() => {
    let disposed = false;

    if (!productIds.length) {
      setRows([]);
      return undefined;
    }

    setLoading(true);
    setError('');

    fetchPricePredictions(productIds.length === 1 ? productIds[0] : productIds)
      .then((predictions) => {
        if (!disposed) setRows(Array.isArray(predictions) ? predictions : []);
      })
      .catch(() => {
        if (!disposed) setError('Demand analytics are taking longer than expected.');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [productIds]);

  const entries = rows.filter((row) => !row?.error);

  return (
    <section id="demand_analytics" className="section">
      <div className="container">
        <div className="demand_analytics_head">
          <h3>Demand Analytics</h3>
          <p>Platform-wise trend and next-step predicted price.</p>
        </div>

        {loading ? (
          <div className="demand_grid">
            {[0, 1].map((index) => (
              <article className="demand_card is-loading" key={index}>
                <div className="shimmer shimmer-title" />
                <div className="shimmer shimmer-price" />
                <div className="shimmer shimmer-chart" />
              </article>
            ))}
          </div>
        ) : error ? (
          <p className="demand_state_msg">{error}</p>
        ) : entries.length ? (
          <div className="demand_grid">
            {entries.map((item) => (
              <article className="demand_card" key={`${item.productId}-${item.platform}`}>
                <div className="demand_card_top">
                  <h4>
                    <button
                      type="button"
                      className="link_btn"
                      target="_blank"
                      onClick={() => {
                        const redirectUrl = buildPlatformProductUrl(item.platform, productSlug);
                        if (redirectUrl) window.open(redirectUrl, "_blank", "noopener,noreferrer");
                      }}
                      disabled={!buildPlatformProductUrl(item.platform, productSlug)}
                      style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }}
                      title="Open this product on selected platform"
                    >
                      {formatPlatformName(item.platform)}
                    </button>
                  </h4>
                  <span className="chip">Predicted Next</span>
                </div>
                <p className="demand_price">{displayMoney(Number(item?.predictedPrice?.price || 0))}</p>
                <DemandChart history={item.priceHistory} predictedPrice={item.predictedPrice} />
                <p className="demand_insight">{buildPlatformMessage(item, entries)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="demand_state_msg">Demand analytics are not available for this product.</p>
        )}
      </div>
    </section>
  );
};

export default DemandAnalytics;
