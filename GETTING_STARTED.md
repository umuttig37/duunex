# Getting Started with TehtäväMestari (TaskMVP)

Welcome to TehtäväMestari, a TaskRabbit-like platform for Finland. This guide will help you get up and running with the development environment.

## 📋 Prerequisites

- **Node.js**: v22.x LTS (use nvm to manage versions)
- **npm**: v10.x or higher
- **Git**: For version control
- **Supabase Account**: For backend services
- **Google Maps API Key**: For location services
- **Paytrail Account**: For payment integration (test credentials available)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to the project directory
cd taskmvp

# Install dependencies (REQUIRED - node_modules not included in ZIP)
npm install

# This will install all dependencies from package.json
# Expected install time: 2-5 minutes depending on internet speed
```

**Note:** Build artifacts (`.next/`, `node_modules/`) are NOT included in this distribution to reduce file size. You MUST run `npm install` before starting development.

### 2. Environment Setup

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values. **See [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md) for detailed setup instructions** for each service:

**Required APIs:**
- ✅ **Supabase** - Backend & database → [Setup Guide](docs/API_SETUP_GUIDE.md#1-supabase-setup-required)
- ✅ **Google Maps** - Location services → [Setup Guide](docs/API_SETUP_GUIDE.md#2-google-maps-api-setup-required)

**Optional (Works out-of-the-box):**
- ⚡ **Paytrail** - Test credentials included (375917 / SAIPPUAKAUPPIAS)

**IMPORTANT**: Never commit `.env.local` to version control!

### 3. Database Setup

The project uses Supabase (PostgreSQL with PostGIS extension). All migrations are consolidated in `supabase/migrations/`:

```bash
# Start Supabase (if using local development)
supabase start

# Apply all migrations and seed data (one command!)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

**What `supabase db reset` does:**
1. Applies `20250101_000_initial_schema.sql` - Creates all tables, RLS policies, triggers, and functions
2. Applies `20250102_000_performance_indexes.sql` - Adds production performance indexes
3. Runs `seed.sql` - Populates 7 task categories

**Migration Structure:**
- `supabase/migrations/` - Active schema migrations (2 files)
- `supabase/seed.sql` - Initial category data
- `sql/archive/` - Historical migrations (reference only)

### 4. Start Development

```bash
# Start the development server (runs on port 9002)
npm run dev
```

Visit [http://localhost:9002](http://localhost:9002) to see the application.

## 🧪 Testing

The project uses Playwright for end-to-end testing:

```bash
# Run all tests
npx playwright test

# Run tests in UI mode (recommended)
npx playwright test --ui

# Run specific test suite
npx playwright test tests/e2e/direct-tasker-selection/

# Run tests with visible browser
npx playwright test --headed
```

**Important**: Tests are configured to run on port 9002 (same as dev server).

## 📁 Project Structure

```
taskmvp/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/          # Backend API endpoints
│   │   ├── dashboard/    # User/tasker dashboards
│   │   ├── admin/        # Admin panel
│   │   └── ...
│   ├── components/       # React components
│   │   ├── features/     # Feature-specific components
│   │   ├── shared/       # Shared/reusable components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions
│   │   └── supabase/     # Supabase client instances
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic and external services
│   └── stores/           # Zustand state management
├── supabase/             # Database setup
│   ├── migrations/       # Active schema migrations (2 files)
│   ├── seed.sql          # Initial category data
│   └── data-migrations/  # Optional data cleanup scripts
├── sql/                  # Archived migrations (reference only)
│   └── archive/
├── tests/                # Playwright E2E tests
│   └── e2e/
├── docs/                 # Documentation
│   ├── blueprint.md      # ⭐ SOURCE OF TRUTH - Complete feature spec
│   ├── roadmap.md        # Development phases and priorities
│   └── API_SETUP_GUIDE.md # 3rd party API configuration
├── CLAUDE.md             # ⭐ AI assistant instructions (READ THIS!)
└── .env.example          # Environment variables template
```

## 📚 Essential Reading

Before making changes, please read these files:

1. **[CLAUDE.md](CLAUDE.md)** - Development patterns, architecture decisions, common commands
2. **[docs/blueprint.md](docs/blueprint.md)** - Complete feature specification (source of truth)
3. **[docs/roadmap.md](docs/roadmap.md)** - Current development phase and priorities
4. **[docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md)** - 3rd party API setup instructions

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Auth**: Supabase Auth with Row Level Security (RLS)
- **Maps**: Google Maps Platform (Places API, Maps SDK)
- **Payments**: Paytrail (Finnish payment methods)
- **Testing**: Playwright for E2E tests

### Key Features
- **Task Posting**: Two modes - Direct tasker selection OR open posting for bids
- **Location Services**: PostGIS geography types for precise location queries
- **Payment Flow**: Paytrail integration with balance system for taskers
- **Real-time Messaging**: Supabase Realtime for task-based conversations
- **Role-Based Access**: User, Tasker, Admin roles with RLS policies

## 🔑 User Roles

The application has three main user roles:

1. **User** - Posts tasks, selects taskers, manages payments
2. **Tasker** - Performs tasks, manages availability, receives payments
3. **Admin** - Platform management, tasker verification, dispute resolution

**Important**: Always read user role from `profiles.role` table, NOT from `user_metadata`!

## 🛠️ Common Development Commands

```bash
# Development
npm run dev                    # Start dev server (port 9002)

# Quality Checks (run before committing!)
npm run check                  # Run all checks (typecheck, lint, format)
npm run typecheck              # TypeScript type checking
npm run lint                   # ESLint
npm run lint:fix               # Fix auto-fixable issues
npm run format                 # Format with Prettier

# Build & Deploy
npm run build                  # Production build
npm run start                  # Start production server

# Testing
npx playwright test            # Run all E2E tests
npx playwright test --ui       # Interactive test UI
npx playwright test --headed   # Run with visible browser
```

## 🔐 Security Notes

### Environment Variables
- **NEVER commit** `.env.local` to version control
- Service role key should only be used server-side
- Rotate all credentials if they're ever exposed

### Database Security
- All tables have Row Level Security (RLS) policies
- Use `SECURITY DEFINER` for functions that modify financial data
- Test RLS policies thoroughly before deploying

### API Security
- Paytrail webhook signature verification is critical
- Always validate user input
- Use proper TypeScript types from `database.types.ts`

## 🐛 Troubleshooting

### Port Already in Use
If port 9002 is occupied:
```bash
# Find and kill the process
npx kill-port 9002
```

### Database Type Errors
After schema changes, regenerate types:
```bash
# Using Supabase CLI
supabase gen types typescript --project-id [PROJECT_ID] > src/lib/supabase/database.types.ts
```

### Node Version Issues
Use Node v22.x LTS (avoid v25):
```bash
nvm install 22
nvm use 22
```

### Build Errors
Clean build artifacts:
```bash
rm -rf .next
npm run build
```

## 📞 Support

- **Architecture**: See [CLAUDE.md](CLAUDE.md) for patterns and conventions
- **Features**: Reference [docs/blueprint.md](docs/blueprint.md) for specifications
- **API Setup**: See [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md) for 3rd party services

## 🎯 Development Workflow

1. **Check roadmap** in `docs/roadmap.md` for current priorities
2. **Read blueprint** in `docs/blueprint.md` for feature specifications
3. **Create feature branch** from `master`
4. **Write code** following patterns in `CLAUDE.md`
5. **Run quality checks**: `npm run check`
6. **Test thoroughly**: `npx playwright test`
7. **Create pull request** with clear description

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Playwright Testing](https://playwright.dev)

---

**Welcome to the team! If you have any questions, refer to the documentation files or check the issues tracker.**
