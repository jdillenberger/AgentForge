import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables first
dotenv.config({ path: join(__dirname, '../.env') });

// Import new architecture components
import { ConfigService } from './config/app.config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { AuthService } from './services/auth.service';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize configuration service
const config = ConfigService.getInstance();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable CORP that can interfere with CORS
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // Allow all origins if not specified
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json());

// Authentication middleware setup
const authService = AuthService.getInstance();
app.use('/api', authService.optionalAuthenticate);

// Mount API routes
console.log('🔧 Mounting API routes...');
app.use('/api', routes);
console.log('✅ API routes mounted');

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NEW REFACTORED SERVER running on port ${PORT}`);
  console.log(`Using ${config.getGitConfig().provider} as git platform`);
  const oidcConfig = config.getOIDCConfig();
  console.log(`OIDC authentication is ${oidcConfig.enabled ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});