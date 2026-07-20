# Marginalia — setup guide

This is a static site (just `index.html`), so it's cheap and simple to run.
Right now, sign-up/login and "mark as solved" work visually, but nothing is
saved anywhere until you connect a real backend. Here's how, step by step.

## 1. Create a free Supabase project

1. Go to supabase.com and create a free account and a new project.
2. Wait for it to finish provisioning (~2 minutes).
3. In the dashboard, go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public key**
4. Open `index.html`, find this block near the bottom, and paste your values in:

   ```js
   const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
   ```

## 2. Create the progress table

In the Supabase dashboard, open the **SQL editor** and run:

```sql
create table progress (
  user_id uuid references auth.users not null,
  question_id text not null,
  solved boolean default true,
  updated_at timestamptz default now(),
  primary key (user_id, question_id)
);

alter table progress enable row level security;

create policy "Users can manage their own progress"
on progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

That last part (row level security) is important — it makes sure a student
can only ever read or write their *own* progress rows, never anyone else's.

## 3. Turn off "confirm email" while testing (optional)

By default Supabase requires email confirmation before login works. While
testing, you can turn this off under **Authentication → Providers → Email**.
Turn it back on before you launch publicly.

## 4. Set up the voice tutor

The "Talk to your tutor" box uses:
- The **browser's built-in speech recognition** to hear the question (works well in Chrome on desktop and Android; Safari/iOS support is limited or unavailable — worth testing on your son's actual device).
- A **serverless function** (`api/tutor.js`, included) that calls the Anthropic API on the server, so your API key is never exposed in the page's source code.
- The **browser's built-in text-to-speech** to read the answer aloud (free, works everywhere, sounds robotic — see "upgrading the voice" below).

Steps:

1. Get an Anthropic API key from console.anthropic.com (this is billed separately from
   your Claude.ai subscription — pay-as-you-go, roughly fractions of a cent per short answer).
2. In your Vercel project settings, add an environment variable:
   `ANTHROPIC_API_KEY` = your key.
3. Deploy (see step 4 below) — Vercel automatically detects the `api/tutor.js` file and
   turns it into a live endpoint at `/api/tutor`. No extra setup needed.
4. Open the site, tap the mic, and ask a question out loud.

**Upgrading the voice later:** the built-in browser voice is free but sounds synthetic.
If you want a more natural voice, that means swapping in a paid text-to-speech service
(e.g. ElevenLabs) inside `api/tutor.js` — happy to help wire that up once the basics work.

## 6. Deploy it

Easiest free option:

1. Push this folder to a GitHub repo.
2. Go to vercel.com (or netlify.com), sign in with GitHub, and import the repo.
3. It deploys automatically — no build step needed, it's just static HTML.
4. Add your custom domain under the project's **Domains** settings once you've
   bought one (Namecheap, Google Domains, etc. — roughly $1/month).

## What's next

This currently has one topic each for Math and Physics as a proof of concept.
Adding more topics means duplicating the `tab-panel` / lesson / practice
pattern already in the file — happy to help generate more once you tell me
which topics to prioritize.
