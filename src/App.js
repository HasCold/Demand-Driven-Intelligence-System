import { CommonProvider } from './contexts/common/commonContext';
import { CartProvider } from './contexts/cart/cartContext';
import { ProductsProvider } from './contexts/products/productsContext';
import Header from './components/common/Header';
import RouterRoutes from './routes/RouterRoutes';
import Footer from './components/common/Footer';
import BackTop from './components/common/BackTop';
import { FiltersProvider } from './contexts/filters/filtersContext';


const App = () => {
  return (
    <>
      <CommonProvider>
        <ProductsProvider>
          <FiltersProvider>
            <CartProvider>
              <Header />
              <RouterRoutes />
              <Footer />
              <BackTop />
            </CartProvider>
          </FiltersProvider>
        </ProductsProvider>
      </CommonProvider>
    </>
  );
};

export default App;
