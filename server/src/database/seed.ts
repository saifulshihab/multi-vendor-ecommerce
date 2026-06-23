import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../config/data-source';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

const CATEGORIES = [
  'Electronics',
  'Home & Kitchen',
  'Clothing',
  'Books',
  'Toys & Games',
  'Beauty',
  'Sports & Outdoors',
  'Handmade',
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seed() {
  await dataSource.initialize();
  console.log('Connected. Seeding...');

  // --- Categories ---
  const categoryRepo = dataSource.getRepository(Category);
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    const exists = await categoryRepo.findOne({ where: { slug } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({ name, slug }));
      console.log(`  + category: ${name}`);
    }
  }

  // --- Admin user ---
  const userRepo = dataSource.getRepository(User);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@marketplace.test';
  const existingAdmin = await userRepo.findOne({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD ?? 'Admin123!',
      12,
    );
    await userRepo.save(
      userRepo.create({
        email: adminEmail,
        name: process.env.ADMIN_NAME ?? 'Platform Admin',
        passwordHash,
        role: Role.ADMIN,
        emailVerifiedAt: new Date(),
      }),
    );
    console.log(`  + admin user: ${adminEmail}`);
  } else {
    console.log(`  = admin user already exists: ${adminEmail}`);
  }

  await dataSource.destroy();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
