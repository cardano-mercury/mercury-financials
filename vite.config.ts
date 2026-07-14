import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			typescript: {
				config: (config) => ({
					...config,
					include: [...config.include, '../drizzle.config.ts']
				})
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],

			// The logic-bearing modules: money formatting, the eUTxO parser, the ledger and report
			// engine, the default categoriser, and the CSV exporters. Routes, the Drizzle schema, the
			// Blockfrost client and the queue wiring are excluded because they are declarative or are
			// I/O, and a unit test of them would assert that a mock was called.
			include: [
				'src/lib/money.ts',
				'src/lib/server/accounts.ts',
				'src/lib/server/reports.ts',
				'src/lib/server/ingest/parse.ts',
				'src/lib/server/export/csv.ts'
			],

			// A ratchet, set at what the suite actually achieves, so a regression fails rather than
			// being noticed later. It is not core's 100%, and the gap is honest: accounts.ts and
			// reports.ts each mix pure logic with functions that need a live Postgres, and those are
			// exercised by driving the app against a real database rather than by a unit test. Raise
			// these numbers when you raise the coverage; never lower them to make a build pass.
			thresholds: {
				statements: 83,
				branches: 73,
				functions: 74,
				lines: 84
			}
		}
	}
});
