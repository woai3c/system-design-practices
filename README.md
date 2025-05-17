# System Design Practices

Learn system design by following the guidance from the [system-design-primer](https://github.com/donnemartin/system-design-primer).

## Project Overview

This repository serves as a foundational template for backend application development with built-in best practices. It provides a pre-configured environment with essential tools and libraries to help you quickly start building robust, scalable backend services.

## Features

- **NestJS Framework**: Modern, progressive Node.js framework for building efficient and scalable server-side applications
- **PostgreSQL**: Powerful, open-source relational database
- **Swagger**: API documentation
- **Prisma ORM**: Next-generation ORM for Node.js and TypeScript
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
