# HeadTap

React/Vite concert discovery app with Spotify and Supabase integration.
Original design: https://www.figma.com/design/oRDAQt2R0paBrruvc73mtl/HeadTap

## Run locally

Use Node.js 22+ and pnpm 11. Install with `pnpm install`, run with `pnpm dev`,
and verify production output with `pnpm build`. The app opens on port 3000.
The committed lockfile pins dependencies. Demo mode works without a backend.

## Backend configuration

Copy `.env.example` to `.env.local` and set the public project ID and anon key.
Never put a Supabase service-role key or Spotify client secret in Vite variables.
Existing Figma project settings remain the fallback for older deployments.
Restart Vite after changing environment variables.

The backend code is in `src/supabase/functions/server`. It requires a deployed
Supabase function named `make-server-a9c438e5`, its KV table, Spotify client
credentials, and a Ticketmaster API key for real events. See
`src/SUPABASE_BACKEND_GUIDE.md` for the original backend notes.
The current frontend uses the Spotify authorization-code callback at the app
origin and validates the returned state against this browser's sign-in attempt.
The same redirect URI must be registered in Spotify. The old `?session=` URL
shortcut is intentionally no longer accepted.

## Verified status — September 10, 2026

- GitHub main: `f13e232`; no GitHub Actions runs or GitHub deployments recorded.
- Published site: https://headtap.figma.site loads, but Spotify connection fails.
- Original Supabase host `fycepbloyompgfqaoqvq.supabase.co` fails DNS resolution.
  Whether the project was paused or deleted has not been established.
- Local production build passes. Demo music profile and six sample concerts render.
- Real Spotify login and live concert discovery remain blocked by backend availability.

First repair pass adds reproducible installs, environment overrides, callback
state verification, request timeouts, accurate failure reporting, explicit sample
labels, disabled sample ticket actions, and removes artificial demo delays.
These local changes have not been pushed or deployed.

## Repair pass 2

Run `pnpm check` for frontend type checking, 12 regression tests, and the production
build. With Deno 2 installed, run `pnpm test:backend` for 7 backend route tests and
backend type checking. GitHub Actions runs both checks after push.

Fixed expired-session recovery, profile retry UI, stale concert responses,
empty search/filter states, free and unknown prices, ticket budgets, past events,
and silent failures of all-time music requests. Dependency imports now use normal
package names, so TypeScript can resolve the same modules as Vite.

Backend changes remove invented concerts and IP/New York location fallbacks,
validate OAuth redirect destinations, disable the old unchecked callback, correct
Hono timeout handling, and expire music-profile caches after 24 hours.

### Restore the backend

1. Sign in at https://supabase.com/dashboard and locate project
   `fycepbloyompgfqaoqvq`. Determine whether it can be restored before creating anything.
2. With the intended project selected, review and apply
   `supabase/migrations/20260910000000_headtap_kv.sql`. It restricts the token table
   to the backend service role.
3. Configure server secrets from `supabase/.env.example` in Supabase. Keep all real
   secrets outside Git. `ALLOWED_APP_URLS` is a comma-separated exact allowlist;
   each intended callback origin must also be registered with Spotify.
4. Deploy the `make-server-a9c438e5` function using `supabase/config.toml` and the
   CLI entry point. JWT verification remains enabled. Frontend configuration
   expects the public legacy anon JWT, not a service-role key.
5. Set frontend project ID and public anon key in `.env.local`, rebuild, and test
   real login, expired-session recovery, music profile and live concert search.

The migration and backend changes have been tested locally but not applied to a
remote project. A real Spotify account and active Supabase/Ticketmaster settings
are still needed for integration verification. A passing local check does not
mean those external services have been restored.

References: [Supabase deployment](https://supabase.com/docs/guides/deployment),
[Hono timeout middleware](https://hono.dev/docs/middleware/builtin/timeout).

## Restoration verified — September 10, 2026

The user restored the existing Supabase project. Its authenticated health endpoint
now returns HTTP 200 and the live app reaches Spotify login. Spotify client ID and
secret are configured; Ticketmaster and news secret entries also remain present.
Real account login, token exchange, music data and concert search still need an
end-to-end check. No local code changes have been deployed yet.

## Faster discovery and clearer event cards

Music-profile requests run concurrently. Artist enrichment now uses one Spotify
search instead of search + top tracks + audio features, removing up to two requests
per uncached artist. Seven-day artist cache expiry is now enforced. This trades
optional audio-feature scoring for lower request latency; no live speed benchmark
has been run yet.

Event cards prefer matched Spotify artist images, then large Ticketmaster images,
with lazy loading and a designed fallback when images fail. Ambiguous artist
search results no longer silently use the first unrelated Spotify artist.
Superstar and discovery reasons are prioritized and wrap in full. Cards show
venue addresses, map links and straight-line miles from the resolved search point;
city searches use the geocoder's city point, not a user's home or driving route.
Missing coordinates never produce an invented distance. Demo cards omit distance.

Verified: frontend build/typecheck, 16 frontend/helper tests and 7 backend tests.
These changes require deployment of both frontend and backend before appearing on
the published Figma site.

## Typography and UI refresh

Implemented a quieter cream background, Poppins headings with system body text,
compact profile summary with expandable music DNA, labeled responsive location
form, native sort dropdown, and simplified concert cards with one price display.
Superstar and discovery explanations have separate headings. Primary controls are
44px tall, focus rings remain visible, and reduced-motion preferences are honored.

Validated profile expansion, location form submission, price sorting and demo
cards in the browser. No horizontal overflow at 390px or 320px widths. Frontend
check, all 16 frontend/helper tests and production build pass. Changes are local;
the Figma-hosted frontend has not been updated.

### Personality card correction

Restored the original orange gradient, personality tagline, and always-visible
music DNA and statistics at the user’s request. Information is no longer hidden
behind an expandable section. Type checking and production build pass.

### Profile loading and useful context

The profile now loads saved songs independently of its ranked artists and songs.
Library artist counts reuse that response instead of requesting a duplicate full
library scan. Top artists use one Spotify request for the top 50, with explicit
upstream error handling. Long-term switches show loading, and empty rankings have
explanations. Artist/song cards lazy-load artwork with an on-page fallback.

Added a profile refresh/time indicator, library retry, leading genre shares and
an explanation of the data behind the personality. The orange card and all its
existing details remain visible. Live latency has not been benchmarked; the
backend and frontend changes still need deployment.

### Full saved library coverage

Added a separate full-library browser for every available Liked Song, the artists
credited on those songs, and all returned artist genres. Search covers the full
loaded collection; UI pagination renders 50 rows at a time without dropping data.
Saved songs are fetched one page at a time and published progressively. Artist
details are fetched for unique library IDs without rescanning saved songs.
Missing metadata and interrupted loads remain explicitly labeled. Playlists and
complete listening history are not included in this view.

Verified 24 frontend/helper tests, 7 backend tests, typecheck and production build.
Tests cover 123 songs across three pages, artists beyond 50, genres beyond six,
partial request failures and invalid pagination. Demo browser renders library
counts. Full live coverage requires deploying the new paged backend endpoints.

### Discovery experience (no public engineering showcase)

Added evidence-backed concert explanations, a familiar-to-adventurous ranking
control, reversible artist feedback, saved concerts, and an accessible genre
connection explorer with related concert results. Ranking uses exact genre-set
similarity, familiarity and explicit feedback; explanations are deterministic.
This implementation does not claim neural embeddings, audio analysis or LLM
inference. Demo results include two explicitly fictional discovery examples.

Library imports checkpoint each completed page in IndexedDB and resume within
24 hours, checking the first page and total for changes before continuing song
offsets. Completed library snapshots are reused for 24 hours; Refresh profile
forces an import. Artist details also use a best-effort seven-day server cache.
Local preferences and saved events are scoped to the Spotify connection (demo
separately); they are not cross-device account storage. Reconnecting with a new
session starts a new local scope. Saved events are listing snapshots.

Browser verification covered selecting artist connections, navigation to
concerts, evidence panels, feedback reordering, saving across reload, keyboard
slider controls and 390px width without overflow. Tests cover ranking shifts,
unknown metadata, evidence contents, feedback demotion and checkpoint resume.
Frontend/backend deployment and live Spotify sync verification remain outstanding.
No evaluation dashboard or engineering showcase was added.

### Artist and genre constellation

Removed the full saved-song library browser from the profile. Library imports
still feed the artist data behind the scenes. The web now appears immediately
after the orange personality card and includes all loaded profile artists and
all normalized artist genres, with no 50-artist cap. Concert discovery examples
are not mixed into this personal taste view.

Canvas rendering provides a warm cream constellation with orange/amber genre hubs, curved
membership edges, hover/selection highlights, drag-to-pan and zoom buttons.
Artist selection reveals every shared-genre connection; genre selection reveals
member artists and overlapping genres counted by shared artists. Search and a
native selection control provide keyboard access to the same information.
Missing genre data remains visibly unconnected, and partial imports are labeled.
These are metadata connections rather than claims about audio similarity.

### Taste web removed

Removed the artist/genre web at the user’s request, including its component and
layout helpers. The full-library list remains hidden. Music profiles, library
syncing, concert recommendations, feedback and saved concerts remain available.

### Night-out planning

Added up to three distinct-artist recommendations above remaining results,
Friday–Sunday weekend presets, a 25-mile shortcut and a USD 50 budget preset.
Unknown prices and explicitly non-USD currencies cannot satisfy USD budgets.
Date-only events are interpreted as venue calendar dates, avoiding UTC day shifts.

Artist cards show source genre tags and evidence-backed “For fans of” links.
Verified artist IDs enable click-to-load Spotify artist embeds; a single active
embed is mounted across concert groups. No autoplay is requested. Spotify links
remain available if embedding or playback fails. Sample events do not play audio.
Reference: https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed

Saved shows have a comparison view with date, venue, price, original-search
travel distance, and same-date warnings. Matching current search results refresh
the visible snapshot; otherwise the ticket provider is linked for rechecking.
The profile retains its orange personality card and adds grounded short insights
and a direct concert CTA. Deeper music details are expandable.

Verified 34 frontend/helper tests, 7 backend tests, typecheck and build. Browser
checks cover recommendations, saving/comparison, weekend empty states and 390px
layout without overflow. Live backend health returned 200 on September 14, 2026.
Signed-in sync and actual embedded playback have not been verified with the
updated backend. Deployment is still required for new artist ID/currency fields.

### Usability simplification

Home now combines a compact orange personality summary with location search,
unified When/Distance/Budget controls, three recommended shows and remaining
results. My Music retains the full personality and deeper music details. Saved
is a single comparison destination, without duplicate concert cards or filters.

Cards expose one evidence summary with optional supporting details. Save and
Listen remain direct actions; taste feedback is inside Improve my matches.
The listening fallback is only shown when needed or the player is open.
Section navigation preserves component state and scroll positions, moves focus
to the active tab, and stops the current embedded player. Standard buttons have
44px touch targets. Empty filtered results offer a clear recovery action; failed
searches offer retry. This is implementation QA, not a usability-study result.

### Restore music-first organization

Compared the live Figma site on September 14: My Music opens first with the
personality/stats card, Top Artists and Top Songs; Concerts is separate. Restored
that order locally, retaining Saved as an additional destination. Removed the
extra MusicInsights section, the music-details disclosure and the compact Home
personality duplicate. Detailed music sections are visible without expansion.

### Planning-control redesign

Replaced date/distance dropdowns and the personalization disclosure/percentage
slider with visible choice buttons and three discovery cards: Familiar favorites,
A bit of both, and Something new. Budget presets retain a custom numeric option.
Selection outlines and pressed states expose current choices; advanced genre and
group-budget controls remain secondary. The music-first organization is unchanged.
