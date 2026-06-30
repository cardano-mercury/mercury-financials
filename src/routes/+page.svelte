<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';

	let { form } = $props();

	let name = $state('');
	let address = $state('');
	let availableWallets = $state<{ name: string; icon: string }[]>([]);
	let connecting = $state('');

	onMount(async () => {
		if (!browser) return;
		try {
			const { BrowserWallet } = await import('@meshsdk/core');
			availableWallets = await BrowserWallet.getAvailableWallets();
		} catch {
			availableWallets = [];
		}
	});

	async function connect(walletName: string) {
		connecting = walletName;
		try {
			const { BrowserWallet } = await import('@meshsdk/core');
			const wallet = await BrowserWallet.enable(walletName);
			address = await wallet.getChangeAddress();
			if (!name) name = walletName.charAt(0).toUpperCase() + walletName.slice(1);
		} catch {
			// Leave the field for manual entry if the connect was cancelled or failed.
		} finally {
			connecting = '';
		}
	}
</script>

<div class="mx-auto max-w-md">
	<div class="card p-8">
		<p class="eyebrow text-center">Mercury: Financials &amp; TB Export</p>
		<h1 class="mt-1 text-center text-2xl font-bold">Connect a wallet to get started</h1>

		{#if availableWallets.length}
			<div class="mt-6 grid grid-cols-2 gap-3">
				{#each availableWallets as w (w.name)}
					<button
						type="button"
						class="btn btn-ghost"
						disabled={connecting === w.name}
						onclick={() => connect(w.name)}
					>
						{#if w.icon}<img src={w.icon} alt="" class="h-5 w-5" />{/if}
						<span class="capitalize">{w.name}</span>
					</button>
				{/each}
			</div>
			<div class="my-5 flex items-center gap-3 text-ink-400">
				<span class="h-px flex-1 bg-ink-200"></span>
				<span class="text-xs">OR</span>
				<span class="h-px flex-1 bg-ink-200"></span>
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-3">
			<input class="input" name="name" placeholder="Wallet name" bind:value={name} required />
			<input
				class="input mono"
				name="address"
				placeholder="Wallet address or $handle"
				bind:value={address}
				required
			/>
			{#if form?.message}
				<p class="text-sm text-neg">{form.message}</p>
			{/if}
			<button type="submit" class="btn btn-primary w-full">Add wallet</button>
		</form>
	</div>
	<p class="mt-4 text-center text-sm text-ink-400">
		Add more wallets any time. Reports consolidate across all of them.
	</p>
</div>
