# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application called "AgentForge" (previously named "GHMD Editor") - a modern markdown editor with frontmatter support for managing AI agent configurations through Git repositories. The application uses a layered architecture with separate frontend and backend services.

## Architecture

### Backend (Node.js/Express)
- **Layered Architecture**: Controllers → Services → Repositories → Git Drivers
- **Authentication**: JWT + OpenID Connect (OIDC) authentication
- **Git Integration**: Pluggable drivers for GitHub, GitLab, and Gitea
- **Schema Repository**: External Git repository for agent schemas and templates
- **Location**: `/backend/` directory
- **Entry Point**: `src/server.ts`

### Frontend (Vue.js 3 + TypeScript)
- **Framework**: Vue 3 Composition API with TypeScript
- **State Management**: Pinia stores
- **Editor**: Monaco Editor for markdown editing
- **Build Tool**: Vite
- **Location**: `/frontend/` directory
- **Entry Point**: `src/main.ts`

### Key Components
- **Git Drivers**: `backend/src/drivers/` - Abstract Git operations across providers
- **Schema System**: JSON schemas in `backend/src/schemas/` with external repository support
- **Authentication**: OIDC-based auth with namespace isolation
- **File Management**: Complete CRUD operations with Git versioning

## Development Commands

### Root Level Commands
```bash
# Start both frontend and backend in development mode
npm run dev

# Build both applications for production
npm run build

# Start production backend only
npm start
```

### Backend Commands
```bash
cd backend

# Development with hot reload
npm run dev

# Build TypeScript and copy schemas
npm run build

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Start production server
npm start
```

### Frontend Commands  
```bash
cd frontend

# Development server (http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Linting and auto-fix
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

Backend uses Jest with TypeScript support:
- Test files: `backend/src/tests/`
- Configuration: `backend/jest.config.js`
- Run specific test: `npm test -- --testNamePattern="FilesService"`

## Docker Development

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Production deployment
docker-compose up --build -d
```

## Key Configuration

### Environment Variables
Required for development:
- `JWT_SECRET`: JWT signing secret
- `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`: OIDC authentication
- `GIT_PROVIDER`: Choose from 'github', 'gitlab', or 'gitea'
- Provider-specific tokens and repository settings

### Schema Repository (Optional)
External Git repository for schemas and templates:
- `SCHEMA_REPO_ENABLED=true`
- `SCHEMA_GIT_OWNER`, `SCHEMA_GIT_REPO`, `SCHEMA_GIT_TOKEN`
- Documentation: `backend/SCHEMA_REPOSITORY.md`

## Important Paths

- **Backend source**: `backend/src/`
- **Frontend source**: `frontend/src/`
- **API routes**: `backend/src/routes/`
- **Vue components**: `frontend/src/components/`
- **Type definitions**: `*/src/types/`
- **Schema files**: `backend/src/schemas/`

## Health Monitoring

- Backend health: `http://localhost:3000/api/health`
- Frontend development: `http://localhost:5173`
- Docker health checks included in compose files