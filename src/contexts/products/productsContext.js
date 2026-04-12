import React, { createContext, useEffect, useMemo, useState } from 'react';
import { fetchXBeatProducts } from '../../services/xBeatApi';
import { mapDbProductToXbeat } from '../../utils/mapXBeatProduct';

const productsContext = createContext({
  products: [],
  loading: true,
  error: null,
});

const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchXBeatProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts((Array.isArray(data) ? data : []).map(mapDbProductToXbeat));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load products');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ products, loading, error }), [products, loading, error]);

  return <productsContext.Provider value={value}>{children}</productsContext.Provider>;
};

export default productsContext;
export { ProductsProvider };
