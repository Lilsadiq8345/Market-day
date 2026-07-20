Here is a single, self‑contained document you can give directly to Antigravity (and also reuse in your project report).

***

# Project Specification & Implementation Brief  
**Title:** Design and Implementation of a Weekly Market Day Reminder System for Zungeru and Surrounding Villages  

**Preferred Stack:**  
- Frontend: React or Next.js (React)  
- Backend: Supabase (Postgres, Auth, Edge Functions, pg_cron, RLS)  
- Notification channel for this implementation: **Email** (with clear extension points for SMS / push later)  

***

## 1. Project Overview

The goal is to build a web‑based system that reminds villagers and traders about upcoming weekly market days in Zungeru and surrounding villages.

Administrators manage villages, markets, users, and subscriptions via an admin dashboard. The system automatically sends reminder messages (initially via email) before each market day using scheduled jobs on Supabase.

This will be used as a final‑year student project, so code quality, documentation, and clear architecture matter as much as raw features.

***

## 2. Actors and Roles

1. **System Administrator**  
   - Logs into the admin dashboard.  
   - Manages villages, markets, users, and subscriptions.  
   - Views logs of sent reminders and their status.

2. **Market User (Villager / Trader)**  
   - Is registered (by admin or via public page).  
   - Subscribes to one or more markets.  
   - Receives reminder messages before market days.

(External services like email/SMS providers are treated as external components, not primary actors.)

***

## 3. Functional Requirements

### 3.1 Authentication & Roles (Supabase Auth)

- Use Supabase Auth for user accounts.  
- Maintain a `profiles` or `users` table with a boolean field (e.g. `is_admin`) to distinguish administrators from normal users.  
- Admin dashboard pages must be accessible only to authenticated admins.  

### 3.2 Village Management

- Admin can:
  - Create a new village.  
  - Edit village details.  
  - Delete a village (only if safe – consider cascade rules).  
- Fields:
  - `name`  
  - `lga`  
  - `state`  

### 3.3 Market Management

- Each market belongs to a village and has a weekly recurrence.  
- Admin can:
  - Create, edit, delete markets.  
  - Assign a village and market day.  
- Fields:
  - `name`  
  - `village_id` (FK to `villages`)  
  - `day_of_week` (0–6 or text like `monday`..`sunday`)  
  - `start_time` (time of day)  
  - `description` (optional)  

### 3.4 User Management

- Admin can:
  - Create new users.  
  - Edit user information.  
  - Delete users.  
- Fields:
  - `full_name`  
  - `email`  
  - `phone`  
  - `village_id` (home village)  
  - `preferred_channel` (e.g. `email`, `sms`, `push` – for now we will implement **email** only).  
  - Optional: `auth_user_id` (FK to `auth.users.id` if they also log in).

### 3.5 Subscription Management

- Admin can manage which markets each user is subscribed to.  
- A user can subscribe to multiple markets.  
- Fields:
  - `user_id` (FK to `users`)  
  - `market_id` (FK to `markets`)  
  - `reminder_offset_hours` (how many hours before the market to send the reminder; default 24).

### 3.6 Automatic Reminder Engine

Implement the reminder engine entirely in Supabase:

1. **Scheduling with pg_cron**  
   - Enable `pg_cron` on the Supabase project.  
   - Create a daily cron job (e.g. `0 6 * * *`) that triggers an Edge Function (via `pg_net` or HTTP) early in the morning. [supabase](https://supabase.com/docs/guides/functions/schedule-functions)

2. **Edge Function: `send_weekly_market_reminders`**  
   The Edge Function must:

   - Determine the current day of week and current time.  
   - Select all markets scheduled for the current day.  
   - For each market, compute which subscriptions have reminders due, based on `start_time` and `reminder_offset_hours`.  
   - Join `subscriptions`, `users`, and `markets` to get:
     - Recipient email  
     - Recipient name  
     - Market name  
     - Village name  
     - Market start time  
   - For this student implementation:
     - Send an **email** reminder using a simple, well‑documented method (e.g. Resend, SendGrid, or a mock email service).  
     - Prepare text like:  
       - Subject: `Market Reminder: {market_name}`  
       - Body: `Dear {full_name}, this is a reminder that the {market_name} in {village_name} is scheduled for today at {start_time}.`  
   - For each send attempt, insert a row into `reminder_logs` with:
     - `user_id`, `market_id`, `channel`, `sent_at`, `status`, `error_message` (if any).  

3. **Extensibility**  
   - Structure the Edge Function so adding **SMS** or **push notifications** later is straightforward (e.g. separate “sendEmail”, “sendSms” helpers).

### 3.7 Reminder Logs

- Admin can view a paginated table of reminder logs.  
- For each log entry show:
  - User (name + email)  
  - Market (name)  
  - Channel (email/sms/push)  
  - Time sent (`sent_at`)  
  - Status (`success` or `failed`)  
  - Error message (if failed)

### 3.8 Public Subscription Page (Optional but Highly Desired)

- A simple public page (no login) where a villager can:
  - Enter: full name, email, phone, village.  
  - See available markets (filtered by village).  
  - Choose markets they want reminders for.  
- On submit:
  - Create or update the `users` row.  
  - Create/update corresponding `subscriptions` rows.  
- Show a confirmation message:  
  - “You will now receive email reminders for selected market days.”

***

## 4. Data Model (Supabase Schema)

Please create the following tables (names may be adapted slightly, but semantics should stay):

### 4.1 `villages`

- `id` (uuid, PK, default gen_random_uuid())  
- `name` (text, not null)  
- `lga` (text, not null)  
- `state` (text, not null)

### 4.2 `markets`

- `id` (uuid, PK)  
- `name` (text, not null)  
- `village_id` (uuid, FK → `villages.id`, not null)  
- `day_of_week` (smallint or text, not null)  
- `start_time` (time, not null)  
- `description` (text, nullable)

### 4.3 `users`

- `id` (uuid, PK)  
- `auth_user_id` (uuid, FK → `auth.users.id`, nullable)  
- `full_name` (text, not null)  
- `email` (text, nullable but recommended not null for email channel)  
- `phone` (text, nullable)  
- `village_id` (uuid, FK → `villages.id`, nullable)  
- `preferred_channel` (text, not null, default `email`)

### 4.4 `subscriptions`

- `id` (uuid, PK)  
- `user_id` (uuid, FK → `users.id`, not null)  
- `market_id` (uuid, FK → `markets.id`, not null)  
- `reminder_offset_hours` (integer, default 24)

### 4.5 `reminder_logs`

- `id` (uuid, PK)  
- `user_id` (uuid, FK → `users.id`, not null)  
- `market_id` (uuid, FK → `markets.id`, not null)  
- `channel` (text, not null)  
- `sent_at` (timestamptz, not null, default now())  
- `status` (text, not null, e.g. `success`, `failed`)  
- `error_message` (text, nullable)

### 4.6 Profiles / Roles

You may either:

- Use a separate `profiles` table (`id`, `auth_user_id`, `is_admin`), or  
- Extend the `users` table with `is_admin` boolean and connect it to `auth.users`.

Role requirement:

- There must be a way to distinguish admins from normal users, used in RLS policies and front‑end routing.

***

## 5. Security and RLS

Implement Row Level Security (RLS) and policies:

1. For admin‑only tables (`villages`, `markets`, `users`, `subscriptions`, `reminder_logs`):
   - Only authenticated users with `is_admin = true` (or equivalent) can perform insert/update/delete/select.  

2. For public subscription endpoint:
   - Allow an unauthenticated user to:
     - Insert a new `users` record with limited fields (full_name, email, phone, village).  
     - Insert/update their own `subscriptions` (likely by calling a Supabase function / Edge Function with public anon key rather than direct table access).

Clearly comment the policies so it is easy to understand during project defense.

***

## 6. Backend Implementation (Supabase Functions & Cron)

### 6.1 Edge Function: `send_weekly_market_reminders`

- Implement in Deno/TypeScript as a Supabase Edge Function.  
- Steps inside the function:

  1. Get current date, time, and day of week.  
  2. Query `markets` where `day_of_week` = today.  
  3. For each market, compute which reminders are due now using `reminder_offset_hours` and `start_time`.  
  4. Select all affected `subscriptions` + `users`.  
  5. For each (user, market) pair:
     - If `preferred_channel = email` and email is present:  
       - Construct an email.  
       - Send via chosen email provider OR at least log a HTTP request that would be sent.  
  6. Insert into `reminder_logs` with appropriate status and error message if sending fails.

- Make the code modular so adding `sendSmsReminder()` or `sendPushReminder()` later is straightforward.

### 6.2 Cron Job

- Configure `pg_cron` to run once per day (e.g. 06:00) and invoke the Edge Function.  
- Add SQL / configuration for the cron job in a migration or documentation.

### 6.3 Documentation

- Add a README section explaining:
  - Environment variables needed (Supabase URL/keys, email provider keys).  
  - How to deploy the Edge Function.  
  - How to create/update the cron job schedule.  

***

## 7. Frontend Implementation (React / Next.js)

### 7.1 General

- Use React or Next.js with modern tooling (Vite, CRA, or Next).  
- Use Supabase JS client for all data access.  
- You may use a UI library (MUI, Chakra, Tailwind, etc.) for clean presentation.

### 7.2 Admin Dashboard

Pages/sections:

1. **Login Page**  
   - Use Supabase Auth (email/password).  
   - After login, redirect admins to dashboard.

2. **Villages Management**  
   - List villages (table).  
   - Add/edit/delete village.  

3. **Markets Management**  
   - List markets, filter by village.  
   - Form to add/edit markets (name, village, day_of_week, start_time).  

4. **Users Management**  
   - List users.  
   - Form to add/edit users (name, email, phone, village, preferred_channel).  

5. **Subscriptions Management**  
   - On user details page, show:
     - List of markets user is subscribed to.  
     - Ability to add/remove market subscriptions.  
     - Set `reminder_offset_hours` per subscription.

6. **Reminder Logs**  
   - Paginated table showing:
     - User name  
     - Market name  
     - Channel  
     - Sent time  
     - Status  
     - Error message (if any)  

UX details:

- Use toasts/snackbars for success/error messages.  
- Validate required fields before submission.  
- Handle loading and empty states gracefully.

### 7.3 Public Subscription Page

- Public route (no login).  
- Form with:
  - Full name  
  - Email  
  - Phone  
  - Village dropdown  
  - Markets multi‑select (based on selected village)  
- On submit:
  - Call an API/Edge Function or Supabase RPC to upsert:
    - `users` record (by email or phone).  
    - Corresponding `subscriptions`.  
- Show confirmation text on success.

***

## 8. Code Quality and Deliverables

Please ensure:

- Clean folder structure (separate components, services/api layer, types/models).  
- Supabase queries encapsulated in functions (e.g. `marketService`, `userService`) rather than scattered in components.  
- Important flows (e.g. sending reminders, creating subscriptions) are commented clearly, since this is for an academic project.  
- Provide:

  - SQL or migration scripts for creating the tables and RLS policies.  
  - Edge Function source code.  
  - React app source code.  
  - A top‑level README describing:
    - How to set up environment variables.  
    - How to run the frontend locally.  
    - How to deploy and test the Edge Function.  
    - How to trigger the reminder function manually for testing.

***

