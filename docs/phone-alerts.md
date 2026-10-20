# HeadTap on iPhone and show alerts

## Implemented

The existing Vite app now has a manifest, generated app icons, a service worker,
a public offline fallback and a compact **Concerts → Show alerts** panel.
The worker caches only the offline page, never Spotify API responses or OAuth URLs.
Push opens the latest alert inbox in HeadTap. Installation requires HTTPS; iPhone
requires iOS 16.4+ and opening the app from the Home Screen before granting permission.

Show alerts supports a US ZIP, 10/25/50/100-mile radius, optional USD ticket budget,
selected artists from the loaded library, daily roundups or at most one notification
per six hours. Permission is requested only on the Enable notifications button.
Demo mode previews the settings without subscribing or making backend requests.

The independent `show-alerts` Edge Function verifies existing Spotify sessions and
resolves a stable owner ID with Spotify. Device records are service-role-only, with
RLS enabled and browser table permissions revoked. Device reads and mutations are
owner-scoped. Push endpoints are restricted to known HTTPS push providers. Cron has
a separate secret. Per-device compare-and-swap leases prevent simultaneous checks.
Expired subscriptions are removed; upstream failures retry on the next hourly check.
Quiet hours are 9 pm–9 am in the user's saved time zone.

## Activation (not yet completed)

The connected Supabase account cannot access `fycepbloyompgfqaoqvq`. Reauthorize the
Supabase connection using an account/organization with access to that project.
Browser GitHub sign-in succeeded on October 20, 2026. The project was paused;
Resume was requested and restoration is in progress. The plugin connection still
uses a different account. Do not create a replacement database: that would leave existing Spotify settings
and session data behind.

1. Apply `supabase/migrations/20261020210757_show_alerts.sql` to HeadTap. Run security
   advisors and verify anon/authenticated cannot read `headtap_show_alerts`.
2. Run `node scripts/generate-push-keys.mjs` once. It creates a gitignored `.env.push`
   with file mode 0600 and never prints secrets. Add a real contact address as
   `VAPID_SUBJECT=mailto:...`. Keep the private key stable and backed up privately.
3. Upload those environment variables to Supabase Edge Function secrets, preserving
   existing Spotify and Ticketmaster secrets. `APP_URL` and `ALLOWED_APP_URLS` must
   include the new hosted origin. Do not use the Figma origin as the new redirect.
4. Add the exact new origin to the Spotify app's allowed OAuth redirect URIs too.
   Existing frontend sign-in already sends `window.location.origin` to the server.
5. Deploy `show-alerts` with its relative dependency `src/utils/showAlerts.ts` and
   JWT verification disabled **only for this function**: it performs custom auth.
   Keep the existing main function's JWT configuration unchanged.
6. Store `headtap_project_url` and `headtap_show_alerts_cron_secret` in Supabase Vault
   using the same cron secret as the function. Run `supabase/schedule-show-alerts.sql`.
   Inspect cron runs and pg_net responses. Verify `/config` reports ready and an
   unauthenticated `/run` returns 401. Never include secrets in Git or client code.
7. Open the hosted address in iPhone Safari, Share → Add to Home Screen. Open the
   installed icon, connect Spotify, finish library loading, set Show alerts and tap
   Enable notifications. Tap Send test and confirm delivery on the actual phone.
8. Verify a controlled matching event through the scheduled worker, then verify a
   second check sends no duplicate and Turn off stops future sends. This end-to-end
   test remains pending until database access and a real device subscription exist.

## Hosting

The Sites deployment checkout is `.site/headtap` (gitignored), separate from this
GitHub repository. Its manifest preserves project ID
`appgprj_6ad7d8d860888191acc976dc1611705e`. Expected origin:
`https://headtap-music.henrydegrasse.chatgpt.site`.
It contains the built static app, no server secrets or user data. For subsequent
releases build this repository, refresh that checkout's dist directory, and use
the Sites source/package/publish workflow for the same project ID. Do not create
a new Site. Confirmed private deployment succeeded on October 20, 2026: version
`appgprj_6ad7d8d860888191acc976dc1611705e~appgver_4f75238a95d881919afb0619cc4b7244`.
The owner must sign in to ChatGPT to open it. Supabase and Spotify still need this
origin authorized before live sign-in works.

## Initial limits

- Ticketmaster coverage only. Artists match exact normalized attraction names;
  aliases and tribute acts are not guessed. Imported artist choices are a snapshot;
  update alerts after loading new music. The selection is not capped at 50.
- Searches cover 90 days and at most 1,000 nearby events. A visible coverage warning
  appears for larger results. Scheduled checks process two due devices per minute
  (120 devices/hour); use a proper queue before scaling beyond that.
- First check may notify about already-announced upcoming shows. Later checks use
  event IDs to avoid repeats. Last 5,000 notified IDs are retained per device.
- A digest includes one show summary and a count; the inbox stores up to 50 matches
  from the latest alert. No price-drop tracking, real-time inventory guarantee or
  promise of fee-inclusive pricing. Unknown prices are excluded with a budget.
- Provider acceptance is not proof of delivery. Crash after provider acceptance but
  before database persistence may retry a notification; stable tags collapse visible
  repeats where the browser supports them.
- A closed app works through server scheduling, not phone polling. Offline browsing
  only shows a reconnect screen. Logout does not cancel alerts; use Turn off first.

## Validation

`pnpm check` covers TypeScript, frontend/business-rule tests and the production build.
`pnpm dlx deno test --node-modules-dir=none --allow-env tests/backend.test.ts tests/pushWorker.test.ts`
covers existing backend behavior and new authentication/configuration boundaries.
The alert form has been inspected at 390px width without horizontal overflow.
Live database migration, scheduler and iPhone push delivery remain unverified.
