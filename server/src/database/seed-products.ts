import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import dataSource from '../config/data-source';
import { Category } from '../categories/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStatus, Role } from '../common/enums';

const BCRYPT_ROUNDS = 12;

/** Build a sized Unsplash CDN URL from a verified photo id. */
const img = (id: string): string =>
  `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;

interface ProductSeed {
  title: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  images: string[];
}

// 20 products across the seeded categories. Every image URL below was verified
// to return HTTP 200 from the Unsplash CDN.
const PRODUCTS: ProductSeed[] = [
  // --- Electronics ---
  {
    title: 'Wireless Over-Ear Headphones',
    description:
      'Studio-grade 40mm drivers with active noise cancellation and 30-hour battery life. Plush memory-foam ear cups for all-day comfort.',
    price: 149.99,
    stock: 40,
    categorySlug: 'electronics',
    images: [img('photo-1505740420928-5e560c06d30e')],
  },
  {
    title: 'Portable Bluetooth Speaker',
    description:
      'Pocket-sized 360° sound with deep bass, IPX7 waterproofing, and a 12-hour charge. Pair two for true stereo.',
    price: 59.99,
    stock: 65,
    categorySlug: 'electronics',
    images: [img('photo-1546435770-a3e426bf472b')],
  },
  {
    title: 'Smart Fitness Watch',
    description:
      'Track heart rate, sleep, and 40+ workouts. Bright AMOLED display, 7-day battery, and water resistance to 50m.',
    price: 199.0,
    stock: 30,
    categorySlug: 'electronics',
    images: [
      img('photo-1587829741301-dc798b83add3'),
      img('photo-1523275335684-37898b6baf30'),
    ],
  },
  {
    title: 'Mechanical RGB Keyboard',
    description:
      'Hot-swappable tactile switches, per-key RGB, and a solid aluminium frame. USB-C and detachable cable.',
    price: 89.99,
    stock: 50,
    categorySlug: 'electronics',
    images: [img('photo-1572569511254-d8f925fe2cbb')],
  },
  // --- Home & Kitchen ---
  {
    title: 'Ceramic Coffee Mug Set (4)',
    description:
      'Set of four 12oz stoneware mugs with a hand-glazed matte finish. Microwave and dishwasher safe.',
    price: 34.5,
    stock: 80,
    categorySlug: 'home-and-kitchen',
    images: [img('photo-1514228742587-6b1558fcca3d')],
  },
  {
    title: 'Stainless Steel Cookware Set',
    description:
      'Tri-ply 10-piece set with even heat distribution and riveted stay-cool handles. Oven safe to 260°C.',
    price: 219.99,
    stock: 22,
    categorySlug: 'home-and-kitchen',
    images: [img('photo-1556910103-1c02745aae4d')],
  },
  {
    title: 'Mid-Century Accent Chair',
    description:
      'Walnut legs and a tailored upholstered seat that fits any reading nook. Easy two-minute assembly.',
    price: 179.0,
    stock: 15,
    categorySlug: 'home-and-kitchen',
    images: [img('photo-1503602642458-232111445657')],
  },
  // --- Clothing ---
  {
    title: 'Classic Cotton T-Shirt',
    description:
      'Heavyweight 220gsm organic cotton with a relaxed fit and a clean crew neck. Pre-shrunk and built to last.',
    price: 24.99,
    stock: 120,
    categorySlug: 'clothing',
    images: [img('photo-1521572163474-6864f9cf17ab')],
  },
  {
    title: 'Denim Trucker Jacket',
    description:
      'Rigid 12oz denim that breaks in beautifully. Classic four-pocket cut with antique copper buttons.',
    price: 79.0,
    stock: 45,
    categorySlug: 'clothing',
    images: [img('photo-1576566588028-4147f3842f27')],
  },
  {
    title: 'Leather Running Sneakers',
    description:
      'Lightweight full-grain leather upper with a cushioned EVA midsole and grippy rubber outsole.',
    price: 119.99,
    stock: 38,
    categorySlug: 'clothing',
    images: [img('photo-1542291026-7eec264c27ff')],
  },
  // --- Books ---
  {
    title: 'The Art of Programming (Hardcover)',
    description:
      'A 540-page deep dive into algorithms and clean architecture, with worked examples and exercises.',
    price: 42.0,
    stock: 60,
    categorySlug: 'books',
    images: [img('photo-1544947950-fa07a98d237f')],
  },
  {
    title: 'Modern Classics Box Set',
    description:
      'Five beautifully bound modern classics in a collectible slipcase. A perfect gift for any reader.',
    price: 68.5,
    stock: 25,
    categorySlug: 'books',
    images: [img('photo-1512820790803-83ca734da794')],
  },
  // --- Toys & Games ---
  {
    title: 'Wooden Building Blocks (100pc)',
    description:
      'Sustainably sourced beechwood blocks in bright, non-toxic colours. Endless open-ended play.',
    price: 39.99,
    stock: 70,
    categorySlug: 'toys-and-games',
    images: [img('photo-1558060370-d644479cb6f7')],
  },
  {
    title: 'Strategy Board Game',
    description:
      'A 2–5 player tabletop classic of trading and route-building. 45–90 minutes of replayable fun.',
    price: 44.95,
    stock: 33,
    categorySlug: 'toys-and-games',
    images: [img('photo-1606092195730-5d7b9af1efc5')],
  },
  // --- Beauty ---
  {
    title: 'Daily Glow Skincare Set',
    description:
      'A three-step routine — gentle cleanser, hydrating serum, and SPF moisturiser — for radiant skin.',
    price: 54.0,
    stock: 55,
    categorySlug: 'beauty',
    images: [img('photo-1571781926291-c477ebfd024b')],
  },
  {
    title: 'Matte Lipstick Collection',
    description:
      'Six long-wear matte shades in a creamy, non-drying formula. Cruelty-free and vegan.',
    price: 32.0,
    stock: 90,
    categorySlug: 'beauty',
    images: [img('photo-1596462502278-27bfdc403348')],
  },
  // --- Sports & Outdoors ---
  {
    title: 'Premium Yoga Mat',
    description:
      'Extra-thick 6mm non-slip TPE mat with alignment lines. Lightweight and easy to roll up with the included strap.',
    price: 49.99,
    stock: 60,
    categorySlug: 'sports-and-outdoors',
    images: [
      img('photo-1571019613454-1cb2f99b2d8b'),
      img('photo-1605296867304-46d5465a13f1'),
    ],
  },
  {
    title: '2-Person Camping Tent',
    description:
      'Weatherproof three-season tent that pitches in minutes. Taped seams, full rainfly, and a 2.4kg packed weight.',
    price: 129.0,
    stock: 28,
    categorySlug: 'sports-and-outdoors',
    images: [
      img('photo-1504280390367-361c6d9f38f4'),
      img('photo-1496545672447-f699b503d270'),
    ],
  },
  // --- Handmade ---
  {
    title: 'Hand-Poured Soy Candle',
    description:
      'Small-batch soy wax candle with a cedar-and-sage scent and a 45-hour burn time. Reusable amber jar.',
    price: 22.0,
    stock: 100,
    categorySlug: 'handmade',
    images: [img('photo-1602874801007-bd458bb1b8b6')],
  },
  {
    title: 'Macramé Wall Hanging',
    description:
      'Hand-knotted cotton wall art on a natural wood dowel. Adds warm, bohemian texture to any room.',
    price: 48.0,
    stock: 35,
    categorySlug: 'handmade',
    images: [
      img('photo-1522758971460-1d21eed7dc1d'),
      img('photo-1582794543139-8ac9cb0f7b11'),
    ],
  },
];

/** Ensures the demo seller user exists and returns it. */
async function ensureDemoSeller(ds: DataSource): Promise<User> {
  const userRepo = ds.getRepository(User);
  const email = process.env.DEMO_SELLER_EMAIL ?? 'seller@marketplace.test';
  let seller = await userRepo.findOne({ where: { email } });
  if (!seller) {
    const passwordHash = await bcrypt.hash(
      process.env.DEMO_SELLER_PASSWORD ?? 'Seller123!',
      BCRYPT_ROUNDS,
    );
    seller = await userRepo.save(
      userRepo.create({
        email,
        name: 'Demo Seller',
        passwordHash,
        role: Role.SELLER,
        emailVerifiedAt: new Date(),
      }),
    );
    console.log(`  + demo seller: ${email}`);
  } else {
    console.log(`  = demo seller already exists: ${email}`);
  }
  return seller;
}

/** Ensures the demo store exists for the seller and returns it. */
async function ensureDemoStore(
  ds: DataSource,
  ownerId: string,
): Promise<Store> {
  const storeRepo = ds.getRepository(Store);
  let store = await storeRepo.findOne({ where: { ownerId } });
  if (!store) {
    store = await storeRepo.save(
      storeRepo.create({
        name: 'Demo Goods',
        slug: 'demo-goods',
        description:
          'A demo storefront showcasing a little bit of everything across the marketplace.',
        ownerId,
        isApproved: true,
      }),
    );
    console.log('  + demo store: Demo Goods');
  } else {
    console.log(`  = demo store already exists: ${store.name}`);
  }
  return store;
}

/** Seeds 20 demo products into the demo store. Idempotent by (storeId, title). */
export async function seedProducts(ds: DataSource): Promise<void> {
  const categoryRepo = ds.getRepository(Category);
  const productRepo = ds.getRepository(Product);

  const categories = await categoryRepo.find();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  if (categoryBySlug.size === 0) {
    throw new Error(
      'No categories found. Run the base seed first: `npm run seed`.',
    );
  }

  const seller = await ensureDemoSeller(ds);
  const store = await ensureDemoStore(ds, seller.id);

  let created = 0;
  for (const p of PRODUCTS) {
    const category = categoryBySlug.get(p.categorySlug);
    if (!category) {
      console.warn(
        `  ! skipping "${p.title}" — category ${p.categorySlug} missing`,
      );
      continue;
    }
    const exists = await productRepo.findOne({
      where: { storeId: store.id, title: p.title },
    });
    if (exists) {
      continue; // idempotent
    }
    await productRepo.save(
      productRepo.create({
        title: p.title,
        description: p.description,
        price: p.price.toFixed(2),
        stock: p.stock,
        status: ProductStatus.ACTIVE,
        images: p.images,
        categoryId: category.id,
        storeId: store.id,
      }),
    );
    created += 1;
  }
  console.log(
    `  + products created: ${created} (${PRODUCTS.length - created} already existed)`,
  );
}

async function run(): Promise<void> {
  await dataSource.initialize();
  console.log('Connected. Seeding products...');
  await seedProducts(dataSource);
  await dataSource.destroy();
  console.log('Product seeding complete.');
}

// Only run when executed directly (so it can also be imported as a function).
if (require.main === module) {
  run().catch((err) => {
    console.error('Product seeding failed:', err);
    process.exit(1);
  });
}
