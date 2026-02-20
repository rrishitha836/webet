import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL']!,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.users.count();
    console.log('Users count:', userCount);

    const betCount = await prisma.bets.count();
    console.log('Bets count:', betCount);

    const outcomeCount = await prisma.outcomes.count();
    console.log('Outcomes count:', outcomeCount);

    const wagerCount = await prisma.wagers.count();
    console.log('Wagers count:', wagerCount);

    console.log('\nPrisma v7 is working with your existing database!');
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
