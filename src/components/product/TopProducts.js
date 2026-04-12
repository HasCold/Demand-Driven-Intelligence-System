import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BsArrowRight } from 'react-icons/bs';
import useActive from '../../hooks/useActive';
import productsContext from '../../contexts/products/productsContext';
import ProductCard from './ProductCard';


const TopProducts = () => {

    const { products: catalogProducts, loading } = useContext(productsContext);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const { activeClass, handleActive } = useActive(0);

    const productsCategory = useMemo(() => {
        const fromData = [...new Set(catalogProducts.map(item => item.category).filter(Boolean))];
        return ['All', ...fromData.sort()];
    }, [catalogProducts]);

    const products = useMemo(() => {
        if (categoryFilter === 'All') return catalogProducts;
        return catalogProducts.filter(item => item.category === categoryFilter);
    }, [catalogProducts, categoryFilter]);


    // handling product's filtering
    const handleProducts = (category, i) => {
        setCategoryFilter(category);
        handleActive(i);
    };


    return (
        <>
            <div className="products_filter_tabs">
                <ul className="tabs">
                    {
                        productsCategory.map((item, i) => (
                            <li
                                key={item}
                                className={`tabs_item ${activeClass(i)}`}
                                onClick={() => handleProducts(item, i)}
                            >
                                {item}
                            </li>
                        ))
                    }
                </ul>
            </div>
            <div className="wrapper products_wrapper">
                {
                    loading ? (
                        <p>Loading products…</p>
                    ) : (
                        products.slice(0, 11).map(item => (
                            <ProductCard
                                key={item.id}
                                {...item}
                            />
                        ))
                    )
                }
                <div className="card products_card browse_card">
                    <Link to="/all-products">
                        Browse All <br /> Products <BsArrowRight />
                    </Link>
                </div>
            </div>
        </>
    );
};

export default TopProducts;
