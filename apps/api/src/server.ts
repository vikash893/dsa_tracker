// ============================================================
// DSATracker API — Server Entry Point
// Connects to MongoDB and starts the Express server.
// ============================================================

import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function startServer(): Promise<void> {
  // Connect to MongoDB
  await connectDatabase();

  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║          DSATracker API Server                ║
╠═══════════════════════════════════════════════╣
║  Environment:  ${env.NODE_ENV.padEnd(30)}║
║  Port:         ${String(env.PORT).padEnd(30)}║
║  URL:          ${env.API_URL.padEnd(30)}║
╚═══════════════════════════════════════════════╝
    `);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('✅ Server shut down.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason) => {
    console.error('🔴 Unhandled Rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🔴 Uncaught Exception:', error);
    process.exit(1);
  });
}

startServer();
