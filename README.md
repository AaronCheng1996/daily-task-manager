# Daily Task Manager

A comprehensive task management system supporting 4 different task types:
- **HABIT**: Track good/bad habit formation
- **DAILY_TASK**: Recurring tasks with complex scheduling
- **TODO**: Traditional todo items with due dates  
- **LONG_TERM**: Project management with milestones

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Redis
- **Deployment**: Docker Compose

## Quick Start

```
git clone <repo>
cd daily-task-manager
docker compose up -d
```

## Setup

1. Setup Enviroment and Database with docker-compose:

```docker-compose.yml
networks:
  shared_net:
    name: shared_net

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=main
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    networks:
      - shared_net

  redis:
    image: redis:7.4-rc2-alpine
    container_name: redis
    restart: unless-stopped
    networks:
      - shared_net
```

2. Start with docker-compose:

```docker-compose.yml
services:
  backend:
    image: aaron850130/daily-task-manager-backend:latest
    container_name: daily-task-manager-backend
    ports:
      - "3051:3001"
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-daily_tasks}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost/3000}
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: production
    restart: unless-stopped
    networks:
      - shared_net

  frontend:
    image: aaron850130/daily-task-manager-frontend:latest
    container_name: daily-task-manager-frontend
    ports:
      - "3050:80"
    environment:
      NODE_ENV: production
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - shared_net

networks:
  shared_net:
    name: shared_net
    external: true
```

```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

## Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Architecture

```
├── frontend/          # Vue 3 + TypeScript
├── backend/           # Express + TypeScript API
├── database/          # PostgreSQL schemas
├── docker/            # Docker configurations
└── docker-compose.yml # Multi-container setup
```

## Features

### Task Management
- **Drag-and-drop reordering**: Organize tasks by dragging them to desired positions
- **Send to top**: Quick button to move any task to the top of the list
- **Search and filter**: Find tasks by title/description, filter by type and completion status

### Task Types
- **Habit Tracking**: Time-based completion tracking with good/bad habit support
- **Daily Tasks**: Flexible recurrence patterns (daily, weekly, monthly, custom)
- **Todo Items**: Due dates with overdue notifications
- **Long-term Projects**: Milestone-based progress tracking

### User Management
- JWT authentication
- Multi-user support
- Internationalization ready (English default)

### Database Schema
See `database-design.md` for detailed schema documentation.

## Environment Variables

Create `.env` files for each service:

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://taskuser:taskpass@localhost:5432/daily_tasks
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Todo
- Set user personal prefence, such as default filter / theme
- Language setting using i18n
- Review daily task schedule feature & filter untriggered day's task
- better theme and frontend code

### Planning
- Add star task that show on Home page
- Home page format
- Reward point system

### Issue
- daily task didn't update statistics