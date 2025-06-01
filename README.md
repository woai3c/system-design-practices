# System Design Practices

Learn system design by following the guidance from the [system-design-primer](https://github.com/donnemartin/system-design-primer).

## Project Overview

[How to desing a Pastebin.com (or Bit.ly)?](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md)

This repository serves as a foundational template for backend application development with built-in best practices. It provides a pre-configured environment with essential tools and libraries to help you quickly start building robust, scalable backend services.

## Features

- **NestJS Framework**: Modern, progressive Node.js framework for building efficient and scalable server-side applications
- **PostgreSQL**: Powerful, open-source relational database
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
```

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
