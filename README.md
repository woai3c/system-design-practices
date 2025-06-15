# System Design Practices

Learn system design by following the guidance from the [system-design-primer](https://github.com/donnemartin/system-design-primer).

## Project Overview

[How to desing a Pastebin.com (or Bit.ly)?](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md)

This repository serves as a foundational template for backend application development with built-in best practices. It provides a pre-configured environment with essential tools and libraries to help you quickly start building robust, scalable backend services.

## Features

- **NestJS Framework**: Modern, progressive Node.js framework for building efficient and scalable server-side applications
- **PostgreSQL**: Powerful, open-source relational database
- **Redis**: In-memory data store for fast caching
- **MinIO**: S3-compatible object storage
- **Authentication & Authorization**:
  - JWT-based authentication system
  - API key authentication for service-to-service communication
  - Session management with refresh tokens
- **User Management**:
  - User registration and login
  - Password reset and change flows
  - User profile management
- **API Documentation**:
  - Swagger/OpenAPI integration with authentication support
- **Database Integration**:
  - Prisma ORM: Next-generation ORM for Node.js and TypeScript
  - Database migrations
- **Code Quality Tools**:
  - ESLint: Static code analysis tool for identifying problematic patterns
  - Prettier: Opinionated code formatter
  - Husky: Git hooks to enforce code quality checks before commits

## Prerequisites

- Node.js (v14 or later)
- PostgreSQL database
- npm, yarn, or pnpm
- Docker and Docker Compose (for local development)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/system-design-practices.git
cd system-design-practices

# Install dependencies
pnpm install
```

### Configuration

1. Create a `.env` file in the root directory based on the `.env.example` template
2. Configure your database connection string and other environment variables

```
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
PORT=3000
JWT_SECRET="your-secure-jwt-secret"
API_KEY="your-api-key-for-service-communication"

# MinIO Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="links-bucket"
MINIO_CACHE_TTL=3600

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_DEFAULT_TTL=3600
```

### Local Development with Docker

For local development, you can use Docker Compose to run Redis and MinIO without installing them on your machine:

```bash
# Start Redis and MinIO services
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose -f docker-compose.local.yml down
```

The services will be available at:

- MinIO: http://localhost:9000 (API) and http://localhost:9001 (Console)
- Redis: localhost:6379

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:push
```

### Running the Application

```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start:prod
```

## API Documentation

When the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

This provides a detailed interactive documentation of all available endpoints.

## Authentication Flows

The application supports multiple authentication methods:

1. **JWT Authentication**: Used for user authentication through login
2. **API Key Authentication**: For service-to-service communication
3. **Refresh Token**: Allows obtaining new access tokens without re-authentication

## Development Workflow

This template follows best practices for development workflow:

1. Code linting and formatting on pre-commit using Husky
2. Consistent code style enforced by ESLint and Prettier
3. Type safety with TypeScript
4. Database schema management with Prisma

## Available Scripts

- `pnpm dev` - Start the application in watch mode
- `pnpm build` - Build the application
- `pnpm start:prod` - Start the application in production mode
- `pnpm lint` - Lint the code
- `pnpm format` - Format the code
