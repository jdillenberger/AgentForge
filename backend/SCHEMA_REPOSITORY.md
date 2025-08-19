# Schema Repository Implementation

This document describes the separate schema repository feature that allows loading agent schemas and templates from an external Git repository.

## 🎯 Benefits

- **Separation of Concerns**: Schemas are separate from application code
- **Version Management**: Proper versioning and change tracking for schemas
- **Community Contributions**: Easier to contribute new schemas without code deployment
- **Templates System**: Pre-built agent templates for quick setup
- **Caching**: Performance optimized with intelligent caching
- **Fallback Support**: Graceful degradation to local schemas

## 🏗️ Architecture

### Repository Structure
```
schema-repository/
├── schemas/
│   ├── simple-agent.json
│   ├── healthcare-agent.json
│   ├── customer-service.json
│   └── advanced-chatbot.json
├── templates/
│   ├── simple-agent/
│   │   ├── basic-assistant.md
│   │   └── qa-bot.md
│   ├── healthcare-agent/
│   │   ├── patient-helper.md
│   │   └── medical-info.md
│   └── README.md
├── version.json
└── README.md
```

### Service Architecture
- **SchemaRepositoryService**: Main service class handling remote/local schema access
- **Caching Layer**: Intelligent caching with configurable timeout
- **Fallback System**: Automatic fallback to local schemas on remote failure
- **API Compatibility**: Existing `/api/schemas` endpoints work unchanged

## 🚀 Configuration

### Environment Variables

```bash
# Enable remote schema repository
SCHEMA_REPO_ENABLED=true

# Schema repository Git configuration
SCHEMA_GIT_PLATFORM=github
SCHEMA_GIT_OWNER=your-org
SCHEMA_GIT_REPO=agent-schemas
SCHEMA_GIT_TOKEN=your_token

# Optional settings
SCHEMA_LOCAL_FALLBACK=true     # Fallback to local schemas (default: true)
SCHEMA_CACHE_TIMEOUT=300       # Cache timeout in seconds (default: 5 minutes)
```

### Deployment Modes

1. **Local Only** (default)
   - `SCHEMA_REPO_ENABLED=false`
   - Uses schemas from `src/schemas/`

2. **Remote with Fallback** (recommended)
   - `SCHEMA_REPO_ENABLED=true`
   - `SCHEMA_LOCAL_FALLBACK=true`
   - Tries remote first, falls back to local

3. **Remote Only**
   - `SCHEMA_REPO_ENABLED=true`
   - `SCHEMA_LOCAL_FALLBACK=false`
   - Fails if remote unavailable

## 📡 API Endpoints

### Existing Endpoints (unchanged)
- `GET /api/schemas` - List all schemas
- `GET /api/schemas/:schemaId` - Get specific schema

### New Template Endpoints
- `GET /api/templates` - List all templates
- `GET /api/templates?schemaType=simple-agent` - List templates for schema type
- `GET /api/templates/:templateId` - Get specific template
- `POST /api/templates/:templateId/create` - Create agent from template

### Management Endpoints
- `GET /api/schema-repository/status` - Repository status and cache stats
- `POST /api/schema-repository/clear-cache` - Clear cache (auth required)

## 🔄 Template Usage

### Creating Agent from Template

```javascript
// Frontend usage
const response = await fetch('/api/templates/simple-agent/basic-assistant/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    filePath: 'my-assistant.simple-agent.md',
    namespace: 'personal',
    customizations: {
      title: 'My Custom Assistant',
      language: 'de-DE'
    }
  })
});
```

### Template Structure

```markdown
---
title: Basic Assistant
description: A simple AI assistant for general tasks
type: simple-agent
language: en-US
voice: en-US-AvaNeural
enabled: true
temperature: 0.7
greeting: Hello! I'm your AI assistant. How can I help you today?
---

# Basic Assistant Instructions

You are a helpful AI assistant designed to help users with general tasks and questions.

## Capabilities
- Answer questions across various topics
- Help with task planning and organization  
- Provide explanations and tutorials
- Assist with writing and communication

## Guidelines
- Be helpful, harmless, and honest
- Ask clarifying questions when needed
- Provide accurate and up-to-date information
- Maintain a friendly and professional tone
```

## 🔧 Implementation Details

### Caching Strategy
- **Memory Cache**: Schemas and templates cached in memory
- **TTL-based**: Configurable cache timeout (default: 5 minutes)
- **Lazy Loading**: Content loaded on-demand
- **Cache Invalidation**: Manual cache clearing via API

### Error Handling
- **Graceful Degradation**: Falls back to local schemas on remote failure
- **Retry Logic**: Built into Git driver layer
- **Logging**: Comprehensive error logging for troubleshooting

### Performance
- **Concurrent Loading**: Multiple schemas loaded in parallel
- **Minimal Requests**: Efficient use of Git API
- **Smart Caching**: Reduces API calls and improves response times

## 🛠️ Development Workflow

### Local Development
1. Set `SCHEMA_REPO_ENABLED=false` for local schemas only
2. Edit schemas in `src/schemas/` directory
3. Restart server to pick up changes

### Production Deployment
1. Create separate schema repository
2. Configure environment variables
3. Set `SCHEMA_REPO_ENABLED=true`
4. Monitor via `/api/schema-repository/status`

### Schema Repository Setup
1. Create new Git repository
2. Add `schemas/` and `templates/` directories
3. Copy existing schemas from `src/schemas/`
4. Create template examples
5. Configure access tokens and permissions

## 🔒 Security Considerations

- **Read-Only Access**: Schema repository only needs read access
- **Token Scope**: Use minimal token permissions
- **Namespace Isolation**: Templates respect namespace permissions
- **Input Validation**: All template inputs validated before file creation

## 📈 Monitoring

### Cache Statistics
```javascript
// GET /api/schema-repository/status
{
  "enabled": true,
  "localFallback": true,
  "cacheTimeout": 300,
  "cache": {
    "schemas": 5,
    "templates": 12,
    "lastUpdate": "2024-01-15T10:30:00Z"
  }
}
```

### Health Checks
- Monitor schema repository connectivity
- Track cache hit/miss ratios
- Alert on fallback usage

## 🚀 Migration Guide

### From Local to Remote Schemas

1. **Prepare Repository**
   ```bash
   # Create new repository
   mkdir agent-schemas
   cd agent-schemas
   git init
   
   # Create structure
   mkdir schemas templates
   
   # Copy existing schemas
   cp /path/to/backend/src/schemas/*.json schemas/
   ```

2. **Update Configuration**
   ```bash
   # Enable remote repository
   SCHEMA_REPO_ENABLED=true
   SCHEMA_GIT_OWNER=your-org
   SCHEMA_GIT_REPO=agent-schemas
   SCHEMA_GIT_TOKEN=your_token
   ```

3. **Test and Deploy**
   ```bash
   # Test locally first
   npm run dev
   
   # Check status endpoint
   curl http://localhost:3001/api/schema-repository/status
   
   # Deploy to production
   ```

## 🎉 Future Enhancements

- **Schema Validation**: Validate templates against schemas
- **Version Pinning**: Pin to specific schema repository versions
- **Hot Reloading**: Automatic cache refresh on repository changes
- **Template Categories**: Organize templates by use case
- **Community Hub**: Public schema and template sharing