import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Delicious Eats',
      cuisine: 'Italian',
      rating: 4.7,
      reviews: 128,
      deliveryTime: '30-45 mins',
      image: ''
    }
  });

  const cats = ['Pizzas', 'Pasta', 'Salads', 'Desserts'];
  for (const name of cats) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, icon: '' } });
  }

  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Margherita Pizza',
      description: 'Classic margherita',
      price: '12.99',
      image: '',
      rating: 4.5,
      reviews: 10,
      categoryId: 1
    }
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
