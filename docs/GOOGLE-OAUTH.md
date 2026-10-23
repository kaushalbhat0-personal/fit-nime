# Google OAuth setup (manual dashboard steps)

Application code implements the Supabase server-side PKCE flow:

```text
Continue with Google (server action)
 → supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <origin>/auth/callback?next=/dashboard })
 → Google consent
 → Supabase Auth (https://<project-ref>.supabase.co/auth/v1/callback)
 → Fit-Nime GET /auth/callback?code=...&next=/dashboard
 → exchangeCodeForSession(code) → httpOnly cookies
 → /dashboard
```

Two different callbacks — do not confuse them:

1. `Google → Supabase`: `https://<project-ref>.supabase.co/auth/v1/callback`
   (shown on the Supabase Dashboard Google provider page).
2. `Supabase → Fit-Nime`: `https://fit-nime.vercel.app/auth/callback`
   (implemented in `apps/web/app/auth/callback/route.ts`).

No application env vars or secrets are required. The app uses only
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 1. Google Cloud Console

1. Create/select a project at https://console.cloud.google.com/home/dashboard.
2. Open Auth Platform → Audience: choose External, add your test users if
   the app is in Testing mode.
3. Open Auth Platform → Data Access (Scopes): ensure
   `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   Do not add sensitive/restricted scopes.
4. Open Auth Platform → Branding: set app name/logo (verification optional,
   takes days).
5. Open Auth Platform → Clients → Create Client → Web application:
   - Authorized JavaScript origins:
     - `https://fit-nime.vercel.app`
     - `http://localhost:3000`
   - Authorized redirect URIs (this is callback #1, Google → Supabase):
     - `https://<project-ref>.supabase.co/auth/v1/callback`
     - copy the exact value from Supabase Dashboard → Auth → Providers →
       Google; for local Supabase stack use
       `http://127.0.0.1:54321/auth/v1/callback`.
6. Save the Client ID and Client Secret (secret goes to Supabase Dashboard
   only, never into the repo).

## 2. Supabase Dashboard (production project)

1. Auth → Providers → Google → Enable.
2. Paste Client ID + Client Secret from Google Cloud.
3. Auth → URL Configuration:
   - Site URL: `https://fit-nime.vercel.app`
   - Additional Redirect URLs (add each):
     - `https://fit-nime.vercel.app/**`
     - `https://fit-nime.vercel.app/auth/callback`
     - `http://localhost:3000/**`
     - `http://127.0.0.1:3000/**`
     - `http://localhost:3000/auth/callback`
4. Keep the provider's callback URL (`...supabase.co/auth/v1/callback`)
   registered in Google Cloud as above.

## 3. Vercel

- No new env vars. Keep `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointed at the production project.
- Preview deployments (`https://*-<team>.vercel.app`) are NOT allowlisted by
  default. Google login on a preview URL fails closed until its exact URL is
  added under Supabase URL Configuration. Either add a wildcard
  `https://*-<team>.vercel.app/**` for testing or test OAuth only on
  localhost + production. Do not weaken the app's `next` validation to work
  around this.

## 4. Local development

- App origin: `http://localhost:3000` (also allow `127.0.0.1:3000`).
- The `signInWithGoogle` server action derives `redirectTo` from the request
  host (`x-forwarded-host` → `host`, default `http://localhost:3000`), so no
  hardcoded domain is needed.
- To test against a local Supabase stack, set in `supabase/config.toml`:
  `[auth.external.google]` with `client_id` + `secret =
  "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"`, and register
  `http://127.0.0.1:54321/auth/v1/callback` in Google Cloud. Documented only;
  no local config is changed by the OAuth implementation.

## 5. Account linking (current Supabase behavior)

- Case A — email/password exists, then Google with the same verified email:
  Supabase automatically links the Google identity to the existing user.
  Same `auth.uid()`, existing profile/stats kept, no duplicate. No app code.
- Case B — Google account exists, then email/password signup with the same
  email: Supabase returns an obfuscated response with no verification email
  (anti-enumeration). To add a password later, the signed-in user can call
  `updateUser({ password })`. Not implemented here.
- Case C — another OAuth provider with the same email: same automatic
  linking rule (SAML excluded). Manual `linkIdentity()` is beta and disabled;
  no custom merging logic in the app — do not compare emails or merge
  accounts in application code.
