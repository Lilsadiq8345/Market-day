# Weekly Market Day Reminder System

This is the codebase for the "Design and Implementation of a Weekly Market Day Reminder System for Zungeru and Surrounding Villages" project.

## Architecture Overview
The system is built using:
- **Frontend**: Next.js (App Router), React, Tailwind CSS, and Lucide React icons.
- **Backend**: Supabase (PostgreSQL database, Auth).
- **Scheduled Jobs**: Supabase Edge Functions triggered by `pg_cron` (Postgres cron extension) to run daily.
- **Email Service**: Brevo API (invoked via the Edge Function).

## Folder Structure
- `src/app/page.tsx`: The public landing page where users can subscribe to markets.
- `src/app/admin/page.tsx`: The secure admin dashboard where administrators manage markets.
- `src/lib/supabase.ts`: The initialized Supabase client for frontend database queries.
- `supabase/migrations/`: SQL files that define the database tables, RLS policies, and cron job setup.
- `supabase/functions/send-reminders/`: The Deno Edge Function script that sends out emails.

---

## 1. Local Setup Instructions

### Environment Variables
Create a file named `.env.local` in the root of the frontend project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Frontend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to view the public page, and `http://localhost:3000/admin` for the admin dashboard.

### Admin Dashboard Access
Use the following credentials to access the secure admin dashboard at `/admin`:
- **Email:** `admin@market.com`
- **Password:** `adminadmin`

---

## 2. Supabase Backend Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy and run the contents of `supabase/migrations/20260717000000_init.sql` to create the tables and security policies.
4. Set up Authentication by enabling the **Email/Password** provider (in Authentication -> Providers) and create your Admin user there.

---

## 3. Email Reminders (Edge Function) Setup

We use a Supabase Edge Function to securely send emails via [Brevo](https://brevo.com) (which is free).

1. Install the Supabase CLI on your computer.
2. Link your local project to your remote Supabase project:
   ```bash
   npx supabase link --project-ref your-project-id
   ```
3. Add your Brevo API Key and Sender Email as secrets to your Supabase project:
   ```bash
   npx supabase secrets set BREVO_API_KEY=xkeysib-your_api_key_here
   npx supabase secrets set SENDER_EMAIL=your_verified_brevo_email@domain.com
   ```
4. Deploy the Edge Function:
   ```bash
   npx supabase functions deploy send-reminders --no-verify-jwt
   ```

### Scheduling the Function (Cron Job)
To make the function run automatically every day at 8:00 AM UTC:
1. Open the Supabase SQL Editor.
2. Run the `supabase/migrations/20260717000001_cron.sql` script (make sure you update `YOUR_SUPABASE_PROJECT_REF` and `YOUR_ANON_KEY` inside the script first).

### Testing the Function Manually
You can test the Edge Function anytime without waiting for the daily schedule by sending a POST request to it. Using `curl` in your terminal:

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/send-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```
*(If markets are scheduled for tomorrow, you will see emails arriving in your inbox!)*
