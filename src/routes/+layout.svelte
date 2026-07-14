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

<div class="min-h-screen">
	<header class="border-b border-ink-200 bg-surface">
		<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
			<a href={resolve('/')} class="mono text-lg font-bold text-mercury">Mercury</a>

			{#if data.user && data.hasWallets}
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

			{#if data.user}
				<div class="flex items-center gap-3">
					<a href={resolve('/settings')} class="eyebrow hidden hover:text-ink-900 sm:block">
						{data.entityName}
					</a>
					<form method="POST" action="/signout">
						<button type="submit" class="text-sm text-ink-400 hover:text-ink-900">Sign out</button>
					</form>
				</div>
			{/if}
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8">
		{@render children()}
	</main>
</div>
