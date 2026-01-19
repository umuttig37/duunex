# TehtäväMestari (TaskMVP)

A TaskRabbit-like platform for Finland, connecting users who need tasks done with verified local taskers.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see docs/API_SETUP_GUIDE.md)

# 3. Initialize database
supabase db reset

# 4. Start development server
npm run dev

# Visit http://localhost:9002
```

**New to this project?** Start with [GETTING_STARTED.md](GETTING_STARTED.md)

## 📋 3rd Party APIs Required

### ✅ Must Configure
- **Supabase** - Backend & database
- **Google Maps** - Location services

### ⚡ Works Out-of-the-Box
- **Paytrail** - Payment processing (test credentials included)

**See [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md) for complete setup instructions**

## 🏗️ Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Maps:** Google Maps Platform (Places API, Maps SDK)
- **Payments:** Paytrail (Finnish payment methods)
- **Testing:** Playwright (E2E)

## 📚 Documentation

- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup guide for new developers
- [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md) - 3rd party API configuration
- [docs/blueprint.md](docs/blueprint.md) - Complete feature specifications
- [docs/roadmap.md](docs/roadmap.md) - Development phases and priorities
- [CLAUDE.md](CLAUDE.md) - Development patterns and architecture

## 🧪 Testing

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run specific test suite
npx playwright test tests/e2e/direct-tasker-selection/
```

## 🔑 Key Features

- ✅ Dual task posting modes (Direct selection OR open posting)
- ✅ Location-based tasker search with configurable radius
- ✅ Paytrail payment integration
- ✅ Real-time messaging
- ✅ Role-based access (User, Tasker, Admin)
- ✅ Mobile responsive design

## 📂 Project Structure

```
taskmvp/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   └── services/         # Business logic
├── supabase/migrations/  # Database migrations
├── tests/                # Playwright E2E tests
├── docs/                 # Documentation
└── public/               # Static assets
```

## 🛠️ Development

```bash
# Development server (port 9002)
npm run dev

# Quality checks
npm run check              # Run all checks
npm run typecheck          # TypeScript
npm run lint               # ESLint
npm run format             # Prettier

# Build
npm run build
npm run start
```

## 🔐 Security

- Never commit `.env.local` to version control
- Use test credentials for development
- Review [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md#-security-best-practices) for production security

## 📞 Support

- **Architecture:** See [CLAUDE.md](CLAUDE.md)
- **Features:** See [docs/blueprint.md](docs/blueprint.md)
- **API Setup:** See [docs/API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md)

---

**Made with ❤️ for the Finnish market**
