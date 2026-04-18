import React from 'react';
import { Routes, Route } from 'react-router';
import useScrollRestore from '../hooks/useScrollRestore';
import AllProducts from '../pages/AllProducts';
import Wishlist from '../pages/Wishlist';
import Cart from '../pages/Cart';
import Home from '../pages/Home';
import ProductDetails from '../pages/ProductDetails';
import ErrorPage from '../pages/ErrorPage';

const RouterRoutes = () => {

    useScrollRestore();

    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/all-products" element={<AllProducts />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/product-details/:platform/:slug" element={<ProductDetails />} />
                <Route path="*" element={<ErrorPage />} />
            </Routes>
        </>
    );
};

export default RouterRoutes;