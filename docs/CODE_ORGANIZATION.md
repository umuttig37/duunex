# Code Organization Guide

**Complete guide for organizing code, components, features, and imports in the TaskMVP codebase.**

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Component Organization](#component-organization)
3. [Component Placement Rules](#component-placement-rules)
4. [Feature Organization Principles](#feature-organization-principles)
5. [Import Conventions](#import-conventions)
6. [Best Practices](#best-practices)
7. [Migration Guidelines](#migration-guidelines)

---

## Directory Structure

### Complete Project Structure

```
src/
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── admin/         # Admin dashboard components
│   │   ├── chat/          # Chat and messaging components
│   │   ├── dashboard/     # User dashboard components
│   │   ├── landing/       # Landing page components
│   │   │   └── hero/      # Hero section components
│   │   ├── payment/       # Payment processing components
│   │   ├── profile/       # User profile components
│   │   └── tasks/         # Task management components
│   │       ├── booking/   # Task creation and booking
│   │       ├── detail/    # Task detail views
│   │       ├── offers/    # Task offers and bidding
│   │       └── reviews/   # Task reviews and ratings
│   ├── shared/            # Reusable components
│   │   ├── forms/         # Generic form components
│   │   ├── layout/        # Layout components (headers, footers)
│   │   └── providers/     # Context providers
│   ├── ui/                # Base UI components (buttons, inputs, etc.)
│   ├── debug/             # Development and debugging components
│   └── legacy/            # Deprecated components (to be removed)
├── hooks/                 # Custom React hooks
│   ├── shared/            # General-purpose hooks
│   ├── auth/              # Authentication hooks
│   ├── tasks/             # Task-related hooks
│   └── api/               # API interaction hooks
├── types/                 # TypeScript type definitions
│   ├── api/               # API response types
│   ├── database/          # Database schema types
│   ├── forms/             # Form data types
│   └── shared/            # Common shared types
├── services/              # Business logic and API services
│   ├── auth/              # Authentication services
│   ├── tasks/             # Task management services
│   ├── payment/           # Payment processing services
│   └── notifications/     # Notification services
└── constants/             # Application constants
    ├── categories.ts      # Task categories
    ├── templates.ts       # Task templates
    ├── ui.ts              # UI constants
    └── api.ts             # API endpoints
```

---

## Component Organization

### 1. Feature Components (`src/components/features/`)

**When to use:**
- Component is specific to a particular business feature
- Contains business logic related to that feature
- Not intended for reuse across different features

**Examples:**
- `TaskBookingForm` → `features/tasks/booking/`
- `UserProfileEditor` → `features/profile/`
- `AdminUserTable` → `features/admin/`

### 2. Shared Components (`src/components/shared/`)

**When to use:**
- Reusable across multiple features
- Contains common functionality
- Provides application-wide services

**Examples:**
- `DashboardLayout` → `shared/layout/`
- `FormField` → `shared/forms/`
- `AuthProvider` → `shared/providers/`

### 3. UI Components (`src/components/ui/`)

**When to use:**
- Basic building blocks (buttons, inputs, modals)
- Purely presentational
- Part of the design system
- No business logic

**Examples:**
- `Button` → `ui/button.tsx`
- `Input` → `ui/input.tsx`
- `Modal` → `ui/modal.tsx`

### 4. Debug Components (`src/components/debug/`)

**When to use:**
- Development and testing only
- Not part of production application

**Examples:**
- `ImageStorageTest`
- `ApiTester`

---

## Component Placement Rules

### Placement Decision Tree

```
Is it specific to one feature?
├─ YES → features/{feature-name}/
└─ NO
   ├─ Is it a basic UI element?
   │  ├─ YES → ui/
   │  └─ NO → Is it reused across features?
   │         ├─ YES → shared/
   │         └─ NO → Reconsider if it belongs in a feature
```

### Naming Conventions

**Component Files:**
- Use PascalCase: `TaskBookingForm.tsx`
- Include component type when helpful: `TaskBookingForm`, `UserProfileCard`

**Directories:**
- Use kebab-case: `task-booking/`, `user-profile/`
- Use singular for features: `task`, `profile`, `auth`
- Use plural for collections: `forms`, `hooks`, `types`

**File Structure Example:**
```
features/tasks/booking/
├── task-booking-form.tsx
├── task-booking-form.test.tsx
├── category-selector.tsx
├── location-picker.tsx
└── index.ts
```

---

## Feature Organization Principles

### Core Principles

#### 1. Feature-First Organization

Organize by business feature, not technical type:

```
✅ Good - Feature-based
src/components/features/
├── tasks/
│   ├── booking/
│   ├── detail/
│   └── offers/
├── profile/
└── auth/

❌ Bad - Technical type-based
src/components/
├── forms/
├── cards/
├── modals/
└── buttons/
```

#### 2. Colocation of Related Code

Keep related code together:

```
src/components/features/tasks/booking/
├── task-booking-form.tsx          # Main component
├── task-booking-form.test.tsx     # Tests
├── category-selector.tsx          # Sub-component
├── location-picker.tsx            # Sub-component
├── hooks/
│   └── use-task-booking.ts        # Feature-specific hook
├── types/
│   └── booking-types.ts           # Feature-specific types
└── index.ts                       # Public API
```

#### 3. Clear Boundaries and Dependencies

- Features can depend on shared components and utilities
- Features should NOT directly depend on other features
- Shared logic should be extracted to services

### Standard Feature Structure

```
src/components/features/{feature-name}/
├── components/              # Feature-specific components
│   ├── {component-name}.tsx
│   └── {component-name}.test.tsx
├── hooks/                   # Feature-specific hooks
│   └── use-{feature}.ts
├── types/                   # Feature-specific types
│   └── {feature}-types.ts
├── utils/                   # Feature-specific utilities
│   └── {feature}-utils.ts
├── constants/               # Feature-specific constants
│   └── {feature}-constants.ts
└── index.ts                 # Public API exports
```

### Feature Public API

Export a clean public API through index files:

```typescript
// src/components/features/tasks/index.ts
// Main components
export { TaskBookingForm } from './booking/task-booking-form';
export { TaskDetailView } from './detail/task-detail-view';
export { TaskCard } from './shared/task-card';

// Types
export type { TaskFormData } from './booking/types/booking-types';

// Hooks
export { useTaskBooking } from './booking/hooks/use-task-booking';
```

### Cross-Feature Communication

**Through Services:**
```typescript
// Features don't directly import from each other
// Use shared services instead
import { taskService } from '@/services/tasks/task-service';
```

**Through Context Providers:**
```typescript
// Share state across features using React Context
const { currentTask } = useTaskContext();
```

---

## Import Conventions

### Path Alias Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Always Use Absolute Paths

**✅ Correct:**
```typescript
import { Button } from '@/components/ui/button';
import { TaskBookingForm } from '@/components/features/tasks/booking/task-booking-form';
import { useAuth } from '@/hooks/auth/use-auth';
```

**❌ Avoid:**
```typescript
import { Button } from '../../../ui/button';
import { TaskBookingForm } from './booking/task-booking-form';
```

### Import Order and Grouping

```typescript
// 1. React and Next.js imports
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

// 2. External library imports (alphabetical)
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Internal imports - Types first
import type { TaskFormData } from '@/types/forms/task-booking';
import type { Database } from '@/lib/supabase/database.types';

// 4. Internal imports - Utilities and services
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { taskService } from '@/services/tasks/task-service';

// 5. Internal imports - Hooks
import { useAuth } from '@/hooks/auth/use-auth';
import { useToast } from '@/hooks/shared/use-toast';

// 6. Internal imports - Components (UI first, then features)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TaskCard } from '@/components/features/tasks/task-card';
import { DashboardLayout } from '@/components/shared/layout/dashboard-layout';
```

### Type Imports

Always use `type` keyword for type-only imports:

```typescript
// ✅ Correct
import type { TaskFormData } from '@/types/forms/task-booking';
import type { Database } from '@/lib/supabase/database.types';

// ❌ Avoid
import { TaskFormData } from '@/types/forms/task-booking';
```

### Import Restrictions by Layer

**Page Components:** Can import from all layers
```typescript
import { TaskBookingForm } from '@/components/features/tasks/booking/task-booking-form';
import { DashboardLayout } from '@/components/shared/layout/dashboard-layout';
import { useAuth } from '@/hooks/auth/use-auth';
```

**Feature Components:** Can import from ui, shared, hooks, services, types
```typescript
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/shared/use-toast';
// ❌ Should NOT import from other features
```

**Shared Components:** Can import from ui, hooks, services, types
```typescript
import { Button } from '@/components/ui/button';
// ❌ Should NOT import from features
```

**UI Components:** Only utilities and external libraries
```typescript
import { cn } from '@/lib/utils';
// ❌ Should NOT import from features, shared, hooks, or services
```

---

## Best Practices

### Component Organization

- ✅ Keep related components together
- ✅ Use subdirectories to group by functionality
- ✅ Limit directory nesting to 3-4 levels maximum
- ✅ One component per file (except very small, coupled components)
- ✅ Include component props interface in same file

### Dependencies

- ✅ Components import from their level or lower in hierarchy
- ✅ Feature components can import from shared and ui
- ✅ Shared components should NOT import from features
- ✅ UI components should be self-contained

### Testing

- ✅ Place test files adjacent to component
- ✅ Use `.test.tsx` or `.spec.tsx` extension
- ✅ Follow same directory structure for tests

### Performance

**Code Splitting:**
```typescript
const TaskBookingForm = lazy(() =>
  import('@/components/features/tasks/booking/task-booking-form')
);
```

**Index Files:**
```typescript
// Simplify imports
export { TaskBookingForm } from './booking/task-booking-form';
export { TaskDetailView } from './detail/task-detail-view';

// Usage
import { TaskBookingForm, TaskDetailView } from '@/components/features/tasks';
```

---

## Migration Guidelines

### Moving Components

1. **Identify correct location** based on usage and business logic
2. **Update import statements** throughout codebase
3. **Update index files** to maintain public APIs
4. **Test thoroughly** to ensure no broken imports
5. **Update documentation** to reflect new locations

### Verification

```bash
# Check for broken imports
npx tsc --noEmit

# Run build
npm run build

# Run linter
npm run lint
```

### Migration Checklist

- [ ] Component moved to correct directory
- [ ] All import statements updated
- [ ] Index files updated
- [ ] Tests still pass
- [ ] Application builds successfully
- [ ] No broken links in documentation

---

## Troubleshooting

### Common Issues

**Import not found errors:**
- Check if component file exists at expected location
- Verify import path is correct
- Ensure component is properly exported

**Circular dependency warnings:**
- Review component dependencies
- Move shared logic to common location
- Use dependency injection patterns

**Build performance issues:**
- Avoid deep directory nesting
- Use index files to optimize imports
- Consider code splitting for large features

---

## Quick Reference

### Component Placement

| Component Type | Location | Depends On |
|---------------|----------|------------|
| Feature-specific | `features/{feature}/` | ui, shared, services, hooks |
| Reusable across features | `shared/` | ui, services, hooks |
| Basic UI elements | `ui/` | utilities only |
| Development tools | `debug/` | any |

### Import Patterns

| What | Import From |
|------|-------------|
| UI Components | `@/components/ui/{component}` |
| Feature Components | `@/components/features/{feature}/{sub-feature}` |
| Shared Components | `@/components/shared/{category}` |
| Hooks | `@/hooks/{category}/use-{hook}` |
| Types | `@/types/{category}/{type}` |
| Services | `@/services/{category}/{service}` |
| Utilities | `@/lib/{utility}` |

---

**For more details, refer to:**
- [blueprint.md](blueprint.md) - Feature specifications
- [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md) - 3rd party API setup
- [roadmap.md](roadmap.md) - Development phases
