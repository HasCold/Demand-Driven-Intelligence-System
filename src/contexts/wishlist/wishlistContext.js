import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchWishlistIds, toggleWishlistProduct } from '../../services/xBeatApi';
import commonContext from '../common/commonContext';

const wishlistContext = createContext({
  wishlistIds: [],
  loading: false,
  isInWishlist: () => false,
  toggleWishlist: async () => {},
});

const WishlistProvider = ({ children }) => {
  const { authSessionChecked, formUserInfo, openAccountForm } = useContext(commonContext);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authSessionChecked) {
      return;
    }
    if (!formUserInfo) {
      setWishlistIds([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchWishlistIds()
      .then((ids) => {
        if (!cancelled) setWishlistIds(Array.isArray(ids) ? ids : []);
      })
      .catch(() => {
        if (!cancelled) setWishlistIds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authSessionChecked, formUserInfo]);

  const isInWishlist = useCallback(
    (productId) => Boolean(productId && wishlistIds.includes(String(productId))),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      if (!formUserInfo) {
        openAccountForm('login');
        return;
      }
      try {
        const { inWishlist } = await toggleWishlistProduct(productId);
        setWishlistIds((prev) => {
          const s = new Set(prev.map(String));
          if (inWishlist) s.add(String(productId));
          else s.delete(String(productId));
          return [...s];
        });
      } catch {
        // keep previous state
      }
    },
    [formUserInfo, openAccountForm]
  );

  const value = useMemo(
    () => ({
      wishlistIds,
      loading,
      isInWishlist,
      toggleWishlist,
    }),
    [wishlistIds, loading, isInWishlist, toggleWishlist]
  );

  return <wishlistContext.Provider value={value}>{children}</wishlistContext.Provider>;
};

export default wishlistContext;
export { WishlistProvider };
