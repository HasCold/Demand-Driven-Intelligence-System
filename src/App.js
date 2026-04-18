import { CommonProvider } from './contexts/common/commonContext';
import { CartProvider } from './contexts/cart/cartContext';
import { ProductsProvider } from './contexts/products/productsContext';
import { WishlistProvider } from './contexts/wishlist/wishlistContext';
import Header from './components/common/Header';
import XBeatLoginModal from './components/common/XBeatLoginModal';
import RouterRoutes from './routes/RouterRoutes';
import Footer from './components/common/Footer';
import BackTop from './components/common/BackTop';
import { FiltersProvider } from './contexts/filters/filtersContext';


const App = () => {
  return (
    <>
      <CommonProvider>
        <WishlistProvider>
        <ProductsProvider>
          <FiltersProvider>
            <CartProvider>
              <Header />
              <XBeatLoginModal />
              <RouterRoutes />
              <Footer />
              <BackTop />
            </CartProvider>
          </FiltersProvider>
        </ProductsProvider>
        </WishlistProvider>
      </CommonProvider>
    </>
  );
};

export default App;
