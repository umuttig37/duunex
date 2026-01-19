# Documentation Directory

This directory contains all project documentation for TehtäväMestari (TaskMVP).

## 📚 Essential Documentation (Read First!)

### [blueprint.md](blueprint.md) ⭐
**The source of truth for all features and requirements.**

Contains:
- Complete feature specifications
- Database schema design
- User flows and wireframes
- Technology stack decisions
- Business logic and rules

**When to reference:**
- Before implementing any feature
- When unclear about requirements
- During code reviews
- When planning new features

### [roadmap.md](roadmap.md) ⭐
**Current development phase and priorities.**

Contains:
- Development phase breakdown (Phase 1-5)
- Current priorities and focus areas
- Completed features checklist
- Upcoming features pipeline

**When to reference:**
- Planning new work
- Prioritizing tasks
- Understanding project status

### [production-readiness-checklist.md](production-readiness-checklist.md)
**Pre-deployment validation checklist.**

Contains:
- Security audit items
- Performance optimization checks
- Testing requirements
- Deployment prerequisites

## 🏗️ Technical Documentation

### [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md) ⭐
**Complete guide for setting up all 3rd party APIs and services.**

Contains:
- Supabase setup (backend & database)
- Google Maps API configuration
- Paytrail payment integration
- Optional services (GitHub)
- Cost considerations and security best practices

**When to reference:**
- First-time environment setup
- Troubleshooting API connection issues
- Understanding service requirements
- Production deployment preparation

### [payment-testing-guide.md](payment-testing-guide.md)
Guide for testing Paytrail payment integration with test credentials and workflows.

### [paytrail-integration.md](paytrail-integration.md)
Detailed documentation of Paytrail payment provider integration.

### [SECURITY_FIX_README.md](SECURITY_FIX_README.md)
Documentation of security fixes and RLS policy implementations.

## 🎨 Code Organization

### [CODE_ORGANIZATION.md](CODE_ORGANIZATION.md) ⭐
**Comprehensive guide for organizing code, components, features, and imports.**

Contains:
- Complete directory structure
- Component placement rules
- Feature organization principles
- Import conventions and standards
- Best practices and migration guidelines

**When to reference:**
- Setting up new components
- Organizing features
- Understanding project structure
- Refactoring existing code
- Reviewing import patterns

**Replaces:** `component-organization.md`, `component-placement-guidelines.md`, `feature-organization-principles.md`, `import-conventions.md` (all consolidated into one comprehensive guide)

## 📝 Documentation Standards

When creating new documentation:

1. **Use Markdown** - All docs should be `.md` files
2. **Clear Headings** - Use proper heading hierarchy (h1 → h2 → h3)
3. **Code Examples** - Include code blocks with syntax highlighting
4. **Links** - Reference other docs and source files
5. **Update Date** - Include last updated date at bottom
6. **Keep Current** - Archive outdated docs, don't delete them

## 🔍 Finding Information

### "How do I implement feature X?"
→ Check [blueprint.md](blueprint.md) for specifications
→ Check [roadmap.md](roadmap.md) for current priorities
→ Search codebase for similar implementations

### "What's the database schema for Y?"
→ Check [blueprint.md](blueprint.md) database section
→ Check `src/lib/supabase/database.types.ts` for TypeScript types
→ Check `sql/` directory for migration files

### "How do I set up my environment?"
→ See [../GETTING_STARTED.md](../GETTING_STARTED.md) in project root

### "What are the coding conventions?"
→ Check [../CLAUDE.md](../CLAUDE.md) for development patterns
→ Check component organization docs in this directory

### "What needs to be done?"
→ Check [roadmap.md](roadmap.md) for feature priorities and current development phase
→ Check [blueprint.md](blueprint.md) for planned features

## 📊 Documentation Hierarchy

```
Priority 1 (Must Read):
├── blueprint.md              # Feature specs (source of truth)
├── roadmap.md                # Current priorities
└── GETTING_STARTED.md        # Setup guide (in root)

Priority 2 (Technical Reference):
├── payment-testing-guide.md  # Payment integration
├── SECURITY_FIX_README.md    # Security documentation
├── migration-guide.md        # Database migrations
└── production-readiness-checklist.md

Priority 3 (Code Organization):
└── CODE_ORGANIZATION.md         # Consolidated guide
```

## 🔄 Keeping Documentation Updated

### When to Update Docs

- **After implementing a feature** → Update blueprint.md status
- **After completing a phase** → Update roadmap.md
- **After fixing a security issue** → Document in SECURITY_FIX_README.md
- **When changing architecture** → Update relevant technical docs
- **When adding 3rd party services** → Update API_SETUP_GUIDE.md

## 🎯 Quick Reference

| Need to... | Check this file |
|-----------|----------------|
| Understand a feature | [blueprint.md](blueprint.md) |
| Know what to work on next | [roadmap.md](roadmap.md) |
| Set up local environment | [../GETTING_STARTED.md](../GETTING_STARTED.md) |
| Configure 3rd party APIs | [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md) |
| Test payments | [payment-testing-guide.md](payment-testing-guide.md) |
| Review security | [SECURITY_FIX_README.md](SECURITY_FIX_README.md) |
| Organize code/components | [CODE_ORGANIZATION.md](CODE_ORGANIZATION.md) |
| Deploy to production | [production-readiness-checklist.md](production-readiness-checklist.md) |

---

**Tip**: Use GitHub's file search (`Ctrl/Cmd + K`) to quickly find documentation across all files.
