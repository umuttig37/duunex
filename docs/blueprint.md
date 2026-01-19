# **App Name**: TehtäväMestari

## Core Features:

- **User Roles & Authentication:**
    - **Visitor (Vierailija):** Can browse categories and initiate task posting but must register/login to proceed.
    - **User (Tehtävän antaja):** Registered user who posts tasks.
    - **Tasker (Tehtävän tekijä):** Verified individual performing tasks. Must provide details like skills, availability (calendar), hourly rate during registration/profile setup.
    - **Admin:** (Implicit, for platform management - *Consider adding explicit Admin features later*)
    - Role-based authentication using Supabase Auth. Role selected during registration.
- **Task Posting & Discovery:**
    - **Visitor Flow:** Select category -> Fill dynamic task form (details, location, time) -> Prompt to Register/Login.
    - **User Flow (Post-Login):**
        - **Option A (Open Posting):** Post task publicly -> Taskers bid/offer -> User accepts offer -> In-app messaging enabled. (Consider verification/license requirements for certain tasks).
        - **Option B (Direct Selection):** Search/filter taskers (location, skills, availability) -> View tasker profile (reviews, skills, rate, calendar) -> Select tasker & time -> Pay upfront -> In-app messaging enabled.
    - Integrate location services (Supabase PostGIS) for tasker discovery and filtering. Address input will use Google Maps Platform (Places API) for autocompletion and geocoding.
    - Taskers can view nearby tasks on a map (using Google Maps Platform SDK).
- **Tasker & User Dashboards:**
    - **Tasker:** Manage profile (name, description, skills, availability calendar, rate, picture), view own listings, accepted tasks, open tasks they can bid on, receive notifications.
    - **User:** Manage profile, view task history (completed, pending, open postings), initiate new task posting.
- **In-App Messaging:** Secure communication channel between User and Tasker after a task agreement is made (either via Option A acceptance or Option B selection).
- **Secure Payment Integration:** Integrate Paytrail for secure payment processing. Implement upfront payment for the "Direct Selection" (Option B) flow. Payouts to taskers initially manual.
- **Dynamic Forms:** Task posting forms adapt fields based on the selected service category.

## Style Guidelines:

- Primary color: Use a calming blue (#3498db) to convey trust and reliability.
- Secondary color: Implement a neutral gray (#ecf0f1) for backgrounds and less prominent elements.
- Accent: Use a vibrant green (#2ecc71) for calls to action and successful transactions, conveying efficiency and positive outcomes.
- Clean and readable typography for both Finnish and English text.
- Use clear and recognizable icons for categories and actions.
- Prioritize a clean, intuitive, and mobile-first responsive design.

## Original User Request:
# Project Plan: TaskRabbit-like Platform (Finland)

## 1. Project Overview

*   **Core Concept:** A web application connecting Finnish users needing tasks done ("Users") with verified local individuals capable of performing those tasks ("Taskers").
*   **Goals:**
    *   Provide a convenient and reliable platform for Users to find help.
    *   Offer flexible work opportunities for Taskers.
    *   Ensure a secure and trustworthy environment through verification, reviews, and secure payments.
*   **Target Market:** Finland (Language: Finnish primarily, potential English option; Currency: EUR).
*   **Value Proposition (Users):** Easy task posting, location-based Tasker matching, verified Taskers, secure communication & payments via Paytrail.
*   **Value Proposition (Taskers):** Access to local job requests, flexible scheduling, platform support, secure payout mechanism.
*   **Compliance:** GDPR adherence is mandatory.

## 2. Key Features

*   **Role-Based Authentication (Supabase Auth):**
    *   **Roles:** `User`, `Tasker`, `Admin`.
    *   **Signup/Login:** Email/Password, Social Logins (optional).
    *   **Profile Management:**
        *   *Users:* Basic info, address, task history.
        *   *Taskers:* Detailed profile, skills/categories, bio, picture, service area (radius/postcodes), availability, verification status, ratings.
*   **Service & Category Listing (Supabase DB):**
    *   Hierarchical categories (e.g., `Kotiapu` -> `Siivous`).
    *   Browsing & Searching capabilities.
*   **Task Posting & Management:**
    *   **Flow:** Select category -> Describe task (details, photos/videos via Supabase Storage) -> Set location -> Suggest date/time -> Post.
    *   **Task Status Tracking:** `Open`, `Assigned`, `Awaiting Payment`, `Paid`, `In Progress`, `Completed`, `Cancelled`, `Disputed`, `Payment Failed`.
*   **Tasker Discovery & Matching (Location Service - Supabase PostGIS):**
    *   Taskers define service location/area.
    *   Users post tasks with location.
    *   Platform finds nearby, relevant Taskers using geospatial queries (`ST_DWithin`).
    *   Display: List view (sortable), Map view (optional, using Leaflet/Mapbox).
    *   Filtering: By category, availability, rating.
*   **Messaging (Supabase Realtime):**
    *   Consolidated, feature-rich chat interface located at `/messages`.
    *   Contextual chat linked to specific tasks, accessible via `/messages?taskId=[TASK_ID]`.
    *   Real-time unread message count and notifications in header.
    *   Message display within chat uses polling (potential for full Realtime upgrade).
*   **Payment Integration (Paytrail):**
    *   **User Payments:** Securely pay for tasks via Paytrail (integrates Finnish banks, cards, mobile pay).
    *   **Flow:** User selects Tasker -> Proceeds to Paytrail -> Payment confirmation -> Task status updated.
    *   **Security:** Paytrail handles sensitive data; platform validates Paytrail callbacks securely.
    *   **Platform Commission:** Calculated during the payment process.
*   **Tasker Payout Mechanism:**
    *   System for transferring earnings (User Payment minus Platform Fee) to Taskers.
    *   Requires a separate process (e.g., manual transfer initially, potential integration with payout service like Wise Platform later).
*   **Stylish UI (Next.js + Styling Library):**
    *   Clean, intuitive, mobile-first, responsive design.
    *   Consistent look-and-feel using a component library.
    *   Focus on Finnish language and cultural context.
*   **Reviews & Ratings:**
    *   Mutual review system for Users and Taskers after task completion.
    *   Builds trust and informs future choices.
*   **Admin Panel:**
    *   User management (view, verify Taskers, ban).
    *   Category management.
    *   Task moderation & dispute resolution.
    *   Payment/Payout monitoring.
    *   Basic analytics.

## 3. Technology Stack

*   **Frontend Framework:** Next.js (App Router recommended)
*   **Backend (BaaS):** Supabase
    *   **Authentication:** Supabase Auth (JWT, RLS)
    *   **Database:** Supabase Postgres (with `postgis` extension enabled)
    *   **Realtime:** Supabase Realtime Subscriptions
    *   **Storage:** Supabase Storage
    *   **Serverless Functions:** Supabase Edge Functions (for Paytrail API interactions, notifications, complex logic)
*   **Styling:** Tailwind CSS
*   **UI Component Library:** Shadcn/ui, Material UI (MUI), Chakra UI, Mantine UI (Choose one)
*   **Mapping Library:** Google Maps Platform SDK (e.g., via `@react-google-maps/api` or similar)
    *   **Note:** Google recommends migrating from `google.maps.places.Autocomplete` (used by current `@react-google-maps/api` for classic autocomplete) to the newer `google.maps.places.PlaceAutocompleteElement` Web Component. Plan for this migration before Phase 4 completion or production launch for long-term support.
*   **State Management:** Zustand / Jotai / React Context API
*   **Data Fetching/Caching:** TanStack Query (React Query)
*   **Payment Gateway:** Paytrail API
*   **Deployment:** Vercel, Netlify, or Supabase Hosting

## 4. Database Schema Outline (Simplified)

```sql
-- Supabase Auth manages its own 'users' table (auth.users)

CREATE TABLE profiles (
-- Table to track tasker application status for admin review
CREATE TABLE tasker_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'not_approved')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT
);
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'tasker', 'admin')),
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  bio TEXT, -- Primarily for Taskers
  is_verified BOOLEAN DEFAULT false, -- For Taskers, set by Admin
  created_at TIMESTAMPTZ DEFAULT now(),
  address TEXT, -- Added
  city TEXT, -- Added
  zipcode TEXT, -- Added
  location geometry(Point, 4326) -- User's geospatial location (optional, for future use)
);

CREATE TABLE tasker_details (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id),
  location GEOGRAPHY(Point, 4326), -- For PostGIS nearby searches
  service_radius_meters INTEGER,
  -- Consider storing service area as POLYGON if radius isn't sufficient
  availability_schedule JSONB -- Or separate availability table
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed from SERIAL to match current implementation
  name_fi TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_fi TEXT,
  parent_category_id UUID REFERENCES categories(id), -- Changed from INTEGER
  icon_url TEXT
);

CREATE TABLE tasker_categories (
  profile_id UUID REFERENCES profiles(id),
  category_id UUID REFERENCES categories(id), -- Changed from INTEGER
  PRIMARY KEY (profile_id, category_id)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tasker_profile_id UUID REFERENCES profiles(id), -- Assigned Tasker
  category_id UUID NOT NULL REFERENCES categories(id), -- Changed from INTEGER
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'awaiting_payment', 'paid', 'payment_failed', 'in_progress', 'completed', 'cancelled', 'disputed')),
  location_text TEXT,
  location_coordinates GEOGRAPHY(Point, 4326), -- Task's geospatial location
  scheduled_datetime TIMESTAMPTZ,
  budget NUMERIC,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed from SERIAL
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- Path in Supabase Storage
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed from SERIAL
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed from SERIAL
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_review_per_task_direction UNIQUE (task_id, reviewer_profile_id) -- Added constraint
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  user_profile_id UUID NOT NULL REFERENCES profiles(id), -- Payer
  tasker_profile_id UUID NOT NULL REFERENCES profiles(id), -- Payee
  platform_fee NUMERIC NOT NULL,
  tasker_payout_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL, -- Amount paid by user
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  paytrail_transaction_id TEXT, -- From Paytrail on success
  paytrail_order_number TEXT UNIQUE, -- Your reference sent to Paytrail
  payment_provider TEXT DEFAULT 'paytrail',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: Table for tracking actual payouts to Taskers
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_profile_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  method TEXT, -- e.g., 'bank_transfer', 'wise'
  reference_id TEXT, -- e.g., transfer confirmation
  related_payment_ids UUID[], -- Link to one or more 'payments' rows being paid out
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable PostGIS extension
-- CREATE EXTENSION postgis;

-- Implement Row Level Security (RLS) policies on all relevant tables!

## 5. Development Phases (MVP First)

**Phase 1: Core Setup & Authentication**

*   Initialize Next.js project, integrate Supabase client, Tailwind, Shadcn/ui.
*   Implement basic User/Tasker signup and login (Supabase Auth).
*   **Add Role Selection (User/Tasker) during Signup.**
*   Setup `profiles` table with basic fields and `role` column.
*   Setup `categories` table & seed initial data.
*   Implement foundational RLS policies for profiles and categories.

**Phase 2: Visitor Flow & Basic Task Posting (Option A Foundation)**

*   Build category browsing page (accessible to Visitors).
*   Implement initial Task Posting form (`task-form.tsx`) - **consider dynamic fields early**.
*   Implement Visitor flow: Browse Categories -> Start Task Form -> Prompt Login/Signup to continue.
*   Implement User flow (post-login): Complete Task Form -> Post Task (creates entry in `tasks` table with 'open' status, links to `user_profile_id`).
*   Create basic task list (`/tasks`) and task detail (`/tasks/[id]`) views.
*   Setup basic User Dashboard (`/dashboard/user` or similar) showing their posted tasks.

**Phase 3: Tasker Profile & Open Posting Flow (Option A)**

*   Enhance Tasker profile setup/edit page: Add fields for skills (link to `categories` or separate `skills` table), **availability (simple text/JSONB initially)**, **hourly rate**, description, profile picture (Supabase Storage).
*   Implement Tasker Dashboard (`/dashboard/tasker`): View/edit profile, view open tasks matching their skills/categories.
*   Implement **"Open Posting" (Option A) flow:**
    *   Taskers can view/filter open tasks.
    *   Taskers can submit bids/offers on tasks (requires `bids` or similar table).
    *   Users can view bids on their tasks and accept one (updates `tasks.status` to 'assigned', sets `tasks.assigned_tasker_id`, potentially creates initial `messages` channel).

**Phase 4: Location Services (PostGIS) & Basic Tasker Discovery**

*   Enable `postgis` extension in Supabase.
*   Modify `profiles` or `tasker_details` to store Tasker location (`geography` type).
*   Modify `tasks` table to store task location (`geography` type).
*   Create Supabase Function (e.g., `find_nearby_taskers`) for geospatial query (e.g., `ST_DWithin`).
*   Implement basic Tasker search/filtering for Users (by category, skills, location).
*   Add **Map View** for Taskers to see nearby open tasks.

**Phase 5: Direct Selection Flow (Option B)**

*   Enhance Tasker search/filtering: Add availability filter (based on simple availability data from Phase 3).
*   Enhance Tasker profile view for Users: Display skills, rate, availability, reviews (once implemented).
*   Implement **"Direct Selection" (Option B) flow:**
    *   User searches/filters Taskers.
    *   User selects Tasker and desired time slot.
    *   **Initiate Payment (triggers Phase 7 logic).**
    *   Upon successful payment confirmation: Update `tasks.status` to 'assigned', set `tasks.assigned_tasker_id`, create task entry, create `messages` channel.

**Phase 6: In-App Messaging**

*   Setup `messages` table (linking `task_id`, `sender_profile_id`, `receiver_profile_id`, and including `is_read`).
*   Setup Supabase Realtime for the `messages` table (used for unread count notifications; direct message updates in chat UI might use polling or further Realtime integration).
*   Build consolidated chat interface at `/messages`, accessible from task-related contexts via `/messages?taskId=[TASK_ID]`. This replaces any simpler/direct task-specific chat routes.
*   Implement real-time message display (polling currently, potential for full Realtime) and sending. Dynamic unread message count and notifications in header.

**Phase 7: Paytrail Integration & Payouts**

*   Setup Paytrail sandbox account. Securely store API keys (Supabase Secrets).
*   Implement `payments` table schema.
*   Create Supabase Edge Function (e.g., `create-payment`) to interact with Paytrail API, create pending payment record.
*   Integrate payment initiation into the **"Direct Selection" (Option B) flow** (Phase 5).
*   Implement frontend logic to handle redirection to/from Paytrail.
*   Implement webhook handler (Supabase Edge Function) to process Paytrail callbacks/confirmations, updating `payments` and `tasks` status.
*   Implement `payouts` table schema and establish a **manual process** for tracking/initiating Tasker payouts.

**Phase 8: Dynamic Forms, Reviews & Polish**

*   **Fully implement Dynamic Task Forms:** Fields adapt based on the selected service category.
*   Implement rating/review system (`reviews` table) triggered after task completion (`tasks.status` = 'completed'). Display reviews on Tasker profiles.
*   Refine UI/UX across the application based on Style Guidelines (colors, typography, icons). Ensure mobile-first responsiveness and accessibility.
*   Implement comprehensive Finnish language support (e.g., using `next-intl` or similar).
*   (Optional) Implement advanced Tasker availability/calendar management (e.g., integrating a calendar component).

**Phase 9: Admin Features & Deployment**

*   Implement basic Admin dashboard for user management, category management, dispute resolution (requires Admin role).
*   Final testing, bug fixing, performance optimization.
*   Prepare for production deployment (Vercel, etc.). Configure production Supabase project, Paytrail live keys.

- [ ] Add admin UI and logic to review tasker applications
    - When an admin approves a tasker application (status = 'approved'), also update the corresponding profile's is_verified field to true.
    - If an application is rejected or set back to pending, set is_verified to false.
    - Ensure this update is performed in the same transaction or API call for consistency.

