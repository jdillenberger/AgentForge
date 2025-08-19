# GHMD Editor

A modern web-based editor for managing GitHub Markdown files with frontmatter support. Built with Vue.js 3, TypeScript, and Node.js, featuring Git integration, OpenID Connect authentication, and schema-based templates.

## 🚀 Features

- **Git Integration**: Direct integration with GitHub, GitLab, or Gitea repositories
- **Markdown Editor**: Monaco-based editor with syntax highlighting and live preview
- **Frontmatter Support**: YAML frontmatter editing with validation
- **Schema Templates**: Pre-built templates for different file types (AI agents, configurations, etc.)
- **Authentication**: OpenID Connect (OIDC) authentication with role-based access
- **Namespace Support**: Multi-tenant file organization with namespace isolation
- **File Management**: Complete CRUD operations with version history
- **Docker Ready**: Multi-stage Docker builds with production optimizations
- **Type Safety**: Full TypeScript support across frontend and backend

## 🏗 Architecture

### Backend (Node.js/Express)
- **Layered Architecture**: Controllers → Services → Repositories pattern
- **Git Drivers**: Pluggable drivers for different Git providers
- **Authentication**: JWT + OIDC integration
- **Schema Repository**: Git-based template and schema management
- **Health Checks**: Built-in monitoring and diagnostics

### Frontend (Vue.js 3)
- **Composition API**: Modern Vue.js 3 with TypeScript
- **Pinia State Management**: Reactive state management
- **Monaco Editor**: Advanced code editing capabilities  
- **Responsive Design**: Mobile-first CSS with design tokens
- **Component Architecture**: Modular, reusable components

## 📋 Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm 8+
- Git
- Docker & Docker Compose (for containerized deployment)
- Git repository (GitHub/GitLab/Gitea) for file storage
- OpenID Connect provider for authentication

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd ghmd-editor
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

**Required Configuration:**
```bash
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OIDC_ISSUER=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Git Repository (choose one)
GIT_PROVIDER=github
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repository-name
```

### 3. Development Setup

#### Option A: NPM Development

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start development servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/api/health

#### Option B: Docker Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Production Deployment

```bash
# Build and start production containers
docker-compose up --build -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
ghmd-editor/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic layer
│   │   ├── repositories/    # Data access layer
│   │   ├── drivers/         # Git provider drivers
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Vue.js 3 application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/           # Page components
│   │   ├── stores/          # Pinia stores
│   │   ├── services/        # API services
│   │   ├── router/          # Vue Router configuration
│   │   ├── styles/          # CSS and design tokens
│   │   └── main.ts          # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
├── Dockerfile               # Multi-stage Docker build
├── package.json             # Root package.json
└── .env.example            # Environment variables template
```

## 🔧 Configuration

### Git Providers

Configure one of the supported Git providers:

#### GitHub
```bash
GIT_PROVIDER=github
GITHUB_TOKEN=ghp_your_token
GITHUB_OWNER=username
GITHUB_REPO=repository
GITHUB_BASE_URL=https://api.github.com
```

#### GitLab
```bash
GIT_PROVIDER=gitlab
GITLAB_TOKEN=glpat-your_token
GITLAB_PROJECT_ID=12345
GITLAB_URL=https://gitlab.com
```

#### Gitea
```bash
GIT_PROVIDER=gitea
GITEA_TOKEN=your_token
GITEA_OWNER=username
GITEA_REPO=repository
GITEA_URL=https://your-gitea-instance.com
```

### Authentication

The application supports OpenID Connect authentication:

```bash
OIDC_ISSUER=https://your-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
OIDC_SCOPE=openid profile email
```

### Schema Repository

Configure a Git repository for templates and schemas:

```bash
SCHEMA_REPO_ENABLED=true
SCHEMA_REPO_URL=https://github.com/your-org/agent-schemas.git
SCHEMA_PULL_INTERVAL=300
```

## 🐳 Docker

### Development

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and deploy production containers
docker-compose up --build -d

# Scale services
docker-compose up --scale backend=2 -d

# Update services
docker-compose pull && docker-compose up -d
```

### Health Checks

Both services include health checks:
- Backend: `http://localhost:3000/api/health`
- Frontend: `http://localhost/` (nginx status)

## 📚 API Documentation

### Authentication Endpoints
- `GET /api/auth/oidc-config` - Get OIDC configuration
- `POST /api/auth/token` - Exchange OIDC code for JWT
- `GET /api/auth/userinfo` - Get current user info

### File Management
- `GET /api/files` - List files
- `GET /api/files/:filename` - Get file content
- `POST /api/files` - Create new file
- `PUT /api/files/:filename` - Update file
- `DELETE /api/files/:filename` - Delete file
- `POST /api/files/:filename/move` - Move/rename file
- `GET /api/files/:filename/history` - Get file history
- `GET /api/files/:filename/version/:sha` - Get specific version

### Schema & Templates
- `GET /api/schemas` - List available schemas
- `GET /api/schemas/:schemaId` - Get schema details
- `GET /api/templates` - List templates
- `GET /api/templates/:templateId` - Get template
- `POST /api/templates/:templateId/create` - Create from template

### Admin & Health
- `GET /api/admin/health` - System health check
- `GET /api/admin/config` - Application configuration
- `GET /api/admin/namespaces` - List namespaces

## 🧪 Development

### NPM Scripts

Root level:
```bash
npm run dev           # Start both frontend and backend in development
npm run build         # Build both applications
npm run start         # Start production backend
```

Backend:
```bash
npm run dev           # Start development server with nodemon
npm run build         # TypeScript compilation
npm run test          # Run Jest tests
npm run test:watch    # Run tests in watch mode
```

Frontend:
```bash
npm run dev           # Start Vite development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run type-check    # TypeScript type checking
npm run lint          # ESLint checking and fixing
```

### Environment Variables

Development environment variables:
```bash
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test
npm test -- --testNamePattern="FilesService"

# Coverage report
npm run test:coverage
```

## 🚦 Troubleshooting

### Common Issues

**1. Template Loading Failed**
- Ensure Git is installed in the Docker container
- Verify schema repository URL and access
- Check `SCHEMA_REPO_ENABLED=true`

**2. Authentication Issues**
- Verify OIDC configuration
- Check JWT secret is set
- Ensure redirect URIs match

**3. File Operations Failing**
- Verify Git provider configuration
- Check repository permissions
- Ensure Git driver is initialized

**4. Docker Build Issues**
- Clear Docker cache: `docker system prune -a`
- Check environment variables in `.env`
- Verify network connectivity

### Logs

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View specific container logs
docker logs ghmd-editor-backend
docker logs ghmd-editor-frontend
```

### Health Checks

Monitor application health:
```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend health (through nginx)
curl http://localhost/

# Docker health status
docker-compose ps
```



## 🔗 Related Projects

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Vue.js 3](https://vuejs.org/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [Pinia](https://pinia.vuejs.org/) - State management
- [Octokit](https://octokit.github.io/rest.js/) - GitHub API client