# fliqk - Environment Setup

## Required Environment Variables

Create a `.env.local` file in the project root with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Claude API (server-side only)
ANTHROPIC_API_KEY=sk-ant-your-key
```

## Vercel Setup

Add these same variables in:
Vercel Dashboard → Settings → Environment Variables

## Notes

- `NEXT_PUBLIC_` variables are exposed to the browser
- `ANTHROPIC_API_KEY` is server-side only (no prefix)
- Never commit `.env.local` to git!

