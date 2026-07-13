import { env } from '$env/dynamic/private';

/**
 * The hosted Catalyst demo (demo-financials.cardano-mercury.com) needs reviewers to see real,
 * populated statements without an account. `DEMO_MODE=true` opens an unauthenticated, read-only
 * view of the instance's reports at /demo, plus their CSV exports.
 *
 * Read-only is the whole point: /demo never exposes a write action, and nothing under it can sync,
 * re-categorise, rename, or add a wallet. It is off by default, so a private instance run by an
 * actual CFO does not accidentally publish its books.
 *
 * Deliberately not named `PUBLIC_DEMO`: SvelteKit reserves the `PUBLIC_` prefix for variables it
 * exposes to the browser, and `$env/dynamic/private` therefore refuses to read them.
 */
export function demoModeEnabled(): boolean {
	return (env.DEMO_MODE ?? 'false').toLowerCase() === 'true';
}
