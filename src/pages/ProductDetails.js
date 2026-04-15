import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IoMdStar, IoMdCheckmark } from 'react-icons/io';
import { calculateDiscount, displayMoney } from '../helpers/utils';
import useDocTitle from '../hooks/useDocTitle';
import useActive from '../hooks/useActive';
import cartContext from '../contexts/cart/cartContext';
import { fetchXBeatProduct } from '../services/xBeatApi';
import { mapDbProductToXbeat } from '../utils/mapXBeatProduct';
import SectionsHead from '../components/common/SectionsHead';
import RelatedSlider from '../components/sliders/RelatedSlider';
import ProductSummary from '../components/product/ProductSummary';
import DemandAnalytics from '../components/product/DemandAnalytics';
import Services from '../components/common/Services';


const ProductDetails = () => {

    useDocTitle('Product Details');

    const { handleActive, activeClass } = useActive(0);

    const { addItem } = useContext(cartContext);

    const { platform, slug } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        setProduct(null);

        fetchXBeatProduct(platform, slug)
            .then((raw) => {
                if (cancelled) return;
                setProduct(mapDbProductToXbeat(raw));
            })
            .catch(() => {
                if (!cancelled) setNotFound(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [platform, slug]);

    const [previewImg, setPreviewImg] = useState(null);

    useEffect(() => {
        if (product?.images?.length) {
            setPreviewImg(product.images[0]);
            handleActive(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product]);


    // handling Add-to-cart
    const handleAddItem = () => {
        if (product) addItem(product);
    };


    // handling Preview image
    const handlePreviewImg = (i) => {
        if (!product?.images?.[i]) return;
        setPreviewImg(product.images[i]);
        handleActive(i);
    };


    if (loading) {
        return (
            <section id="product_details" className="section">
                <div className="container">
                    <p>Loading product…</p>
                </div>
            </section>
        );
    }

    if (notFound || !product) {
        return (
            <section id="product_details" className="section">
                <div className="container">
                    <p>Product not found.</p>
                    <Link to="/all-products">Back to all products</Link>
                </div>
            </section>
        );
    }

    const {
        images,
        title,
        info,
        category,
        finalPrice,
        originalPrice,
        ratings,
        rateCount,
        inStock,
        availability,
        platform: listingPlatform,
        slug: listingSlug,
        productId,
    } = product;

    const discountedPrice = originalPrice - finalPrice;
    const newPrice = displayMoney(finalPrice);
    const oldPrice = displayMoney(originalPrice);
    const savedPrice = displayMoney(discountedPrice);
    const savedDiscount = calculateDiscount(discountedPrice, originalPrice);


    return (
        <>
            <section id="product_details" className="section">
                <div className="container">
                    <div className="wrapper prod_details_wrapper">

                        {/*=== Product Details Left-content ===*/}
                        <div className="prod_details_left_col">
                            <div className="prod_details_tabs">
                                {
                                    images.map((img, i) => (
                                        <div
                                            key={i}
                                            className={`tabs_item ${activeClass(i)}`}
                                            onClick={() => handlePreviewImg(i)}
                                        >
                                            <img src={img} alt="product-img" />
                                        </div>
                                    ))
                                }
                            </div>
                            <figure className="prod_details_img">
                                <img src={previewImg || images[0]} alt="product-img" />
                            </figure>
                        </div>

                        {/*=== Product Details Right-content ===*/}
                        <div className="prod_details_right_col">
                            <h1 className="prod_details_title">{title}</h1>
                            <h4 className="prod_details_info">{info}</h4>

                            {
                                availability && availability.length > 1 && (
                                    <div className="prod_details_sites" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Available on</h4>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {
                                                availability.map((a) => {
                                                    const isThis = a.platform === listingPlatform && a.slug === listingSlug;
                                                    const label = `${a.label} — ${displayMoney(a.price)}`;
                                                    return (
                                                        <li key={`${a.platform}-${a.slug}`} style={{ marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                                                            {
                                                                isThis ? (
                                                                    <span><strong>{label}</strong> <span style={{ opacity: 0.75 }}>(this page)</span></span>
                                                                ) : (
                                                                    <Link to={`/product-details/${encodeURIComponent(a.platform)}/${encodeURIComponent(a.slug)}`}>
                                                                        {label}
                                                                    </Link>
                                                                )
                                                            }
                                                        </li>
                                                    );
                                                })
                                            }
                                        </ul>
                                    </div>
                                )
                            }

                            <div className="prod_details_ratings">
                                <span className="rating_star">
                                    {
                                        [...Array(rateCount)].map((_, i) => <IoMdStar key={i} />)
                                    }
                                </span>
                                <span>|</span>
                                <Link to="*">{ratings} Ratings</Link>
                            </div>

                            <div className="separator"></div>

                            <div className="prod_details_price">
                                <div className="price_box">
                                    <h2 className="price">
                                        {newPrice} &nbsp;
                                        <small className="del_price"><del>{oldPrice}</del></small>
                                    </h2>
                                    <p className="saved_price">You save: {savedPrice} ({savedDiscount}%)</p>
                                    <span className="tax_txt">(Inclusive of all taxes)</span>
                                </div>

                                <div className="badge">
                                    <span><IoMdCheckmark /> {inStock ? 'In Stock' : 'Out of Stock'}</span>
                                </div>
                            </div>

                            <div className="separator"></div>

                            <div className="prod_details_offers">
                                <h4>Offers and Discounts</h4>
                                <ul>
                                    <li>No Cost EMI on Credit Card</li>
                                    <li>Pay Later & Avail Cashback</li>
                                </ul>
                            </div>

                            <div className="separator"></div>

                            <div className="prod_details_buy_btn">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={handleAddItem}
                                    disabled={!inStock}
                                >
                                    Add to cart
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <ProductSummary {...product} />

            <DemandAnalytics
                productId={productId}
                availability={availability}
                productSlug={listingSlug}
            />

            <section id="related_products" className="section">
                <div className="container">
                    <SectionsHead heading="Related Products" />
                    <RelatedSlider
                        category={category}
                        platform={product.platform}
                        slug={product.slug}
                        excludeTitle={title}
                    />
                </div>
            </section>

            <Services />
        </>
    );
};

export default ProductDetails;
