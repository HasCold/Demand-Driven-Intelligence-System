import React, { useContext } from 'react';
import { IoMdStar } from 'react-icons/io';
import { Link } from 'react-router-dom';
import { displayMoney } from '../../helpers/utils';
import cartContext from '../../contexts/cart/cartContext';
import useActive from '../../hooks/useActive';


const ProductCard = (props) => {

    const { id, images, title, info, finalPrice, originalPrice, rateCount, path, detailPath, availablePlatformLabels, priceRange } = props;

    const productLink = detailPath || `${path || '/product-details/'}${id}`;

    const { addItem } = useContext(cartContext);
    const { active, handleActive, activeClass } = useActive(false);


    // handling Add-to-cart
    const handleAddItem = () => {
        const item = { ...props };
        addItem(item);

        handleActive(id);

        setTimeout(() => {
            handleActive(false);
        }, 3000);
    };

    const newPrice = displayMoney(finalPrice);
    const oldPrice = displayMoney(originalPrice);


    return (
        <>
            <div className="card products_card">
                <figure className="products_img">
                    <Link to={productLink}>
                        <img src={images[0]} alt="product-img" />
                    </Link>
                </figure>
                <div className="products_details">
                    <span className="rating_star">
                        {
                            [...Array(rateCount)].map((_, i) => <IoMdStar key={i} />)
                        }
                    </span>
                    <h3 className="products_title">
                        <Link to={productLink}>{title}</Link>
                    </h3>
                    <h5 className="products_info">{info}</h5>
                    {
                        availablePlatformLabels && availablePlatformLabels.length > 0 && (
                            <p className="products_sites" style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.35rem' }}>
                                {availablePlatformLabels.length > 1 ? 'On: ' : 'Store: '}
                                {availablePlatformLabels.join(' · ')}
                            </p>
                        )
                    }
                    <div className="separator"></div>
                    <h2 className="products_price">
                        {priceRange && priceRange.min !== priceRange.max ? (
                            <>From {displayMoney(priceRange.min)}</>
                        ) : (
                            <>{newPrice}</>
                        )}
                        &nbsp;
                        <small><del>{oldPrice}</del></small>
                    </h2>
                    {
                        priceRange && priceRange.min !== priceRange.max && (
                            <p className="products_price_range" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                Up to {displayMoney(priceRange.max)} on another store
                            </p>
                        )
                    }
                    <button
                        type="button"
                        className={`btn products_btn ${activeClass(id)}`}
                        onClick={handleAddItem}
                    >
                        {active ? 'Added' : 'Add to cart'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductCard;