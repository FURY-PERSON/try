import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  { name: 'Наука', nameEn: 'Science', slug: 'science', icon: 'flask', sortOrder: 1 },
  { name: 'История', nameEn: 'History', slug: 'history', icon: 'scroll', sortOrder: 2 },
  { name: 'География', nameEn: 'Geography', slug: 'geography', icon: 'globe', sortOrder: 3 },
  { name: 'Языки', nameEn: 'Languages', slug: 'languages', icon: 'book', sortOrder: 4 },
  { name: 'Природа', nameEn: 'Nature', slug: 'nature', icon: 'leaf', sortOrder: 5 },
  { name: 'Космос', nameEn: 'Space', slug: 'space', icon: 'rocket', sortOrder: 6 },
  { name: 'Культура', nameEn: 'Culture', slug: 'culture', icon: 'palette', sortOrder: 7 },
  { name: 'Технологии', nameEn: 'Technology', slug: 'technology', icon: 'cpu', sortOrder: 8 },
];

async function main() {
  console.log('Seeding database...');

  // Upsert categories
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
    console.log(`Category: ${created.nameEn} (${created.name})`);
  }

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      'ADMIN_EMAIL or ADMIN_PASSWORD not set in environment. Skipping admin user creation.',
    );
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: {
        email: adminEmail,
        passwordHash,
      },
    });
    console.log(`Admin user: ${admin.email}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
