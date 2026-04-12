import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Autoplay } from 'swiper';
import { displayMoney } from '../../helpers/utils';
import productsContext from '../../contexts/products/productsContext';

import 'swiper/scss';
import 'swiper/scss/autoplay';
import 'swiper/scss/pagination';


const HeroSlider = () => {

    const { products, loading } = useContext(productsContext);

    const heroProducts = useMemo(() => {
        const heroes = products.filter(item => item.tag === 'hero-product');
        if (heroes.length) return heroes;
        return products.filter(item => item.tag === 'featured-product').slice(0, 6);
    }, [products]);


    if (loading || !heroProducts.length) {
        return null;
    }


    return (
        <Swiper
            modules={[Pagination, A11y, Autoplay]}
            loop={true}
            speed={400}
            spaceBetween={100}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{
                delay: 4000,
                disableOnInteraction: false,
            }}
        >
            {
                heroProducts.map((item, i) => {
                    const { id, title, tagline, heroImage, finalPrice, originalPrice, detailPath, path } = item;
                    const newPrice = displayMoney(finalPrice);
                    const oldPrice = displayMoney(originalPrice);
                    const to = detailPath || `${path || '/product-details/'}${id}`;

                    return (
                        <SwiperSlide
                            key={id}
                            className={`wrapper hero_wrapper hero_slide-${i}`}
                        >
                            <div className="hero_item_txt">
                                <h3>{title}</h3>
                                <h1>{tagline || item.info}</h1>
                                <h2 className="hero_price">
                                    {newPrice} &nbsp;
                                    <small><del>{oldPrice}</del></small>
                                </h2>
                                <Link to={to} className="btn">Shop Now</Link>
                            </div>
                            <figure className="hero_item_img">
                                <img src={heroImage} alt="product-img" />
                            </figure>
                        </SwiperSlide>
                    );
                })
            }
        </Swiper>
    );
};

export default HeroSlider;
