import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user:', admin.email);

  // Create categories
  const categories = [
    { name: 'T-Shirts', slug: 't-shirts' },
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Bags', slug: 'bags' },
    { name: 'Jackets', slug: 'jackets' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Categories created');

  const tshirtCategory = await prisma.category.findUnique({ where: { slug: 't-shirts' } });
  const shoesCategory = await prisma.category.findUnique({ where: { slug: 'shoes' } });
  const accessoriesCategory = await prisma.category.findUnique({ where: { slug: 'accessories' } });
  const jacketCategory = await prisma.category.findUnique({ where: { slug: 'jackets' } });

  // Create products
  const products = [
    {
      name: 'Adidas CoreFit T-Shirt',
      slug: 'adidas-corefit-t-shirt',
      description: 'Kaos ringan dan nyaman dari Adidas, cocok untuk aktivitas sehari-hari.',
      price: 359000,
      stock: 50,
      categoryId: tshirtCategory!.id,
      images: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'],
    },
    {
      name: 'Nike Dri-Fit T-Shirt',
      slug: 'nike-dri-fit-t-shirt',
      description: 'Teknologi Dri-Fit dari Nike yang menjaga tubuh tetap kering saat berolahraga.',
      price: 429000,
      stock: 35,
      categoryId: tshirtCategory!.id,
      images: ['https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg'],
    },
    {
      name: 'Puma Ultra Warm Zip Jacket',
      slug: 'puma-ultra-warm-zip-jacket',
      description: 'Jaket hangat dengan zipper penuh dari Puma, ideal untuk musim dingin.',
      price: 589000,
      stock: 20,
      categoryId: jacketCategory!.id,
      images: ['https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg'],
    },
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Sepatu lari ikonik Nike dengan bantalan Air Max untuk kenyamanan maksimal.',
      price: 1299000,
      stock: 15,
      categoryId: shoesCategory!.id,
      images: ['https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg'],
    },
    {
      name: 'Adidas Ultraboost Running Shoes',
      slug: 'adidas-ultraboost-running-shoes',
      description: 'Sepatu lari premium dengan teknologi Boost untuk energi kembali optimal.',
      price: 1599000,
      stock: 10,
      categoryId: shoesCategory!.id,
      images: ['https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg'],
    },
    {
      name: 'Classic Baseball Cap',
      slug: 'classic-baseball-cap',
      description: 'Topi baseball klasik yang cocok untuk berbagai outfit kasual.',
      price: 129000,
      stock: 100,
      categoryId: accessoriesCategory!.id,
      images: ['https://images.pexels.com/photos/1124466/pexels-photo-1124466.jpeg'],
    },
    {
      name: 'Sports Backpack 30L',
      slug: 'sports-backpack-30l',
      description: 'Ransel olahraga 30 liter dengan banyak kompartemen yang praktis.',
      price: 449000,
      stock: 25,
      categoryId: (await prisma.category.findUnique({ where: { slug: 'bags' } }))!.id,
      images: ['https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg'],
    },
    {
      name: 'Under Armour StormFleece Hoodie',
      slug: 'under-armour-stormfleece-hoodie',
      description: 'Hoodie fleece tahan cuaca dari Under Armour dengan teknologi StormFleece.',
      price: 679000,
      stock: 18,
      categoryId: jacketCategory!.id,
      images: ['https://images.pexels.com/photos/3622622/pexels-photo-3622622.jpeg'],
    },
  ];

  for (const product of products) {
    const { images, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        images: {
          create: images.map((url) => ({ url })),
        },
      },
    });
  }

  console.log(`${products.length} products created`);
  console.log('Seed completed successfully!');
  console.log(`\nCredentials:\n  Email: ${adminEmail}\n  Password: ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
