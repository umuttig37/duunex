# Project Roadmap: TehtäväMestari

This document outlines the development phases for TehtäväMestari and tracks the current progress.

**Current Overall Status:** Phase 2 & 3 In Progress (with continued refinements in Phase 1 and progress in Phase 4, 5, 6 & 9)

---

## Phase 1: Core Setup & Authentication
**Status:** DONE (with ongoing refinements and verifications)
*   Initialize Next.js project, integrate Supabase client, Tailwind, Shadcn/ui. DONE
*   Implement basic User/Tasker signup and login (Supabase Auth). DONE
    *   **Note (2025-05-16):** Admin users are now correctly redirected to `/admin` upon successful login, while other authenticated users are directed to `/dashboard` or their intended redirect path.
*   **Separate signup flows for regular users and taskers.** DONE
    - Use distinct forms/pages for User signup (`/signup`) and Tasker signup (`/signup/tasker`), no global radio selector. DONE
    - Tasker signup flow should be a **multistep, query-style form with a progress bar** (not a single long form). DONE
        - Each step should focus on one logical group (e.g. contact info, location, pricing, categories, profile picture, bio, availability). DONE
        - Show progress visually to the user. DONE
        - Steps should prompt for:
            - Location (address or coordinates) - DONE (collected as text, `geography` type for `tasker_details.location` is a Phase 4 item)
                - **Refinement Note for Future Implementation:** Both Tasker Signup (Phase 1) and Tasker Profile Edit (Phase 3) should integrate Google Maps Platform (Places API) for address input. This input should be geocoded to `latitude` and `longitude` and subsequently saved to `tasker_details.location` (PostGIS `geography` type), aligning with the capabilities being built into task posting and Phase 4 goals. This supersedes collecting location purely as text for taskers.
            - Pricing/hourly rate - DONE (collected, schema for storage to be finalized, potentially in `tasker_details`)
            - Categories/services offered (multi-select from categories) - DONE (saved to `tasker_categories`)
            - Contact information (phone, email) - DONE (saved to `profiles`)
            - Profile picture upload - DONE (saved to `profiles.avatar_url` via Supabase Storage)
            - Short bio/description - DONE (saved to `profiles.bio`)
            - (Optionally) initial availability - DONE (collected as text, `jsonb` for `tasker_details.availability_schedule` is a future refinement)
    - These details should be saved to the appropriate fields in `profiles` and `tasker_categories` tables. (Details for `tasker_details` to be fully mapped in later phases, e.g. PostGIS location, JSONB availability). DONE
    - **Note (2025-05-16):** The tasker verification flow, ensuring `profiles.is_verified` is updated when an admin approves/rejects an application via the `tasker_applications` page, has been confirmed and RLS policies were corrected.
*   "Ryhdy Tekijäksi" link in navbar should initiate the tasker signup flow.
*   Setup `profiles` table with basic fields and `role` column. DONE
*   Setup `categories` table & seed initial data. DONE
*   Implement foundational RLS policies for profiles and categories. DONE
    *   **Note (2025-05-16):** RLS policies for `tasker_applications` (SELECT and UPDATE by admin) and `profiles` (UPDATE `is_verified` by admin) were reviewed and corrected to support admin tasker application management.

---

## Phase 2: Visitor Flow & Basic Task Posting (Option A Foundation)
**Status:** In Progress
*   Build category browsing page (accessible to Visitors).
*   Implement initial Task Posting form (`task-form.tsx`) - **consider dynamic fields early**.
    - **Status (2025-05-17):** Advanced / Core multi-step logic (5 steps) with state management implemented. Includes category-specific dynamic fields, Zustand state preservation across authentication, and a dedicated step for choosing 'Open' vs. 'Direct' posting.
    - **Note:** `TaskBookingForm` (`task-form.tsx` equivalent) now handles multi-step input, category-specific dynamic fields, and preserves state across authentication for visitors.
*   Implement Visitor flow: Browse Categories -> Start Task Form -> Prompt Login/Signup to continue.
    - **Status:** Significantly Advanced / Nearing Completion for initial form steps.
    - **Note:** Visitor can now complete initial task details (category, description, location, time, dynamic fields), saving state to Zustand store. Authentication is prompted only when proceeding after the 'Select Tasker' step (Step 3 of booking form), with form state correctly restored after login.
*   Implement User flow (post-login): Complete Task Form -> Post Task (creates entry in `tasks` table with 'open' status, links to `user_profile_id`).
*   Create basic task list (`/tasks`) and task detail (`/tasks/[id]`) views.
    - **Note (2025-05-17):** Task detail page (`/tasks/[id]`) styling significantly updated to resemble an e-commerce product card, removing nearby taskers list and adding conditional action buttons for task owners and potential taskers.
*   Setup basic User Dashboard (`/dashboard/user` or similar) showing their posted tasks.

---

## Phase 3: Tasker Profile & Open Posting Flow (Option A)
**Status:** In Progress
*   Enhance Tasker profile setup/edit page: Add fields for skills (link to `categories` or separate `skills` table), **availability (simple text/JSONB initially)**, **hourly rate**, description, profile picture (Supabase Storage).
*   Implement Tasker Dashboard (`/dashboard/tasker`): View/edit profile, view open tasks matching their skills/categories.
    *   **Refinement (YYYY-MM-DD):** Tasker Dashboard refactored with distinct views for "Työpöytä" (main), "Aktiiviset Tehtävät" (Active Tasks), and "Työhistoria" (Task History), navigable via URL parameters.
*   **Implement Real Tasker Display in Booking Form:**
    - **Status:** Partially Complete / In Progress
    - **Note:** TaskerSelection.tsx now fetches and displays verified taskers based on category ID *and* proximity (using `find_nearby_taskers` RPC with ST_DWithin, currently hardcoded 10km radius). Fetches basic profile info, hourly rate, and calculates distance. Filtering by availability and displaying real reviews are pending.
*   Implement **"Open Posting" (Option A) flow:**
    *   **Task Posting Form Update (2025-05-17):** DONE. Users can now choose between "Open Posting" (tasks are public, user sets date/time/budget) and "Direct Assignment" (users select a specific tasker) in a dedicated form step. Form UI, step logic (5 steps total), validation, and submission logic (including `posting_type` and conditional `budget` fields for `tasks` table) updated. `step-indicator.tsx` and `booking-summary.tsx` also updated.
    *   Taskers can view/filter open tasks. // Partially DONE - Open tasks visible on map in Tasker Dashboard.
    *   **NEW (2025-05-17): Implement Tasker-Initiated Contact & Offer System for Open Tasks:**
        *   Allow taskers to contact/send a message to the task creator for an 'open' task. This likely initiates a message thread or a specific "task request/offer" record.
        *   Notify the task creator (user) via dashboard (and eventually email) about new requests/messages for their task (e.g., "Tasker X has sent you a message regarding Task Y" or "Tasker X has made an offer for Task Y").
        *   User can view the tasker's details and message/offer.
        *   User can **Accept** or **Decline** the tasker's request/offer for their open task.
        *   If a user **Accepts** a tasker's request/offer for an open task:
            *   The task is assigned to the chosen tasker (`tasks.assigned_tasker_id` is set).
            *   The task `status` changes to 'assigned' (or a similar state indicating it's no longer open for general requests).
            *   No further requests/offers for this task should be accepted or made by other taskers.
            *   Other pending requests/offers for this task from different taskers should ideally be marked as 'declined' or 'closed'.
        *   Consider creating a `task_applications` or `task_offers` table to manage these interactions if a simple message thread isn't sufficient.
    *   Users can view bids on their tasks and accept one (updates `tasks.status` to 'assigned', sets `tasks.assigned_tasker_id`, potentially creates initial `messages` channel). // This point is now largely covered by the new system above.
    *   **User Dashboard Update (YYYY-MM-DD):** Open tasks are visible and editable from the user's dashboard.

---

## Phase 4: Location Services (PostGIS) & Basic Tasker Discovery
**Status:** In Progress
*   Enable `postgis` extension in Supabase.
    - **Status:** DONE
*   Integrate Google Maps Platform for address autocompletion (Places API) during task posting and tasker profile setup.
    - **Status:** DONE
*   Modify `profiles` or `tasker_details` to store Tasker location (`geography` type, derived from Google Maps Geocoding).
    - **Status:** DONE
    - **Note:** Tasker signup form now captures address via Google Places, geocodes, and stores location in `tasker_details.location` (geography) using an RPC function.
*   Modify `tasks` table to store task location (`geography` type, derived from Google Maps Geocoding).
    - **Status:** DONE
    - **Note:** Task booking form (`TaskDetails`) captures location via Google Places and stores coordinates in `tasks.location_coordinates`.
*   Create Supabase Function (e.g., `find_nearby_taskers`) for geospatial query (e.g., `ST_DWithin`).
    - **Status:** DONE
    - **Note:** `find_nearby_taskers` implemented using ST_DWithin, taking task lat/lon, radius, and category ID, returning matching tasker profiles and distance.
*   Implement basic Tasker search/filtering for Users (by category, skills, location).
    - **Status:** Partially Complete / In Progress
    - **Note:** Basic location-based filtering (via `find_nearby_taskers` RPC) integrated into the Task Booking form's Tasker Selection step. Category filtering is also included in the RPC. Standalone user-facing search/filtering page/features are still pending.
*   Add **Map View** (using Google Maps Platform SDK) for Taskers to see nearby open tasks and for users to confirm task location.
    *   **Status (2025-05-17):** DONE for Tasker Dashboard.
    *   **Details (2025-05-17):**
        *   Tasker Dashboard ("Työpöytä") now displays a map view of all 'open' tasks with valid location coordinates.
        *   Implemented `get_open_tasks_for_map` PostgreSQL RPC function to efficiently fetch and format open task data, including converting `location_coordinates` to `POINT(lng lat)` text (and **needs to include category icon URL**).
        *   New `OpenTasksMap.tsx` component created to render the Google Map, markers, and InfoWindows for task details. **Markers updated to use category icons** (pending `icon_url` in `DashboardTask` type via RPC).
        *   Map restricted to Finland bounds.
        *   Resolved issues with coordinate parsing and Supabase client query interpretation for PostGIS functions.

---

## Phase 5: Direct Selection Flow with Tasker Confirmation (Option B)
**Status:** In Progress
*   Enhance Tasker search/filtering: Add availability filter (based on simple availability data from Phase 3).
*   Enhance Tasker profile view for Users: Display skills, rate, availability, reviews (once implemented).
*   Implement **"Direct Selection with Confirmation" (Option B) flow:**
    *   **Task Posting Form Note (2025-05-17):** Users can now select "Direct Assignment" in a dedicated step (Step 3 of 5) in the task posting form. If a tasker is selected (Step 4), task status becomes `request_sent`. If no tasker is selected for a Direct post (though form validation aims to prevent this for submission), it defaults to `open`. The `posting_type` TEXT column is now assumed to be added to the `tasks` table to store this initial choice.
    *   User searches/filters Taskers.
    *   User selects Tasker and desired time slot, then sends a **Task Request**. // DONE (Task Posting Form updated, task status set to `request_sent`)
    *   Task status becomes `request_sent`. // DONE
    *   Tasker receives a notification for the new task request (requires notification system enhancement - consider in-app and email). // Partially DONE (Tasker sees requests in their dashboard via `TaskRequestsList` component)
    *   Tasker has a defined timeframe to **Accept** or **Decline** the request. // Accept/Decline functionality DONE via server actions and dashboard component.
        *   If **Declined** (or timeframe expires): Task status becomes `request_declined` (or `request_expired`). User is notified and can search for another tasker. // DONE for `request_declined` status update. User notification and re-search pending.
        *   If **Accepted**: Task status becomes `request_accepted_pending_payment`. User is notified. // DONE (status becomes `assigned` directly, skipping payment for now). User notification pending.
    *   User is prompted to **Initiate Payment (triggers Phase 7 logic) *after tasker confirmation***. // SKIPPED for now.
    *   Upon successful payment confirmation: Update `tasks.status` from `request_accepted_pending_payment` to 'assigned', set `tasks.assigned_tasker_id`, create task entry, create `messages` channel. // Task status becomes `assigned` directly upon tasker acceptance.
*   **Note:** This flow introduces new task statuses: `request_sent`, `request_accepted_pending_payment`, `request_declined`, `request_expired`. These should be added to the global list of task statuses (e.g., in `blueprint.md`). // `request_sent` and `request_declined` statuses added to DB constraints and are functional.

---

## Phase 6: In-App Messaging
**Status:** Partially Complete
*   Setup `messages` table with `is_read` and `receiver_profile_id` columns. (Assumed DONE)
*   Consolidated chat UI into a comprehensive `/messages` page:
    *   Lists all user conversations (task-based).
    *   Allows selecting a conversation, which can also be linked directly via `/messages?taskId=[TASK_ID]`.
    *   Displays messages for the selected conversation.
    *   Handles sending new messages.
    *   Implements marking messages as read (both locally and in the database) when a conversation is opened.
    *   Removed simpler, redundant chat route `/tasks/[id]/chat`.
    *   **Note (2025-05-16):** Resolved a build error on `/messages` page by wrapping client components using `useSearchParams` in a `<Suspense>` boundary.
*   Setup Supabase Realtime for dynamic unread message count in the main header. (DONE via `useUnreadMessages` hook)
*   Message display within an active chat on `/messages` page currently uses polling; consider upgrading to full real-time subscription for messages within the selected conversation if performance/UX requires.
*   Implemented dynamic notifications for unread messages in the header. (DONE)

---

## Phase 7: Paytrail Integration & Payouts
**Status:** In Progress
*   Setup Paytrail sandbox account. Securely store API keys (Supabase Secrets). **DONE** - Using test credentials (375917, SAIPPUAKAUPPIAS)
*   Implement `payments` table schema. **DONE** - Table exists and is being used
*   Create Supabase Edge Function (e.g., `create-payment`) to interact with Paytrail API, create pending payment record. **DONE** - Implemented as Server Action (`createPaytrailPayment`) with proper SDK integration
    *   **Note (2025-07-11):** Integrated official `@paytrail/paytrail-js-sdk` with proper TypeScript typing, validation, and error handling
    *   **Note (2025-07-11):** Added platformName configuration and proper field validation (email max 200 chars, productCode max 100 chars, description max 1000 chars)
    *   **Note (2025-07-11):** Fixed Next.js serialization error by converting SDK response to plain object using JSON.parse(JSON.stringify()) to ensure compatibility with Server Actions
    *   **Note (2025-07-11):** Fixed class-validator validation errors by using proper SDK class instances (Item, Customer, CallbackUrl, CreatePaymentRequest) instead of plain objects - SDK expects class instances for validation
    *   **Note (2025-07-11):** Fixed HTTPS URL validation error - Paytrail requires HTTPS URLs and rejects localhost/IP addresses. Updated to use HTTPS URLs with fallback for development
*   Integrate payment initiation into the **"Direct Selection with Confirmation" (Option B) flow** (Phase 5), *occurring after the tasker has accepted the task request and before the task is marked 'assigned'*. **IN PROGRESS** - Payment flow component implemented
*   Implement frontend logic to handle redirection to/from Paytrail. **DONE** - Payment flow component successfully handles redirects and extracts payment URL from Paytrail response
    *   **Note (2025-07-11):** Payment creation now returns valid Paytrail gateway URL (https://pay.paytrail.com/pay/[transaction-id]) with all payment methods available (bank transfers, mobile payments, credit cards, installment options)
    *   **Note (2025-07-11):** Improved payment form mobile responsiveness - fixed overflow issues on smaller viewports with proper scrolling and responsive text/icon sizing
    *   **Note (2025-07-11):** Fixed payment URL extraction bug - frontend now properly handles nested response structure with href inside data property
*   Implement webhook handler (Supabase Edge Function) to process Paytrail callbacks/confirmations, updating `payments` and `tasks` status. **DONE** - API route `/api/paytrail-callback` handles both GET and POST callbacks with signature verification and status updates
*   Implement `payouts` table schema and establish a **manual process** for tracking/initiating Tasker payouts. **TODO**

---

## Phase 8: Dynamic Forms, Reviews & Polish
**Status:** Not Started
*   **Fully implement Dynamic Task Forms:**
    *   Define and implement `category_specific_questions` and `task_specific_answers` database tables to store category-specific questions and their corresponding answers for each task. *(Database tables created, initial questions populated)*
    *   Develop an interface (potentially admin-facing initially, or managed directly in the database) to manage questions in `category_specific_questions` (e.g., add, edit, delete questions, define question types, options, order, and requirement per category).
    *   Enhance the task posting form (`task-form.tsx`) to dynamically fetch and render relevant questions from `category_specific_questions` based on the selected service category.
    *   Implement logic within the task submission process to save user responses for these dynamic questions into the `task_specific_answers` table, linking them to the created task.
*   Implement rating/review system (`reviews` table) triggered after task completion (`tasks.status` = 'completed'). Display reviews on Tasker profiles.
*   Refine UI/UX across the application based on Style Guidelines (colors, typography, icons). Ensure mobile-first responsiveness and accessibility.
*   Implement comprehensive Finnish language support (e.g., using `next-intl` or similar).
*   (Optional) Implement advanced Tasker availability/calendar management (e.g., integrating a calendar component).

---

## Phase 9: Admin Features & Deployment
**Status:** In Progress (Significant progress on Tasker Application Management)
*   Implement basic Admin dashboard for user management, category management, dispute resolution (requires Admin role).
    *   **Note (2025-05-16):** Admin users are now correctly redirected to `/admin` post-login.
    *   **Note (2025-05-16):** Core functionality for viewing and managing tasker applications (`/admin/tasker-applications`) is implemented.
        *   Resolved issues preventing admins from viewing tasker applications (ambiguous Supabase query due to multiple FKs to `profiles`, RLS `SELECT` policies).
        *   Resolved RLS policy issues preventing admins from updating tasker application statuses.
        *   The related