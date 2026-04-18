import React, { useContext, useMemo } from 'react';
import { BsExclamationCircle } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import useDocTitle from '../hooks/useDocTitle';
import ProductCard from '../components/product/ProductCard';
import Services from '../components/common/Services';
import EmptyView from '../components/common/EmptyView';
import filtersContext from '../contexts/filters/filtersContext';
import wishlistContext from '../contexts/wishlist/wishlistContext';

const Wishlist = () => {
    useDocTitle('Wishlist');

    const { allProducts, productsLoading, productsError } = useContext(filtersContext);
    const { wishlistIds } = useContext(wishlistContext);

    const savedProducts = useMemo(
        () =>
            allProducts.filter(
                (p) => p.productId && wishlistIds.includes(String(p.productId))
            ),
        [allProducts, wishlistIds]
    );

    return (
        <>
            <section id="wishlist_page" className="section">
                <div className="container">
                    <h2 className="wishlist_page_heading">Your wishlist</h2>
                    {
                        productsLoading ? (
                            <p>Loading…</p>
                        ) : productsError ? (
                            <EmptyView
                                icon={<BsExclamationCircle />}
                                msg={productsError}
                            />
                        ) : savedProducts.length ? (
                            <div className="wrapper products_wrapper">
                                {
                                    savedProducts.map((item) => (
                                        <ProductCard
                                            key={item.id}
                                            {...item}
                                        />
                                    ))
                                }
                            </div>
                        ) : (
                            <EmptyView
                                icon={<BsExclamationCircle />}
                                msg="Your wishlist is empty."
                            />
                        )
                    }
                    <p className="wishlist_page_back">
                        <Link to="/all-products">Browse all products</Link>
                    </p>
                </div>
            </section>

            <Services />
        </>
    );
};

export default Wishlist;
