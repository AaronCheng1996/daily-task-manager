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

1. Clone and setup:
```bash
git clone <repository>
cd daily-task-manager
```

2. Start with Docker:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

## Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

### Architecture

```
├── frontend/          # Vue 3 + TypeScript
├── backend/           # Express + TypeScript API
├── database/          # PostgreSQL schemas
├── docker/            # Docker configurations
└── docker-compose.yml # Multi-container setup
```

## Features

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

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

### Todo
- Draging Tasks and Milestones
- remove Daily Task's Target Date, Daily Task don't need it
- Daily Task Recurrence Type's Weekly and Monthly can choose which day. For examle, go to church on every Sunday, clean bedroom on every first Saturday or eat something healthy on every Month's 5th.
- Change Task's background color and disable Done button if the Daily Task is not triggered Today. also make two toggle button that filter triggered and Completed Task on the page instead of using different Pages
- Reward point system
- auto database init (for existing database)