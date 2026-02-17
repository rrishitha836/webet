"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Create admin user
    const admin = await prisma.admin.upsert({
        where: { email: 'admin@webet.com' },
        update: {},
        create: {
            email: 'admin@webet.com',
            name: 'WeBet Admin',
            password: '$2b$12$LQv3c1yqBw.jD4F1qAUF5OKjE8sBGC9B8j1iX8.vXJK8.KQyXBvzK', // "password123"
            role: 'SUPER_ADMIN',
        },
    });
    console.log('✅ Created admin:', admin.email);
    // Create sample games
    const games = await Promise.all([
        prisma.game.create({
            data: {
                homeTeam: 'Los Angeles Lakers',
                awayTeam: 'Boston Celtics',
                sport: 'BASKETBALL',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                odds: {
                    home_win: 1.85,
                    away_win: 2.10,
                    over_210: 1.90,
                    under_210: 1.90,
                },
                metadata: {
                    league: 'NBA',
                    season: '2023-24',
                    venue: 'Crypto.com Arena',
                },
            },
        }),
        prisma.game.create({
            data: {
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool FC',
                sport: 'SOCCER',
                startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
                odds: {
                    home_win: 2.50,
                    away_win: 2.20,
                    draw: 3.10,
                    over_2_5: 1.75,
                    under_2_5: 2.05,
                },
                metadata: {
                    league: 'Premier League',
                    season: '2023-24',
                    venue: 'Old Trafford',
                },
            },
        }),
    ]);
    console.log('✅ Created games:', games.length);
    // Create AI suggestions for games
    const suggestions = await Promise.all([
        prisma.aISuggestion.create({
            data: {
                gameId: games[0].id,
                suggestion: 'Los Angeles Lakers to win',
                confidence: 75,
                odds: 1.85,
                reasoning: 'Lakers have strong home record and Celtics are missing key players',
                metadata: {
                    model: 'webet-ai-v1',
                    features: ['home_advantage', 'injury_report', 'recent_form'],
                },
            },
        }),
        prisma.aISuggestion.create({
            data: {
                gameId: games[1].id,
                suggestion: 'Over 2.5 goals',
                confidence: 68,
                odds: 1.75,
                reasoning: 'Both teams have strong attacking records in recent matches',
                metadata: {
                    model: 'webet-ai-v1',
                    features: ['goals_scored', 'goals_conceded', 'head_to_head'],
                },
            },
        }),
    ]);
    console.log('✅ Created AI suggestions:', suggestions.length);
    // Create system settings
    const settings = await Promise.all([
        prisma.systemSetting.create({
            data: {
                key: 'max_bet_amount',
                value: '10000',
                type: 'number',
                category: 'betting',
            },
        }),
        prisma.systemSetting.create({
            data: {
                key: 'default_user_balance',
                value: '1000',
                type: 'number',
                category: 'system',
            },
        }),
        prisma.systemSetting.create({
            data: {
                key: 'ai_suggestions_enabled',
                value: 'true',
                type: 'boolean',
                category: 'ai',
            },
        }),
    ]);
    console.log('✅ Created system settings:', settings.length);
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map