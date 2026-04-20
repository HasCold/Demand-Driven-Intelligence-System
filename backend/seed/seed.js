const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bachat-bazaar';

// Generate 12-month price history
function generatePriceHistory(basePrice) {
  const months = ['Mar 2025','Apr 2025','May 2025','Jun 2025','Jul 2025','Aug 2025',
    'Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026'];
  return months.map((month) => ({
    month,
    price: Math.round(basePrice * (0.85 + Math.random() * 0.35))
  }));
}

const products = [
  {
    name: 'Xiaomi Redmi Note 13 Pro',
    slug: 'xiaomi-redmi-note-13-pro',
    description: 'Redmi Note 13 Pro features 250MP camera, 6.5" AMOLED 130Hz display, 4900mAh battery with 70W turbo charging. Snapdragon 7s Gen 2 processor for smooth performance.',
    shortDescription: '6.4" AMOLED · 4900mAh · 250MP Camera · 5G',
    price: 67999,
    originalPrice: 70999,
    discount: 17,
    category: 'Mobiles',
    brand: 'Xiaomi',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    stock: 55, inStock: true, rating: 4.6, reviewCount: 421, badge: 'new',
    tags: ['mobile', 'xiaomi', 'redmi', 'smartphone'],
    specifications: new Map([['Camera','200MP'],['Display','6.67" AMOLED 120Hz'],['Battery','5100mAh'],['Charging','67W']]),
    reviews: [
      { user: 'Ahmed R.', rating: 5, comment: 'Excellent phone for the price. Camera is superb!', avatar: 'https://i.pravatar.cc/40?img=1' },
      { user: 'Fatima K.', rating: 4, comment: 'Great battery life, smooth performance.', avatar: 'https://i.pravatar.cc/40?img=5' }
    ],
    priceHistory: generatePriceHistory(67999)
  },
  {
    name: 'Haier 1.5 Ton Inverter AC',
    slug: 'haier-1-5-ton-inverter-ac',
    description: 'Haier 1.5 Ton Triple Inverter AC with UV protection, self-cleaning, and 60% energy savings. Ideal for medium-sized rooms with fast cooling technology and ultra-quiet operation.',
    shortDescription: '1.5 Ton · Inverter · 5-Star · UV Filter',
    price: 119000,
    originalPrice: 139000,
    discount: 14,
    category: 'Home Appliances',
    brand: 'Haier',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1631567086268-7c8dd5c2ed59?w=600',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1631567086268-7c8dd5c2ed59?w=400',
    stock: 18, inStock: true, rating: 4.3, reviewCount: 178, featured: true, badge: 'sale',
    tags: ['ac', 'inverter', 'haier', 'cooling'],
    specifications: new Map([['Capacity','1.5 Ton'],['Type','Inverter'],['Energy Rating','5 Star'],['Cooling','Fast Cool'],['Noise','19dB']]),
    reviews: [
      { user: 'Usman T.', rating: 5, comment: 'Cools room in minutes! Light on electricity.', avatar: 'https://i.pravatar.cc/40?img=8' },
      { user: 'Zara M.', rating: 4, comment: 'Very quiet operation, energy efficient.', avatar: 'https://i.pravatar.cc/40?img=12' }
    ],
    priceHistory: generatePriceHistory(119000)
  },
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: 'The Nike Air Max 270 features Nike\'s biggest heel Air unit yet for incredible cushioning all day. The bold, dynamic style with mesh upper gives you a breathable, lightweight feel.',
    shortDescription: 'Max Cushioning · Mesh Upper · Air Unit',
    price: 17999,
    originalPrice: 21999,
    discount: 21,
    category: 'Footwear',
    brand: 'Nike',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    stock: 67, inStock: true, rating: 4.7, reviewCount: 543, featured: true, badge: 'top',
    tags: ['shoes', 'nike', 'sneakers', 'sports'],
    specifications: new Map([['Material','Mesh + Synthetic'],['Sole','Air Cushion'],['Closure','Lace-up'],['Available Sizes','6-12 UK']]),
    reviews: [
      { user: 'Ali H.', rating: 5, comment: 'Best shoes I\'ve owned. Super comfortable!', avatar: 'https://i.pravatar.cc/40?img=3' },
      { user: 'Sara N.', rating: 4, comment: 'Stylish and lightweight.', avatar: 'https://i.pravatar.cc/40?img=9' }
    ],
    priceHistory: generatePriceHistory(17999)
  },
  {
    name: 'Dell Inspiron 15 Laptop',
    slug: 'dell-inspiron-15',
    description: 'Dell Inspiron 15 with Intel Core i5-12th Gen, 16GB RAM, 512GB SSD and 15.6" FHD display. Windows 11 pre-installed with dedicated Intel Iris Xe Graphics. Ideal for students and professionals.',
    shortDescription: 'i5 12th Gen · 16GB · 512GB SSD · 15.6" FHD',
    price: 119999,
    originalPrice: 134999,
    discount: 11,
    category: 'Laptops',
    brand: 'Dell',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    stock: 22, inStock: true, rating: 4.4, reviewCount: 289, featured: true, badge: 'new',
    tags: ['laptop', 'dell', 'computer', 'student'],
    specifications: new Map([['Processor','Intel Core i5-1235U'],['RAM','16GB DDR4'],['Storage','512GB NVMe SSD'],['Display','15.6" FHD'],['OS','Windows 11']]),
    reviews: [
      { user: 'Hassan Q.', rating: 5, comment: 'Blazing fast! Great value laptop.', avatar: 'https://i.pravatar.cc/40?img=6' }
    ],
    priceHistory: generatePriceHistory(119999)
  },
  {
    name: 'Kenwood Chef Mixer',
    slug: 'kenwood-chef-mixer',
    description: 'Kenwood Chef stand mixer with 1400W motor, 6.7L stainless steel bowl, and 10 variable speeds. Includes dough hook, whisk and beater attachments. Perfect for baking enthusiasts.',
    shortDescription: '1400W · 6.7L Bowl · 10 Speeds · 3 Attachments',
    price: 45999,
    originalPrice: 54999,
    discount: 16,
    category: 'Kitchen',
    brand: 'Kenwood',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    stock: 14, inStock: true, rating: 4.6, reviewCount: 201, badge: 'hot',
    tags: ['kitchen', 'mixer', 'kenwood', 'baking'],
    specifications: new Map([['Power','1400W'],['Bowl Capacity','6.7L'],['Speeds','10'],['Material','Stainless Steel']]),
    reviews: [
      { user: 'Ayesha B.', rating: 5, comment: 'Makes baking so easy! Powerful motor.', avatar: 'https://i.pravatar.cc/40?img=15' }
    ],
    priceHistory: generatePriceHistory(45999)
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5',
    description: 'Industry-leading noise cancellation with Sony\'s V1 chip. 30-hour battery, Speak-to-Chat, multipoint connection and premium audio quality. Foldable design for easy portability.',
    shortDescription: 'ANC · 30hr Battery · Multipoint · Hi-Res',
    price: 59999,
    originalPrice: 74999,
    discount: 20,
    category: 'Electronics',
    brand: 'Sony',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400',
    stock: 33, inStock: true, rating: 4.8, reviewCount: 671, featured: true, badge: 'top',
    tags: ['headphones', 'sony', 'anc', 'audio'],
    specifications: new Map([['Driver','40mm'],['Battery','30 hours'],['ANC','Yes'],['Connectivity','Bluetooth 5.2'],['Weight','250g']]),
    reviews: [
      { user: 'Bilal S.', rating: 5, comment: 'Incredible noise cancellation. Worth every rupee!', avatar: 'https://i.pravatar.cc/40?img=11' },
      { user: 'Hina F.', rating: 5, comment: 'Crystal clear audio, super comfortable.', avatar: 'https://i.pravatar.cc/40?img=20' }
    ],
    priceHistory: generatePriceHistory(59999)
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5',
    description: 'Industry-leading noise cancellation with Sony\'s V1 chip. 30-hour battery, Speak-to-Chat, multipoint connection and premium audio quality. Foldable design for easy portability.',
    shortDescription: 'ANC · 30hr Battery · Multipoint · Hi-Res',
    price: 59999,
    originalPrice: 72999,
    discount: 20,
    category: 'Electronics',
    brand: 'Sony',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400',
    stock: 33, inStock: true, rating: 4.8, reviewCount: 671, featured: true, badge: 'top',
    tags: ['headphones', 'sony', 'anc', 'audio'],
    specifications: new Map([['Driver','40mm'],['Battery','30 hours'],['ANC','Yes'],['Connectivity','Bluetooth 5.2'],['Weight','250g']]),
    reviews: [
      { user: 'Bilal S.', rating: 5, comment: 'Incredible noise cancellation. Worth every rupee!', avatar: 'https://i.pravatar.cc/40?img=11' },
      { user: 'Hina F.', rating: 5, comment: 'Crystal clear audio, super comfortable.', avatar: 'https://i.pravatar.cc/40?img=20' }
    ],
    priceHistory: generatePriceHistory(59999)
  },
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: 'The Nike Air Max 270 features Nike\'s biggest heel Air unit yet for incredible cushioning all day. The bold, dynamic style with mesh upper gives you a breathable, lightweight feel.',
    shortDescription: 'Max Cushioning · Mesh Upper · Air Unit',
    price: 4999,
    originalPrice: 6999,
    discount: 21,
    category: 'Footwear',
    brand: 'Nike',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    stock: 67, inStock: true, rating: 4.7, reviewCount: 543, featured: true, badge: 'top',
    tags: ['shoes', 'nike', 'sneakers', 'sports'],
    specifications: new Map([['Material','Mesh + Synthetic'],['Sole','Air Cushion'],['Closure','Lace-up'],['Available Sizes','6-12 UK']]),
    reviews: [],
    priceHistory: generatePriceHistory(4999)
  },
  {
    name: 'Dawlance Refrigerator 9 Cu Ft',
    slug: 'dawlance-refrigerator-9cuft',
    description: 'Dawlance 9 cubic feet refrigerator with inverter compressor, 40% energy savings, diamond interior and large vegetable box. Ideal for small to medium families.',
    shortDescription: 'Inverter · 9 Cu Ft · Diamond Interior · 40% Energy Saving',
    price: 64999,
    originalPrice: 74999,
    discount: 13,
    category: 'Home Appliances',
    brand: 'Dawlance',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600',
      'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400',
    stock: 11, inStock: true, rating: 4.3, reviewCount: 98, badge: '',
    tags: ['refrigerator', 'dawlance', 'fridge', 'inverter'],
    specifications: new Map([['Capacity','9 Cu Ft'],['Type','Inverter'],['Energy Saving','40%'],['Color','Silver']]),
    reviews: [],
    priceHistory: generatePriceHistory(64999)
  },
  {
    name: 'Gul Ahmed Lawn Suit 3-Piece',
    slug: 'gul-ahmed-lawn-suit-3piece',
    description: 'Premium Gul Ahmed lawn 3-piece unstitched suit with embroidered front, printed back and dupatta. 100% cotton lawn fabric, perfect for summer occasions.',
    shortDescription: '3-Piece · Embroidered · 100% Cotton · Unstitched',
    price: 3499,
    originalPrice: 4999,
    discount: 30,
    category: 'Clothing',
    brand: 'Gul Ahmed',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
    stock: 150, inStock: true, rating: 4.5, reviewCount: 387, featured: true, badge: 'sale',
    tags: ['lawn', 'clothing', 'gul ahmed', 'summer'],
    specifications: new Map([['Fabric','100% Cotton Lawn'],['Pieces','3'],['Type','Unstitched'],['Occasion','Casual/Formal']]),
    reviews: [
      { user: 'Nadia P.', rating: 5, comment: 'Beautiful print, excellent quality fabric!', avatar: 'https://i.pravatar.cc/40?img=22' }
    ],
    priceHistory: generatePriceHistory(3499)
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro',
    slug: 'xiaomi-redmi-note-13-pro',
    description: 'Redmi Note 13 Pro features 200MP camera, 6.67" AMOLED 120Hz display, 5100mAh battery with 67W turbo charging. Snapdragon 7s Gen 2 processor for smooth performance.',
    shortDescription: '200MP · 6.67" AMOLED · 5100mAh · 67W Charging',
    price: 61999,
    originalPrice: 72999,
    discount: 15,
    category: 'Mobiles',
    brand: 'Xiaomi',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
    stock: 55, inStock: true, rating: 4.6, reviewCount: 421, badge: 'new',
    tags: ['mobile', 'xiaomi', 'redmi', 'smartphone'],
    specifications: new Map([['Camera','200MP'],['Display','6.67" AMOLED 120Hz'],['Battery','5100mAh'],['Charging','67W']]),
    reviews: [],
    priceHistory: generatePriceHistory(61999)
  },
  {
    name: 'Kenwood Chef Mixer',
    slug: 'kenwood-chef-mixer',
    description: 'Kenwood Chef stand mixer with 1400W motor, 6.7L stainless steel bowl, and 10 variable speeds. Includes dough hook, whisk and beater attachments. Perfect for baking enthusiasts.',
    shortDescription: '1400W · 6.7L Bowl · 10 Speeds · 3 Attachments',
    price: 43199,
    originalPrice: 50999,
    discount: 16,
    category: 'Kitchen',
    brand: 'Kenwood',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    stock: 14, inStock: true, rating: 4.6, reviewCount: 201, badge: 'hot',
    tags: ['kitchen', 'mixer', 'kenwood', 'baking'],
    specifications: new Map([['Power','1400W'],['Bowl Capacity','6.7L'],['Speeds','10'],['Material','Stainless Steel']]),
    reviews: [],
    priceHistory: generatePriceHistory(43199)
  },
  {
    name: 'Orient 32" LED TV',
    slug: 'orient-32-led-tv',
    description: 'Orient 32" HD Ready LED TV with built-in speaker, HDMI and USB ports. Crystal clear display, energy-saving technology and wide viewing angle. Perfect for bedroom or small living rooms.',
    shortDescription: '32" HD Ready · Built-in Speaker · HDMI + USB',
    price: 32999,
    originalPrice: 39999,
    discount: 18,
    category: 'Electronics',
    brand: 'Orient',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400',
    stock: 30, inStock: true, rating: 4.1, reviewCount: 145, badge: 'sale',
    tags: ['tv', 'orient', 'led', 'television'],
    specifications: new Map([['Screen Size','32"'],['Resolution','HD Ready'],['Ports','2x HDMI, 2x USB'],['Panel','LED']]),
    reviews: [],
    priceHistory: generatePriceHistory(32999)
  },
  {
    name: 'Orient 32" LED TV',
    slug: 'orient-32-led-tv',
    description: 'Orient 32" HD Ready LED TV with built-in speaker, HDMI and USB ports. Crystal clear display, energy-saving technology and wide viewing angle. Perfect for bedroom or small living rooms.',
    shortDescription: '32" HD Ready · Built-in Speaker · HDMI + USB',
    price: 29999,
    originalPrice: 35999,
    discount: 18,
    category: 'Electronics',
    brand: 'Orient',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400',
    stock: 30, inStock: true, rating: 4.1, reviewCount: 145, badge: 'sale',
    tags: ['tv', 'orient', 'led', 'television'],
    specifications: new Map([['Screen Size','32"'],['Resolution','HD Ready'],['Ports','2x HDMI, 2x USB'],['Panel','LED']]),
    reviews: [],
    priceHistory: generatePriceHistory(29999)
  },
  {
    name: 'Khaadi Embroidered Kurta',
    slug: 'khaadi-embroidered-kurta',
    description: 'Khaadi signature hand-woven embroidered kurta in premium cotton fabric. Intricate thread work on neckline and sleeves. Available in multiple colors. A fusion of heritage and modern styling.',
    shortDescription: 'Hand-woven · Embroidered · Premium Cotton',
    price: 5499,
    originalPrice: 7999,
    discount: 31,
    category: 'Clothing',
    brand: 'Khaadi',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    stock: 200, inStock: true, rating: 4.6, reviewCount: 678, featured: true, badge: 'top',
    tags: ['kurta', 'khaadi', 'clothing', 'embroidered'],
    specifications: new Map([['Fabric','Cotton'],['Style','Embroidered'],['Fit','Regular'],['Care','Hand wash']]),
    reviews: [],
    priceHistory: generatePriceHistory(5499)
  },
  {
    name: 'JBL Flip 6 Bluetooth Speaker',
    slug: 'jbl-flip-6',
    description: 'JBL Flip 6 portable waterproof speaker with powerful sound and deep bass. IP67 rated, 12-hour playtime, USB-C charging and PartyBoost for pairing multiple speakers.',
    shortDescription: 'IP67 · 12hr Battery · PartyBoost · USB-C',
    price: 19999,
    originalPrice: 24999,
    discount: 20,
    category: 'Electronics',
    brand: 'JBL',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    stock: 44, inStock: true, rating: 4.7, reviewCount: 389, badge: 'hot',
    tags: ['speaker', 'jbl', 'bluetooth', 'portable'],
    specifications: new Map([['Waterproof','IP67'],['Battery','12 hours'],['Connectivity','Bluetooth 5.1'],['Charging','USB-C']]),
    reviews: [],
    priceHistory: generatePriceHistory(19999)
  },
  {
    name: 'Molfix Baby Diapers Size 4 (50 pcs)',
    slug: 'molfix-baby-diapers-size4',
    description: 'Molfix Premium diapers with 3D technology for perfect fit, ultra dry core for 12-hour protection. Soft waistband, double leak guard. Size 4 (8-14 kg), pack of 50.',
    shortDescription: '50 Pcs · Size 4 · 12hr Protection · 3D Fit',
    price: 2199,
    originalPrice: 2699,
    discount: 19,
    category: 'Baby & Kids',
    brand: 'Molfix',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
      'https://images.unsplash.com/photo-1593476087123-36d1de271f08?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400',
    stock: 200, inStock: true, rating: 4.5, reviewCount: 1102, badge: 'sale',
    tags: ['diapers', 'baby', 'molfix', 'infant'],
    specifications: new Map([['Size','4 (8-14 kg)'],['Count','50 pcs'],['Protection','12 hours'],['Feature','Double Leak Guard']]),
    reviews: [],
    priceHistory: generatePriceHistory(2199)
  },
  {
    name: 'Nestle Everyday Milk Powder 2.5kg',
    slug: 'nestle-everyday-milk-powder-2-5kg',
    description: 'Nestle Everyday instant dry milk powder 2.5kg bucket. Rich in calcium and vitamins. Perfect for tea, coffee, desserts and cooking. Full cream for rich taste.',
    shortDescription: '2.5kg · Full Cream · Rich in Calcium · Instant',
    price: 3299,
    originalPrice: 3799,
    discount: 13,
    category: 'Groceries',
    brand: 'Nestle',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    stock: 300, inStock: true, rating: 4.4, reviewCount: 788, badge: '',
    tags: ['milk', 'powder', 'nestle', 'grocery'],
    specifications: new Map([['Weight','2.5 kg'],['Type','Full Cream'],['Format','Instant'],['Shelf Life','24 months']]),
    reviews: [],
    priceHistory: generatePriceHistory(3299)
  },
  {
    name: 'Unilever Surf Excel 3kg',
    slug: 'surf-excel-3kg',
    description: 'Surf Excel washing powder 3kg with active pre-wash technology. Removes tough stains in just one wash. Works in cold water. Gentle on colors and fabric.',
    shortDescription: '3kg · Pre-wash Technology · Cold Water · Color-safe',
    price: 999,
    originalPrice: 1199,
    discount: 17,
    category: 'Groceries',
    brand: 'Unilever',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400',
    stock: 500, inStock: true, rating: 4.3, reviewCount: 1456, badge: 'sale',
    tags: ['detergent', 'surf excel', 'laundry', 'washing'],
    specifications: new Map([['Weight','3 kg'],['Type','Powder'],['Function','Pre-wash'],['Water Temp','Cold/Warm']]),
    reviews: [],
    priceHistory: generatePriceHistory(999)
  },
  {
    name: 'HP DeskJet 2700 Printer',
    slug: 'hp-deskjet-2700',
    description: 'HP DeskJet 2700 all-in-one printer with wireless printing, scanning and copying. Compatible with HP Instant Ink subscription. Print up to 7.5ppm, 4800 dpi resolution.',
    shortDescription: 'Print · Scan · Copy · Wireless · 4800dpi',
    price: 24999,
    originalPrice: 29999,
    discount: 17,
    category: 'Electronics',
    brand: 'HP',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
    stock: 16, inStock: true, rating: 4.2, reviewCount: 234, badge: '',
    tags: ['printer', 'hp', 'wireless', 'scanner'],
    specifications: new Map([['Type','All-in-One'],['Print Speed','7.5 ppm'],['Resolution','4800 dpi'],['Connectivity','Wi-Fi + USB']]),
    reviews: [],
    priceHistory: generatePriceHistory(24999)
  },
  {
    name: 'HP DeskJet 2700 Printer',
    slug: 'hp-deskjet-2700',
    description: 'HP DeskJet 2700 all-in-one printer with wireless printing, scanning and copying. Compatible with HP Instant Ink subscription. Print up to 7.5ppm, 4800 dpi resolution.',
    shortDescription: 'Print · Scan · Copy · Wireless · 4800dpi',
    price: 28999,
    originalPrice: 32999,
    discount: 17,
    category: 'Electronics',
    brand: 'HP',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
    stock: 16, inStock: true, rating: 4.2, reviewCount: 234, badge: '',
    tags: ['printer', 'hp', 'wireless', 'scanner'],
    specifications: new Map([['Type','All-in-One'],['Print Speed','7.5 ppm'],['Resolution','4800 dpi'],['Connectivity','Wi-Fi + USB']]),
    reviews: [],
    priceHistory: generatePriceHistory(28999)
  },
  {
    name: 'Sapphire Summer Lawn 2-Piece',
    slug: 'sapphire-summer-lawn-2piece',
    description: 'Sapphire luxury summer lawn 2-piece suit with digital printed shirt and cambric trouser. Elegant floral design with fine finishing, suitable for casual and semi-formal wear.',
    shortDescription: '2-Piece · Digital Print · Cambric · Semi-formal',
    price: 4299,
    originalPrice: 5999,
    discount: 28,
    category: 'Clothing',
    brand: 'Sapphire',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    stock: 180, inStock: true, rating: 4.4, reviewCount: 312, badge: 'sale',
    tags: ['lawn', 'sapphire', 'summer', 'clothing'],
    specifications: new Map([['Pieces','2'],['Fabric','Lawn'],['Print','Digital'],['Style','Semi-formal']]),
    reviews: [],
    priceHistory: generatePriceHistory(4299)
  },
  {
    name: 'Logitech MX Master 3S Mouse',
    slug: 'logitech-mx-master-3s',
    description: 'Logitech MX Master 3S with 8000 DPI sensor, MagSpeed electromagnetic scrolling, quiet clicks and USB-C charging. Works on any surface including glass. Multi-device support up to 3 devices.',
    shortDescription: '8000 DPI · MagSpeed · Quiet Clicks · USB-C',
    price: 18499,
    originalPrice: 21999,
    discount: 16,
    category: 'Electronics',
    brand: 'Logitech',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    stock: 39, inStock: true, rating: 4.9, reviewCount: 567, featured: true, badge: 'top',
    tags: ['mouse', 'logitech', 'wireless', 'productivity'],
    specifications: new Map([['DPI','8000'],['Battery','70 days'],['Connectivity','Bluetooth + USB'],['Buttons','7']]),
    reviews: [],
    priceHistory: generatePriceHistory(18499)
  },
  {
    name: 'Logitech MX Master 3S Mouse',
    slug: 'logitech-mx-master-3s',
    description: 'Logitech MX Master 3S with 8000 DPI sensor, MagSpeed electromagnetic scrolling, quiet clicks and USB-C charging. Works on any surface including glass. Multi-device support up to 3 devices.',
    shortDescription: '8000 DPI · MagSpeed · Quiet Clicks · USB-C',
    price: 18599,
    originalPrice: 20999,
    discount: 16,
    category: 'Electronics',
    brand: 'Logitech',
    platform: 'shophub',
    images: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
    ],
    thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    stock: 39, inStock: true, rating: 4.9, reviewCount: 567, featured: true, badge: 'top',
    tags: ['mouse', 'logitech', 'wireless', 'productivity'],
    specifications: new Map([['DPI','8000'],['Battery','70 days'],['Connectivity','Bluetooth + USB'],['Buttons','7']]),
    reviews: [],
    priceHistory: generatePriceHistory(18599)
  },
  {
    name: 'Peshawari Chappal Genuine Leather',
    slug: 'peshawari-chappal-leather',
    description: 'Authentic handcrafted Peshawari chappal in genuine cowhide leather. Traditional Pashtun craftsmanship with padded insole and sturdy leather sole. Available in sizes 6-12.',
    shortDescription: 'Handcrafted · Genuine Leather · Traditional · Padded',
    price: 2999,
    originalPrice: 4499,
    discount: 33,
    category: 'Footwear',
    brand: 'Chappal Co.',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
      'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=600',
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    stock: 120, inStock: true, rating: 4.7, reviewCount: 923, badge: 'hot',
    tags: ['chappal', 'peshawari', 'leather', 'traditional'],
    specifications: new Map([['Material','Genuine Leather'],['Style','Traditional'],['Sizes','6-12 UK'],['Insole','Padded']]),
    reviews: [],
    priceHistory: generatePriceHistory(2999)
  },
  {
    name: 'Bosch Cordless Drill GSR 12V',
    slug: 'bosch-cordless-drill-gsr-12v',
    description: 'Bosch Professional 12V cordless drill with 2 Li-Ion batteries, charger and carrying case. 2-speed gearbox, 21+1 torque settings, LED work light. Compact and lightweight.',
    shortDescription: '12V · 2 Batteries · 21 Torque Settings · LED',
    price: 15999,
    originalPrice: 19999,
    discount: 20,
    category: 'Tools & Hardware',
    brand: 'Bosch',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    stock: 22, inStock: true, rating: 4.6, reviewCount: 234, badge: '',
    tags: ['drill', 'bosch', 'tools', 'cordless'],
    specifications: new Map([['Voltage','12V'],['Batteries','2x Li-Ion'],['Torque Settings','21+1'],['Speed','2-speed']]),
    reviews: [],
    priceHistory: generatePriceHistory(15999)
  },
  {
    name: 'Nido Bunyad 1.8kg Tin',
    slug: 'nido-bunyad-1-8kg',
    description: 'Nido Bunyad fortified milk powder for the whole family. Enriched with 26 nutrients including iron and zinc. 1.8kg tin with measuring spoon. Full cream taste, easy to dissolve.',
    shortDescription: '1.8kg · 26 Nutrients · Full Cream · Family Pack',
    price: 2799,
    originalPrice: 3199,
    discount: 13,
    category: 'Groceries',
    brand: 'Nestlé Nido',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',
      'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    stock: 400, inStock: true, rating: 4.5, reviewCount: 1099, badge: '',
    tags: ['milk', 'nido', 'grocery', 'nutrition'],
    specifications: new Map([['Weight','1.8 kg'],['Nutrients','26'],['Type','Full Cream'],['Format','Instant']]),
    reviews: [],
    priceHistory: generatePriceHistory(2799)
  },
  {
    name: 'Realme Buds Air 5 Pro TWS',
    slug: 'realme-buds-air-5-pro',
    description: 'Realme Buds Air 5 Pro with 50dB ANC, 11mm Dynamic Bass Boost driver, 360° spatial audio and 38-hour total battery life with case. Low latency gaming mode included.',
    shortDescription: '50dB ANC · 38hr Battery · Spatial Audio · Low Latency',
    price: 8999,
    originalPrice: 11999,
    discount: 25,
    category: 'Electronics',
    brand: 'Realme',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    stock: 65, inStock: true, rating: 4.4, reviewCount: 445, badge: 'new',
    tags: ['earbuds', 'realme', 'tws', 'anc'],
    specifications: new Map([['ANC','50dB'],['Battery','38 hours'],['Driver','11mm'],['Latency','88ms gaming']]),
    reviews: [],
    priceHistory: generatePriceHistory(8999)
  },
  {
    name: 'Realme Buds Air 5 Pro TWS',
    slug: 'realme-buds-air-5-pro',
    description: 'Realme Buds Air 5 Pro with 50dB ANC, 11mm Dynamic Bass Boost driver, 360° spatial audio and 38-hour total battery life with case. Low latency gaming mode included.',
    shortDescription: '50dB ANC · 38hr Battery · Spatial Audio · Low Latency',
    price: 7299,
    originalPrice: 11999,
    discount: 25,
    category: 'Electronics',
    brand: 'Realme',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    stock: 65, inStock: true, rating: 4.4, reviewCount: 445, badge: 'new',
    tags: ['earbuds', 'realme', 'tws', 'anc'],
    specifications: new Map([['ANC','50dB'],['Battery','38 hours'],['Driver','11mm'],['Latency','88ms gaming']]),
    reviews: [],
    priceHistory: generatePriceHistory(7299)
  },
  {
    name: 'Alkaram Studio Printed Shirt',
    slug: 'alkaram-printed-shirt',
    description: 'Al-Karam Studio men\'s printed casual shirt in premium Egyptian cotton. Classic collar, full button placket, regular fit. Bold geometric pattern, available in multiple colors.',
    shortDescription: 'Egyptian Cotton · Regular Fit · Printed · Casual',
    price: 2299,
    originalPrice: 3299,
    discount: 30,
    category: 'Clothing',
    brand: 'Alkaram',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
    stock: 300, inStock: true, rating: 4.3, reviewCount: 567, badge: 'sale',
    tags: ['shirt', 'alkaram', 'clothing', 'casual'],
    specifications: new Map([['Fabric','Egyptian Cotton'],['Fit','Regular'],['Occasion','Casual'],['Care','Machine wash']]),
    reviews: [],
    priceHistory: generatePriceHistory(2299)
  },
  {
    name: 'Prestige Pressure Cooker 6L',
    slug: 'prestige-pressure-cooker-6l',
    description: 'Prestige 6-litre aluminium pressure cooker with safety valve, gasket release system and pressure indicator. Cooks food 70% faster, energy efficient. Suitable for all stoves.',
    shortDescription: '6L · Safety Valve · 70% Faster Cooking · All Stoves',
    price: 3799,
    originalPrice: 4799,
    discount: 21,
    category: 'Kitchen',
    brand: 'Prestige',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600',
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    stock: 88, inStock: true, rating: 4.5, reviewCount: 678, badge: '',
    tags: ['cooker', 'pressure cooker', 'kitchen', 'prestige'],
    specifications: new Map([['Capacity','6 Litres'],['Material','Aluminium'],['Safety','Multi-valve'],['Compatible','Gas/Induction']]),
    reviews: [],
    priceHistory: generatePriceHistory(3799)
  },
  {
    name: 'Prestige Pressure Cooker 6L',
    slug: 'prestige-pressure-cooker-6l',
    description: 'Prestige 6-litre aluminium pressure cooker with safety valve, gasket release system and pressure indicator. Cooks food 70% faster, energy efficient. Suitable for all stoves.',
    shortDescription: '6L · Safety Valve · 70% Faster Cooking · All Stoves',
    price: 4219,
    originalPrice: 5799,
    discount: 21,
    category: 'Kitchen',
    brand: 'Prestige',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600',
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    stock: 88, inStock: true, rating: 4.5, reviewCount: 678, badge: '',
    tags: ['cooker', 'pressure cooker', 'kitchen', 'prestige'],
    specifications: new Map([['Capacity','6 Litres'],['Material','Aluminium'],['Safety','Multi-valve'],['Compatible','Gas/Induction']]),
    reviews: [],
    priceHistory: generatePriceHistory(4219)
  },
  {
    name: 'Dell Inspiron 15 Laptop',
    slug: 'dell-inspiron-15',
    description: 'Dell Inspiron 15 with Intel Core i5-12th Gen, 16GB RAM, 512GB SSD and 15.6" FHD display. Windows 11 pre-installed with dedicated Intel Iris Xe Graphics. Ideal for students and professionals.',
    shortDescription: 'i5 12th Gen · 16GB · 512GB SSD · 15.6" FHD',
    price: 109999,
    originalPrice: 122999,
    discount: 11,
    category: 'Laptops',
    brand: 'Dell',
    platform: 'shophub',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
    stock: 22, inStock: true, rating: 4.4, reviewCount: 289, featured: true, badge: 'new',
    tags: ['laptop', 'dell', 'computer', 'student'],
    specifications: new Map([['Processor','Intel Core i5-1235U'],['RAM','16GB DDR4'],['Storage','512GB NVMe SSD'],['Display','15.6" FHD'],['OS','Windows 11']]),
    reviews: [],
    priceHistory: generatePriceHistory(109999)
  },
  {
    name: 'Himalaya Baby Lotion 400ml',
    slug: 'himalaya-baby-lotion-400ml',
    description: 'Himalaya gentle baby lotion with olive oil and country mallow. Locks in moisture for 24 hours, clinically tested, dermatologist approved. No mineral oil, parabens or alcohol.',
    shortDescription: '400ml · Olive Oil · 24hr Moisture · Dermatologist Tested',
    price: 699,
    originalPrice: 899,
    discount: 22,
    category: 'Baby & Kids',
    brand: 'Himalaya',
    platform: 'bachat-bazar',
    images: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600',
      'https://images.unsplash.com/photo-1593476087123-36d1de271f08?w=600',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
    stock: 250, inStock: true, rating: 4.6, reviewCount: 2341, badge: 'top',
    tags: ['baby', 'lotion', 'himalaya', 'skincare'],
    specifications: new Map([['Volume','400ml'],['Key Ingredient','Olive Oil'],['Type','Gentle'],['Free From','Parabens, Alcohol']]),
    reviews: [],
    priceHistory: generatePriceHistory(699)
  },
  {
    name: 'JBL Live 660NC',
    slug: 'jbl-live-660nc',
    description: 'JBL Live 660NC wireless over-ear headphones with adaptive noise cancellation, powerful JBL signature sound and long battery life.',
    shortDescription: 'ANC · Wireless · Over-Ear · JBL Sound',
    price: 9999,
    originalPrice: 14999,
    discount: 33,
    category: 'Electronics',
    brand: 'JBL',
    platform: 'shophub',
    images: [
      '/images/products/jbl660nc-1.png',
      '/images/products/jbl660nc-2.png',
      '/images/products/jbl660nc-3.png',
      '/images/products/jbl660nc-4.png',
    ],
    thumbnail: '/images/products/jbl660nc-1.png',
    stock: 120,
    inStock: true,
    rating: 4.5,
    reviewCount: 1234,
    badge: 'top',
    tags: ['headphones', 'jbl', 'wireless', 'anc'],
    specifications: new Map([
      ['Type', 'Over Ear'],
      ['Connectivity', 'Wireless'],
      ['Noise Cancellation', 'Yes'],
      ['Usage', 'Music & Calls']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(9999)
  },
  {
    name: 'JBL Live 660NC',
    slug: 'jbl-live-660nc',
    description: 'JBL Live 660NC wireless over-ear headphones with adaptive noise cancellation, powerful JBL signature sound and long battery life.',
    shortDescription: 'ANC · Wireless · Over-Ear · JBL Sound',
    price: 1199,
    originalPrice: 14999,
    discount: 33,
    category: 'Electronics',
    brand: 'JBL',
    platform: 'bachat-bazar',
    images: [
      '/images/products/jbl660nc-1.png',
      '/images/products/jbl660nc-2.png',
      '/images/products/jbl660nc-3.png',
      '/images/products/jbl660nc-4.png',
    ],
    thumbnail: '/images/products/jbl660nc-1.png',
    stock: 120,
    inStock: true,
    rating: 4.5,
    reviewCount: 1234,
    badge: 'top',
    tags: ['headphones', 'jbl', 'wireless', 'anc'],
    specifications: new Map([
      ['Type', 'Over Ear'],
      ['Connectivity', 'Wireless'],
      ['Noise Cancellation', 'Yes'],
      ['Usage', 'Music & Calls']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(1199)
  },
  {
    name: 'boAt Rockerz 518',
    slug: 'boat-rockerz-518',
    description: 'boAt Rockerz 518 on-ear wireless headphones with immersive audio and long-lasting comfort for daily use.',
    shortDescription: 'Wireless · On-Ear · Budget · boAt',
    price: 1299,
    originalPrice: 3990,
    discount: 67,
    category: 'Electronics',
    brand: 'boAt',
    platform: 'shophub',
    images: [
      '/images/products/boat518-1.png',
      '/images/products/boat518-2.png',
      '/images/products/boat518-3.png',
      '/images/products/boat518-4.png'
    ],
    thumbnail: '/images/products/boat518-1.png',
    stock: 200,
    inStock: true,
    rating: 4.2,
    reviewCount: 1321,
    badge: 'sale',
    tags: ['headphones', 'boat', 'wireless', 'budget'],
    specifications: new Map([
      ['Type', 'On Ear'],
      ['Connectivity', 'Wireless'],
      ['Usage', 'Music'],
      ['Comfort', 'Lightweight']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(1299)
  },
  {
    name: 'boAt Rockerz 518',
    slug: 'boat-rockerz-518',
    description: 'boAt Rockerz 518 on-ear wireless headphones with immersive audio and long-lasting comfort for daily use.',
    shortDescription: 'Wireless · On-Ear · Budget · boAt',
    price: 1359,
    originalPrice: 3990,
    discount: 67,
    category: 'Electronics',
    brand: 'boAt',
    platform: 'bachat-bazar',
    images: [
      '/images/products/boat518-1.png',
      '/images/products/boat518-2.png',
      '/images/products/boat518-3.png',
      '/images/products/boat518-4.png'
    ],
    thumbnail: '/images/products/boat518-1.png',
    stock: 200,
    inStock: true,
    rating: 4.2,
    reviewCount: 1321,
    badge: 'sale',
    tags: ['headphones', 'boat', 'wireless', 'budget'],
    specifications: new Map([
      ['Type', 'On Ear'],
      ['Connectivity', 'Wireless'],
      ['Usage', 'Music'],
      ['Comfort', 'Lightweight']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(1359)
  },
  {
    name: 'boAt Airdopes 131',
    slug: 'boat-airdopes-131',
    description: 'boAt Airdopes 131 true wireless earbuds with lightweight design, seamless connectivity and all-day comfort.',
    shortDescription: 'TWS · Lightweight · Wireless · Budget',
    price: 1099,
    originalPrice: 2990,
    discount: 63,
    category: 'Electronics',
    brand: 'boAt',
    platform: 'shophub',
    images: [
      '/images/products/boat131-1.png',
      '/images/products/boat131-2.png',
      '/images/products/boat131-3.png',
      '/images/products/boat131-4.png',
    ],
    thumbnail: '/images/products/boat131-1.png',
    stock: 180,
    inStock: true,
    rating: 4.3,
    reviewCount: 1244,
    badge: 'top',
    tags: ['earbuds', 'boat', 'tws', 'wireless'],
    specifications: new Map([
      ['Type', 'In Ear'],
      ['Connectivity', 'Wireless'],
      ['Battery', 'Up to 15 hours'],
      ['Usage', 'Music & Calls']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(1099)
  },
  {
    name: 'Sony WH-XB910N',
    slug: 'sony-wh-xb910n',
    description: 'Sony WH-XB910N wireless over-ear headphones with extra bass, active noise cancellation and premium sound quality.',
    shortDescription: 'Extra Bass · ANC · Wireless · Sony',
    price: 13489,
    originalPrice: 19990,
    discount: 32,
    category: 'Electronics',
    brand: 'Sony',
    platform: 'bachat-bazar',
    images: [
      '/images/products/sonyXb910n-1.png',
      '/images/products/sonyXb910n-2.png',
      '/images/products/sonyXb910n-3.png',
      '/images/products/sonyXb910n-4.png',
    ],
    thumbnail: '/images/products/sonyXb910n-1.png',
    stock: 90,
    inStock: true,
    rating: 4.6,
    reviewCount: 679,
    badge: 'sale',
    tags: ['headphones', 'sony', 'anc', 'bass'],
    specifications: new Map([
      ['Type', 'Over Ear'],
      ['Connectivity', 'Wireless'],
      ['Noise Cancellation', 'Yes'],
      ['Sound', 'Extra Bass']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(13489)
  },
  {
    name: 'JBL Endurance Run Sports',
    slug: 'jbl-endurance-run-sports',
    description: 'JBL Endurance Run Sports wired in-ear earphones designed for workouts with secure fit and powerful sound.',
    shortDescription: 'Sports · Wired · Secure Fit · JBL',
    price: 999,
    originalPrice: 1599,
    discount: 38,
    category: 'Electronics',
    brand: 'JBL',
    platform: 'shophub',
    images: [
      '/images/products/jbl-endu-1.png',
      '/images/products/jbl-endu-2.png',
      '/images/products/jbl-endu-3.png',
      '/images/products/jbl-endu-4.png',
    ],
    thumbnail: '/images/products/jbl-endu-1.png',
    stock: 140,
    inStock: true,
    rating: 4.5,
    reviewCount: 1144,
    badge: 'top',
    tags: ['earphones', 'jbl', 'sports', 'wired'],
    specifications: new Map([
      ['Type', 'In Ear'],
      ['Connectivity', 'Wired'],
      ['Usage', 'Sports'],
      ['Fit', 'Secure']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(999)
  },
  {
    name: 'JBL Endurance Run Sports',
    slug: 'jbl-endurance-run-sports',
    description: 'JBL Endurance Run Sports wired in-ear earphones designed for workouts with secure fit and powerful sound.',
    shortDescription: 'Sports · Wired · Secure Fit · JBL',
    price: 899,
    originalPrice: 1599,
    discount: 38,
    category: 'Electronics',
    brand: 'JBL',
    platform: 'bachat-bazar',
    images: [
      '/images/products/jbl-endu-1.png',
      '/images/products/jbl-endu-2.png',
      '/images/products/jbl-endu-3.png',
      '/images/products/jbl-endu-4.png',
    ],
    thumbnail: '/images/products/jbl-endu-1.png',
    stock: 140,
    inStock: true,
    rating: 4.5,
    reviewCount: 1144,
    badge: 'top',
    tags: ['earphones', 'jbl', 'sports', 'wired'],
    specifications: new Map([
      ['Type', 'In Ear'],
      ['Connectivity', 'Wired'],
      ['Usage', 'Sports'],
      ['Fit', 'Secure']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(899)
  },
  {
    name: 'Sony WH-CH710N',
    slug: 'sony-wh-ch710n',
    description: 'Sony WH-CH710N wireless over-ear headphones with active noise cancellation and long battery life for immersive listening.',
    shortDescription: 'ANC · Wireless · Over-Ear · Sony',
    price: 8520,
    originalPrice: 14990,
    discount: 43,
    category: 'Electronics',
    brand: 'Sony',
    platform: 'shophub',
    images: [
      '/images/products/sonyCh710n-1.png',
      '/images/products/sonyCh710n-2.png',
      '/images/products/sonyCh710n-3.png',
      '/images/products/sonyCh710n-4.png',
    ],
    thumbnail: '/images/products/sonyCh710n-1.png',
    stock: 100,
    inStock: true,
    rating: 4.4,
    reviewCount: 853,
    badge: 'sale',
    tags: ['headphones', 'sony', 'anc', 'wireless'],
    specifications: new Map([
      ['Type', 'Over Ear'],
      ['Connectivity', 'Wireless'],
      ['Noise Cancellation', 'Yes'],
      ['Battery', 'Long-lasting']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(8520)
  },
  {
    name: 'Sony WH-CH710N',
    slug: 'sony-wh-ch710n',
    description: 'Sony WH-CH710N wireless over-ear headphones with active noise cancellation and long battery life for immersive listening.',
    shortDescription: 'ANC · Wireless · Over-Ear · Sony',
    price: 8199,
    originalPrice: 14990,
    discount: 43,
    category: 'Electronics',
    brand: 'Sony',
    platform: 'bachat-bazar',
    images: [
      '/images/products/sonyCh710n-1.png',
      '/images/products/sonyCh710n-2.png',
      '/images/products/sonyCh710n-3.png',
      '/images/products/sonyCh710n-4.png',
    ],
    thumbnail: '/images/products/sonych710n-1.png',
    stock: 100,
    inStock: true,
    rating: 4.4,
    reviewCount: 853,
    badge: 'sale',
    tags: ['headphones', 'sony', 'anc', 'wireless'],
    specifications: new Map([
      ['Type', 'Over Ear'],
      ['Connectivity', 'Wireless'],
      ['Noise Cancellation', 'Yes'],
      ['Battery', 'Long-lasting']
    ]),
    reviews: [],
    priceHistory: generatePriceHistory(8199)
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products successfully`);
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDB();
