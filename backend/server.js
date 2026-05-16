const env = require('./config/env');
const connectDb = require('./config/db');
const runSeed = require('./config/seed');
const { ensureUploadsDirectory } = require('./middleware/uploadMiddleware');
const createApp = require('./app');
const { startReminderScheduler } = require('./services/appointmentReminderService');

async function bootstrap() {
    ensureUploadsDirectory();
    await connectDb();
    await runSeed();
    startReminderScheduler({
        enabled: env.reminderEnabled,
        intervalMinutes: env.reminderIntervalMinutes,
        lookaheadHours: env.reminderLookaheadHours,
    });
    const app = createApp();
    app.listen(env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`[api] running on http://localhost:${env.port}`);
    });
}

bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[bootstrap:error]', err);
    process.exit(1);
});
