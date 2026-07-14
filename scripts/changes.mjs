#!/usr/bin/env node
/**
 * Change fragments, so that concurrent branches never fight over CHANGELOG.md.
 *
 * Every pull request drops one small file in `.changes/unreleased/`. Because each PR writes a new
 * file rather than editing a shared one, two branches in flight cannot conflict: the thing that
 * would collide (the changelog entry, and the version number) is not written until release.
 *
 * A fragment declares how far the version has to move:
 *
 *   ---
 *   bump: minor
 *   type: Added
 *   ---
 *   A dropdown for re-categorising a transaction.
 *
 * At release, `assemble` takes the largest bump across the pending fragments, works out the next
 * version, writes CHANGELOG.md and package.json, and deletes the fragments.
 *
 * Commands:
 *   add <bump> <type> <slug> "<text>"   write a fragment
 *   check                               validate the pending fragments (CI)
 *   preview                             what would be released, and as what version
 *   assemble                            apply it: bump package.json, write CHANGELOG, clear fragments
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, '.changes', 'unreleased');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const PKG = path.join(ROOT, 'package.json');

const BUMPS = ['patch', 'minor', 'major'];
// Keep a Changelog's categories, in the order they should appear under a version heading.
const TYPES = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

const die = (msg) => {
	console.error(`error: ${msg}`);
	process.exit(1);
};

function fragments() {
	if (!fs.existsSync(DIR)) return [];
	return fs
		.readdirSync(DIR)
		.filter((f) => f.endsWith('.md'))
		.sort()
		.map((file) => {
			const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
			const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
			if (!m) die(`${file}: missing the --- frontmatter block`);

			const meta = Object.fromEntries(
				m[1]
					.split(/\r?\n/)
					.filter(Boolean)
					.map((line) => {
						const i = line.indexOf(':');
						if (i === -1) die(`${file}: cannot parse frontmatter line "${line}"`);
						return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
					})
			);

			const bump = (meta.bump ?? '').toLowerCase();
			if (!BUMPS.includes(bump)) die(`${file}: bump must be one of ${BUMPS.join(', ')}`);

			const type = meta.type ?? '';
			if (!TYPES.includes(type)) die(`${file}: type must be one of ${TYPES.join(', ')}`);

			const body = m[2].trim();
			if (!body) die(`${file}: the body is empty. Say what changed.`);

			return { file, bump, type, body };
		});
}

const readPkg = () => JSON.parse(fs.readFileSync(PKG, 'utf8'));

/** The next version: the largest bump wins, applied to the current version. */
function nextVersion(current, bumps) {
	const [maj, min, pat] = current.split('.').map(Number);
	if (![maj, min, pat].every(Number.isInteger))
		die(`package.json version "${current}" is not semver`);

	const level = BUMPS[Math.max(...bumps.map((b) => BUMPS.indexOf(b)))];

	// Pre-1.0, a breaking change is not allowed to silently mint 1.0.0: that version is reserved for
	// the POC delivery, so a `major` fragment moves the minor instead. Bump to 1.0.0 deliberately.
	if (maj === 0 && level === 'major') return `0.${min + 1}.0`;

	if (level === 'major') return `${maj + 1}.0.0`;
	if (level === 'minor') return `${maj}.${min + 1}.0`;
	return `${maj}.${min}.${pat + 1}`;
}

function renderSection(version, frags, date) {
	const lines = [`## [${version}] - ${date}`, ''];
	for (const type of TYPES) {
		const hits = frags.filter((f) => f.type === type);
		if (!hits.length) continue;
		lines.push(`### ${type}`, '');
		for (const f of hits) {
			// A fragment body may be several lines. Render it as one bullet, indenting continuations.
			const [first, ...rest] = f.body.split(/\r?\n/);
			lines.push(`- ${first.replace(/^[-*]\s*/, '')}`);
			for (const line of rest) lines.push(line.trim() ? `  ${line.trim()}` : '');
		}
		lines.push('');
	}
	return lines.join('\n').trimEnd() + '\n';
}

const cmd = process.argv[2];

if (cmd === 'add') {
	const [, , , bump, type, slug, ...text] = process.argv;
	const body = text.join(' ').trim();
	if (!bump || !type || !slug || !body) {
		die(
			'usage: npm run change -- <patch|minor|major> <Added|Changed|Fixed|...> <slug> "<text>"'
		);
	}
	if (!BUMPS.includes(bump)) die(`bump must be one of ${BUMPS.join(', ')}`);
	const Type = type[0].toUpperCase() + type.slice(1).toLowerCase();
	if (!TYPES.includes(Type)) die(`type must be one of ${TYPES.join(', ')}`);

	fs.mkdirSync(DIR, { recursive: true });
	const file = path.join(DIR, `${slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.md`);
	fs.writeFileSync(file, `---\nbump: ${bump}\ntype: ${Type}\n---\n\n${body}\n`);
	console.log(`wrote ${path.relative(ROOT, file)}`);
} else if (cmd === 'check') {
	const frags = fragments();
	if (!frags.length) {
		console.log('no pending change fragments');
		process.exit(0);
	}
	const version = nextVersion(
		readPkg().version,
		frags.map((f) => f.bump)
	);
	console.log(
		`${frags.length} pending fragment(s), all valid. Next version would be ${version}.`
	);
} else if (cmd === 'preview') {
	const frags = fragments();
	if (!frags.length) {
		console.log('nothing to release');
		process.exit(0);
	}
	const version = nextVersion(
		readPkg().version,
		frags.map((f) => f.bump)
	);
	console.log(renderSection(version, frags, new Date().toISOString().slice(0, 10)));
} else if (cmd === 'assemble') {
	const frags = fragments();
	if (!frags.length) die('nothing to release: no fragments in .changes/unreleased/');

	const pkg = readPkg();
	const version = nextVersion(
		pkg.version,
		frags.map((f) => f.bump)
	);
	// The date is passed in by CI so the changelog, the tag and the release agree.
	const date = process.argv[3] ?? new Date().toISOString().slice(0, 10);

	const changelog = fs.readFileSync(CHANGELOG, 'utf8');
	const anchor = '<!-- new releases go here -->';
	if (!changelog.includes(anchor)) die(`CHANGELOG.md is missing the "${anchor}" marker`);
	fs.writeFileSync(
		CHANGELOG,
		changelog.replace(anchor, `${anchor}\n\n${renderSection(version, frags, date)}`)
	);

	pkg.version = version;
	fs.writeFileSync(PKG, JSON.stringify(pkg, null, '\t') + '\n');

	for (const f of frags) fs.unlinkSync(path.join(DIR, f.file));

	console.log(version);
} else {
	die('usage: changes.mjs <add|check|preview|assemble>');
}
