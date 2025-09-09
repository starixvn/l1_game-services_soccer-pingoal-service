# Soccer Pingoal Service

A Node.js game service for the Soccer Pingoal game built with TypeScript and Socket.IO.

## Prerequisites

-   Node.js 20.9.0 or higher
-   Yarn package manager
-   MongoDB (for game data storage)

## Installation

1. Clone the repository:

```bash
git clone https://git3.nexdev.net/l1/game-services/soccer-pingoal.git
cd soccer-pingoal
```

2. Install dependencies:

```bash
yarn install
```

3. Set up the npm registry (if required):

```bash
npm run reg
```

## How to Run

### Development Mode

For development with hot reload:

```bash
npm run dev
```

This will start the service in development mode with TypeScript compilation and file watching.

> **⚠️ Important:** Before running dev mode, ensure all API endpoints in `src/app-configs.ts` are accessible:
>
> -   `apiUrl` - Main API endpoint
> -   `authUrl` - Authentication service
> -   `database` - MongoDB connection string
> -   `userServiceSettings.url` - User service endpoint
> -   `gameManagementApiSettings.url` - Game management API
>
> If any URL is inaccessible, dev mode may fail to start. For local development, you can use a local MongoDB instance in replace: `mongodb://localhost:27017/`

### Production Mode

1. Build the project:

```bash
npm run build
```

2. Run the production build:

```bash
node --experimental-loader=extensionless ./build/app.js
```

### Using Docker

Build and run with Docker:

```bash
docker build -t soccer-pingoal-service .
docker run -p 5000:5000 soccer-pingoal-service
```

## Available Scripts

-   `npm run build` - Compile TypeScript to JavaScript
-   `npm run dev` - Start development server with hot reload
-   `npm run test` - Run unit tests
-   `npm run test-coverage` - Run unit tests with coverage report
-   `npm run integration-test` - Run integration tests
-   `npm run dev-build` - Run built application with nodemon for development

## Game Service

The service runs on port 5000 by default

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run integration-test
```

Generate test coverage report:

```bash
npm run test-coverage
```

## Environment Variables

The service uses environment-specific configurations located in the `configs/` directory. Make sure to set the appropriate `NODE_ENV` for your environment.
