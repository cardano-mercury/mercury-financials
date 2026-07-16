<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children, data } = $props();

	const nav = [
		{ href: '/transactions', label: 'Transactions' },
		{ href: '/address-book', label: 'Address book' },
		{ href: '/reports', label: 'Reports' },
		{ href: '/settings', label: 'Settings' }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col">
	{#if data.demoMode}
		<div class="demo-banner">
			<div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm">
				<span aria-hidden="true" class="text-lg leading-none">⚠</span>
				<p>
					<span class="font-bold uppercase tracking-wide">Shared demo instance.</span>
					The data here is public and shared by everyone who signs in. Anything you add or change is visible
					to others and may be wiped without notice. Do not enter anything private.
				</p>
			</div>
		</div>
	{/if}

	<header class="border-b border-ink-200 bg-surface">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
			<a href={resolve('/')} class="flex items-baseline gap-2">
				<span class="mono text-lg font-bold text-mercury">Mercury</span>
				<span class="eyebrow hidden sm:inline">Financials</span>
			</a>

			{#if data.user}
				{#if data.hasWallets}
					<nav class="flex items-center gap-1">
						{#each nav as item (item.href)}
							<a
								href={resolve(item.href)}
								class="rounded-md px-3 py-1.5 text-sm font-medium"
								class:text-ink-900={page.url.pathname.startsWith(item.href)}
								class:text-ink-400={!page.url.pathname.startsWith(item.href)}
							>
								{item.label}
							</a>
						{/each}
					</nav>
				{/if}

				<div class="flex items-center gap-3">
					<a href={resolve('/settings')} class="eyebrow hidden hover:text-ink-900 sm:block">
						{data.entityName}
					</a>
					<form method="POST" action="/signout">
						<button type="submit" class="text-sm text-ink-400 hover:text-ink-900">Sign out</button>
					</form>
				</div>
			{:else}
				<nav class="flex items-center gap-2 text-sm">
					<a
						href={resolve('/login')}
						class="rounded-md px-3 py-1.5 font-medium text-ink-600 hover:text-ink-900"
					>
						Sign in
					</a>
					{#if data.signupsOpen}
						<a href={resolve('/signup')} class="btn btn-primary">Get started</a>
					{/if}
				</nav>
			{/if}
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-ink-200 bg-surface">
		<div
			class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between"
		>
			<span>Mercury: Financials, a Catalyst proof of concept.</span>
			<span class="mono text-xs">Apache 2.0</span>
		</div>
	</footer>
</div>
