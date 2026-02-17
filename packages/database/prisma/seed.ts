import { PrismaClient, BetStatus, BetSource, BetCategory, SuggestionStatus, NotificationType } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Generate a short ID for bet URLs
function generateShortId(): string {
  return randomBytes(4).toString('hex');
}

// Generate a URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

async function main() {
  console.log('🌱 Starting WeBet Social database seed...\n');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.wager.deleteMany();
  await prisma.aISuggestion.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data\n');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      googleId: 'admin_google_id_placeholder',
      email: 'admin@webet.com',
      displayName: 'WeBet Admin',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      balance: 100000,
      role: 'ADMIN',
      totalBets: 0,
      totalWins: 0,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        googleId: 'demo_user_1_google_id',
        email: 'arjun@example.com',
        displayName: 'Arjun Kumar',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
        balance: 1000,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        googleId: 'demo_user_2_google_id',
        email: 'priya@example.com',
        displayName: 'Priya Sharma',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        balance: 1500,
        role: 'USER',
      },
    }),
    prisma.user.create({
      data: {
        googleId: 'demo_user_3_google_id',
        email: 'rahul@example.com',
        displayName: 'Rahul Patel',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
        balance: 800,
        role: 'USER',
      },
    }),
  ]);

  console.log('✅ Created', users.length, 'sample users\n');

  // Create open bets with outcomes
  const betsData = [
    {
      title: 'Will Bitcoin hit $60,000 by March 2026?',
      description: 'Prediction on whether Bitcoin (BTC) will reach or exceed $60,000 USD before March 31, 2026. Price will be verified using CoinGecko average.',
      resolutionCriteria: 'BTC must reach $60,000 on CoinGecko for at least 1 hour before March 31, 2026 23:59 UTC.',
      category: BetCategory.TECHNOLOGY,
      closeTime: new Date('2026-03-30'),
      outcomes: ['Yes - BTC hits $60k', 'No - stays below $60k'],
      tags: ['crypto', 'bitcoin', 'price'],
      referenceLinks: ['https://www.coingecko.com/en/coins/bitcoin'],
    },
    {
      title: 'Who will win the 2026 Super Bowl?',
      description: 'Prediction for the winner of Super Bowl LX (60), scheduled for February 2026 in Santa Clara, California.',
      resolutionCriteria: 'Official NFL declaration of the Super Bowl LX champion.',
      category: BetCategory.SPORTS,
      closeTime: new Date('2026-02-08'),
      outcomes: ['Kansas City Chiefs', 'San Francisco 49ers', 'Philadelphia Eagles', 'Other Team'],
      tags: ['nfl', 'football', 'super-bowl'],
      referenceLinks: ['https://www.nfl.com'],
    },
    {
      title: 'Will GPT-5 be released before July 2026?',
      description: 'Will OpenAI officially release GPT-5 (or equivalent next-generation model) to the public before July 1, 2026?',
      resolutionCriteria: 'OpenAI must announce and make publicly available (API or ChatGPT) a model officially designated as GPT-5 or its successor.',
      category: BetCategory.TECHNOLOGY,
      closeTime: new Date('2026-06-30'),
      outcomes: ['Yes - GPT-5 released', 'No - not released yet'],
      tags: ['ai', 'openai', 'gpt'],
      referenceLinks: ['https://openai.com'],
    },
    {
      title: 'Oscar 2026: Best Picture Winner',
      description: 'Which film will win the Academy Award for Best Picture at the 98th Academy Awards ceremony in 2026?',
      resolutionCriteria: 'Official Academy of Motion Picture Arts and Sciences announcement of Best Picture winner.',
      category: BetCategory.ENTERTAINMENT,
      closeTime: new Date('2026-03-01'),
      outcomes: ['Wicked', 'Emilia Pérez', 'The Brutalist', 'Anora', 'Other Film'],
      tags: ['oscars', 'movies', 'awards'],
      referenceLinks: ['https://www.oscars.org'],
    },
    {
      title: 'Will India win the 2026 T20 World Cup?',
      description: 'Prediction on whether the Indian cricket team will win the ICC T20 World Cup 2026.',
      resolutionCriteria: 'Official ICC declaration of T20 World Cup 2026 champion.',
      category: BetCategory.SPORTS,
      closeTime: new Date('2026-03-15'),
      outcomes: ['Yes - India wins', 'No - another team wins'],
      tags: ['cricket', 'india', 't20'],
      referenceLinks: ['https://www.icc-cricket.com'],
    },
    {
      title: 'US Midterm Elections: Will Republicans keep the House?',
      description: 'Will the Republican Party maintain control of the US House of Representatives after the 2026 midterm elections?',
      resolutionCriteria: 'Associated Press call of House majority party after November 2026 elections.',
      category: BetCategory.POLITICS,
      closeTime: new Date('2026-11-03'),
      outcomes: ['Yes - Republicans keep House', 'No - Democrats take House'],
      tags: ['politics', 'elections', 'usa'],
      referenceLinks: ['https://apnews.com'],
    },
  ];

  const createdBets = [];

  for (const betData of betsData) {
    const slug = generateSlug(betData.title);
    const shortId = generateShortId();

    const bet = await prisma.bet.create({
      data: {
        slug,
        shortId,
        title: betData.title,
        description: betData.description,
        resolutionCriteria: betData.resolutionCriteria,
        category: betData.category,
        status: BetStatus.OPEN,
        source: BetSource.MANUAL,
        createdById: admin.id,
        closeTime: betData.closeTime,
        tags: betData.tags,
        referenceLinks: betData.referenceLinks,
        totalPool: 0,
        participantCount: 0,
      },
    });

    // Create outcomes for this bet
    for (let i = 0; i < betData.outcomes.length; i++) {
      await prisma.outcome.create({
        data: {
          betId: bet.id,
          label: betData.outcomes[i],
          sortOrder: i,
          totalWagers: 0,
          totalCoins: 0,
        },
      });
    }

    createdBets.push(bet);
  }

  console.log('✅ Created', createdBets.length, 'open bets with outcomes\n');

  // Create AI suggestions (pending review)
  const aiSuggestions = await Promise.all([
    prisma.aISuggestion.create({
      data: {
        title: 'Will Elon Musk launch a new company in 2026?',
        description: 'Prediction on whether Elon Musk will announce and incorporate a new company (not a subsidiary) in 2026.',
        outcomes: ['Yes', 'No'],
        resolutionCriteria: 'Official SEC filing or verified press release announcing a new Musk-led company incorporation.',
        suggestedDeadline: new Date('2026-12-31'),
        category: BetCategory.TECHNOLOGY,
        confidenceScore: 0.78,
        sourceLinks: ['https://www.sec.gov', 'https://twitter.com/elonmusk'],
        status: SuggestionStatus.PENDING,
      },
    }),
    prisma.aISuggestion.create({
      data: {
        title: 'Next viral TikTok trend: Dance or Challenge?',
        description: 'Will the next viral TikTok trend (100M+ views) be dance-based or challenge-based?',
        outcomes: ['Dance trend', 'Challenge trend', 'Neither/Other'],
        resolutionCriteria: 'First TikTok trend to reach 100M combined views after bet opens, categorized by TikTok official.',
        suggestedDeadline: new Date('2026-04-01'),
        category: BetCategory.CULTURE,
        confidenceScore: 0.65,
        sourceLinks: ['https://www.tiktok.com'],
        status: SuggestionStatus.PENDING,
      },
    }),
    prisma.aISuggestion.create({
      data: {
        title: 'Will Taylor Swift announce a new album in Q1 2026?',
        description: 'Prediction on whether Taylor Swift will officially announce a new studio album in the first quarter of 2026.',
        outcomes: ['Yes - new album announced', 'No - no announcement'],
        resolutionCriteria: 'Official announcement from Taylor Swift or her label about a new studio album (not re-recording).',
        suggestedDeadline: new Date('2026-03-31'),
        category: BetCategory.ENTERTAINMENT,
        confidenceScore: 0.72,
        sourceLinks: ['https://www.taylorswift.com'],
        status: SuggestionStatus.PENDING,
      },
    }),
  ]);

  console.log('✅ Created', aiSuggestions.length, 'AI suggestions (pending review)\n');

  // Add some sample wagers to make bets more interesting
  const bitcoinBet = createdBets[0];
  const bitcoinOutcomes = await prisma.outcome.findMany({
    where: { betId: bitcoinBet.id },
    orderBy: { sortOrder: 'asc' },
  });

  // User 1 bets on "Yes"
  await prisma.wager.create({
    data: {
      userId: users[0].id,
      betId: bitcoinBet.id,
      outcomeId: bitcoinOutcomes[0].id,
      amount: 100,
      status: 'ACTIVE',
    },
  });

  // User 2 bets on "No"
  await prisma.wager.create({
    data: {
      userId: users[1].id,
      betId: bitcoinBet.id,
      outcomeId: bitcoinOutcomes[1].id,
      amount: 150,
      status: 'ACTIVE',
    },
  });

  // User 3 bets on "Yes"
  await prisma.wager.create({
    data: {
      userId: users[2].id,
      betId: bitcoinBet.id,
      outcomeId: bitcoinOutcomes[0].id,
      amount: 50,
      status: 'ACTIVE',
    },
  });

  // Update bet totals
  await prisma.bet.update({
    where: { id: bitcoinBet.id },
    data: {
      totalPool: 300,
      participantCount: 3,
    },
  });

  // Update outcome totals
  await prisma.outcome.update({
    where: { id: bitcoinOutcomes[0].id },
    data: { totalWagers: 2, totalCoins: 150 },
  });

  await prisma.outcome.update({
    where: { id: bitcoinOutcomes[1].id },
    data: { totalWagers: 1, totalCoins: 150 },
  });

  // Update user balances
  await prisma.user.update({
    where: { id: users[0].id },
    data: { balance: 900, totalBets: 1 },
  });

  await prisma.user.update({
    where: { id: users[1].id },
    data: { balance: 1350, totalBets: 1 },
  });

  await prisma.user.update({
    where: { id: users[2].id },
    data: { balance: 750, totalBets: 1 },
  });

  console.log('✅ Added sample wagers to Bitcoin bet\n');

  // Create welcome notifications for users
  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.WELCOME,
        title: 'Welcome to WeBet Social! 🎉',
        message: 'You have received 1,000 coins to start betting. Good luck!',
        isRead: false,
      },
    });
  }

  console.log('✅ Created welcome notifications\n');

  console.log('========================================');
  console.log('🎉 Database seeded successfully!');
  console.log('========================================');
  console.log('\n📊 Summary:');
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Open Bets: ${createdBets.length}`);
  console.log(`   - AI Suggestions: ${aiSuggestions.length}`);
  console.log('\n🔗 Sample bet URL: /bet/${createdBets[0].slug}-${createdBets[0].shortId}');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
