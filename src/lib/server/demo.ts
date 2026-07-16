import { env } from '$env/dynamic/private';

/**
 * Marks this instance as a shared, public demo. The app is single-entity by design (one set of
 * wallets and books, no per-user isolation), so a hosted instance that lets several people sign in
 * is a shared sandbox: everyone sees and can edit the same data. `DEMO_MODE=true` surfaces that with
 * a prominent banner on every page so nobody mistakes it for their own private books.
 *
 * It is off by default, so a private instance run by an actual CFO never shows the banner. This flag
 * no longer serves a separate read-only `/demo` page; that was removed. Real multi-tenancy (issue
 * #21) would make this flag unnecessary; a daily reset of the shared data is proposed in #22.
 *
 * Deliberately not named `PUBLIC_DEMO`: SvelteKit reserves the `PUBLIC_` prefix for variables it
 * exposes to the browser, and `$env/dynamic/private` therefore refuses to read them.
 */
export function demoModeEnabled(): boolean {
	return (env.DEMO_MODE ?? 'false').toLowerCase() === 'true';
}
