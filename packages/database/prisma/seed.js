// Prisma seed removed. No-op.
console.log('Prisma seed removed (JS build). No-op.');
module.exports = {};
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