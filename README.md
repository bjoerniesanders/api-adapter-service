# 🚀 API Adapter Service

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-24+-blue)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/framework-Fastify-green)](https://fastify.io)
[![OpenAPI](https://img.shields.io/badge/spec-OpenAPI-orange)](https://swagger.io/specification/)

A modern, high-performance API adapter service built with **Fastify** and **TypeScript** for Node.js 24+. This service provides a unified interface to interact with multiple external APIs through configurable adapters.

## ✨ Features

- **🔌 Multi-API Support**: Connect to multiple external APIs through configurable adapters
- **⚡ High Performance**: Built with Fastify for maximum speed and efficiency
- **🛡️ Security**: Built-in CORS, Helmet, and Rate Limiting
- **📊 Health Monitoring**: Comprehensive health checks and monitoring endpoints
- **📚 OpenAPI Documentation**: Auto-generated Swagger UI documentation
- **🔧 Easy Configuration**: Environment-based configuration with TypeScript support
- **🚀 Node.js 24+**: Native TypeScript support without build steps

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  API Adapter     │───▶│  External APIs  │
│                 │    │     Service      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Adapter Config │
                       │   (JSON/YAML)    │
                       └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 24+** (for native TypeScript support)
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)

### Installation

#### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd api-adapter-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start the service**
   ```bash
   npm run dev
   ```

#### Option 2: Docker (Recommended for Production)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd api-adapter-service
   ```

2. **Build and run with Docker Compose**
   ```bash
   # Production
   docker-compose up -d
   
   # Development (with hot reload)
   docker-compose --profile dev up -d
   ```

3. **Or build manually**
   ```bash
   # Build Docker image
   ./scripts/docker-build.sh
   
   # Run container
   docker run -d --name api-adapter-service -p 4000:4000 --env-file .env api-adapter-service:latest
   ```

The service will be available at `http://localhost:4000` (or the port specified in your .env file)

## 📖 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json
- **Postman Collection**: [Download Postman Collection](examples/postman-collection.json)

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Welcome message and service info |
| `/api/v1/health` | GET | Service health status |
| `/api/v1/health/detailed` | GET | Detailed health information |
| `/api/v1/adapters` | GET | List available adapters |
| `/api/v1/adapters/:name/status` | GET | Check adapter status |
| `/api/v1/adapters/:name/test` | GET | Test adapter connectivity |
| `/api/v1/adapters/:name/execute` | POST | Execute API request through adapter |

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=false

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Adapter Defaults
DEFAULT_TIMEOUT=30000
DEFAULT_RETRIES=3

# Example API Configuration
EXAMPLE_API_URL=https://api.example.com
EXAMPLE_API_TOKEN=your-token-here

# Weather API Configuration
WEATHER_API_URL=https://api.weatherapi.com/v1
WEATHER_API_KEY=your-api-key-here
```

### Adapter Configuration

Adapters are configured in `src/config/index.ts`:

```typescript
export const adapterConfigs: Record<string, AdapterConfig> = {
  'example-api': {
    name: 'example-api',
    baseUrl: process.env.EXAMPLE_API_URL || 'https://api.example.com',
    timeout: parseInt(process.env.EXAMPLE_API_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.EXAMPLE_API_RETRIES || '3', 10),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Adapter-Service/1.0.0',
    },
    auth: {
      type: 'bearer',
      credentials: {
        token: process.env.EXAMPLE_API_TOKEN || '',
      },
    },
  },
  // Add more adapters here...
};
```

## 🐳 Docker

### Quick Start with Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api-adapter-service

# Stop services
docker-compose down
```

### Docker Scripts

We provide convenient scripts for Docker operations:

```bash
# Build Docker image
./scripts/docker-build.sh

# Build with custom tag
./scripts/docker-build.sh -t v1.0.0

# Build without cache
./scripts/docker-build.sh --no-cache

# Docker Compose operations
./scripts/docker-compose.sh up -d
./scripts/docker-compose.sh logs
./scripts/docker-compose.sh health
./scripts/docker-compose.sh shell -s api-adapter-service
```

### Docker Features

- **Multi-stage Build**: Optimized image size with separate build and production stages
- **Security**: Non-root user, minimal Alpine Linux base image
- **Health Checks**: Automatic health monitoring
- **Environment Support**: Development and production configurations
- **Hot Reload**: Development mode with volume mounting for code changes

For detailed Docker documentation, see [docs/DOCKER.md](docs/DOCKER.md).

## 🧪 Testing

### Automated Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing

1. **Using the provided test script**:
   ```bash
   chmod +x test-api.sh
   ./test-api.sh
   ```

2. **Using Postman**:
   - Import `postman-collection.json` into Postman
   - All endpoints are pre-configured

3. **Using curl**:
   ```bash
   # Health check
   curl http://localhost:3000/api/v1/health

   # List adapters
   curl http://localhost:3000/api/v1/adapters

   # Execute API request
   curl -X POST http://localhost:3000/api/v1/adapters/example-api/execute \
     -H "Content-Type: application/json" \
     -d '{
       "request": {
         "method": "GET",
         "url": "/users",
         "headers": {"Accept": "application/json"}
       }
     }'
   ```

## 📦 Project Structure

```
api-adapter-service/
├── src/
│   ├── config/           # Configuration management
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── server.ts         # Main server entry point
├── docs/                 # Documentation
├── api/                  # OpenAPI specifications
├── scripts/              # Build and deployment scripts
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm test` | Run tests |
| `npm run generate-docs` | Generate OpenAPI documentation |
| `npm run generate-client` | Generate TypeScript client (server must be running) |
| `npm run generate-client-auto` | Start server and generate TypeScript client automatically |
| `npm run test-api` | Run API tests with curl |

### Adding New Adapters

1. **Update environment variables** in `.env`
2. **Add adapter configuration** in `src/config/index.ts`
3. **Test the adapter** using the provided endpoints
4. **Update documentation** if needed

### Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

## 🔒 Security

- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: Built-in request rate limiting
- **Helmet**: Security headers middleware
- **Input Validation**: Request validation using Joi
- **Environment Variables**: Secure configuration management

## 📊 Monitoring

### Health Checks

- **Basic Health**: `/api/v1/health`
- **Detailed Health**: `/api/v1/health/detailed`
- **Readiness**: `/api/v1/health/ready`
- **Liveness**: `/api/v1/health/live`

### Logging

The service uses structured logging with different levels:
- **Development**: Pretty-printed console logs
- **Production**: JSON-formatted logs

## 🚀 Deployment

### Docker

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Make sure to set all required environment variables in your deployment environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Fastify** for the high-performance web framework
- **TypeScript** for type safety and developer experience
- **Node.js 24** for native TypeScript support
- **OpenAPI** for API documentation standards

---

**Made with ❤️ using Node.js 24, TypeScript, and Fastify** 
