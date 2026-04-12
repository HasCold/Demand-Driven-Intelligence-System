import React, { useContext, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y } from 'swiper';
import productsContext from '../../contexts/products/productsContext';
import ProductCard from '../product/ProductCard';

import 'swiper/scss';
import 'swiper/scss/pagination';


const normTitle = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

const RelatedSlider = (props) => {

    const { category, platform, slug, excludeTitle } = props;
    const { products } = useContext(productsContext);

    const relatedProduct = useMemo(() => {
        const ex = excludeTitle != null ? normTitle(excludeTitle) : '';
        return products.filter(item => {
            if (item.category !== category) return false;
            if (platform && slug && item.platform === platform && item.slug === slug) return false;
            if (ex && normTitle(item.title) === ex) return false;
            return true;
        });
    }, [products, category, platform, slug, excludeTitle]);


    return (
        <Swiper
            modules={[Pagination, A11y]}
            spaceBetween={10}
            slidesPerView={"auto"}
            pagination={{ clickable: true }}
            breakpoints={{
                480: {
                    slidesPerView: 2,
                },
                768: {
                    slidesPerView: 2,
                },
                992: {
                    slidesPerView: 4,
                },
            }}
            className="related_swiper"
        >
            {
                relatedProduct.map(item => (
                    <SwiperSlide key={item.id}>
                        <ProductCard {...item} />
                    </SwiperSlide>
                ))
            }
        </Swiper>
    );
};

export default RelatedSlider;
