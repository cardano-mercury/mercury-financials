<script lang="ts">
	import { resolve } from '$app/paths';
	import Statements from '$lib/components/Statements.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Mercury: Financials — public demo</title>
	<meta
		name="description"
		content="A Cardano wallet's on-chain history, structured into a Trial Balance, Balance Sheet, and Profit and Loss statement."
	/>
</svelte:head>

{#snippet exportLinks()}
	<a
		href={resolve('/demo/export/[type]', { type: 'trial-balance' })}
		data-sveltekit-reload
		class="btn btn-ghost">Trial Balance CSV</a
	>
	<a
		href={resolve('/demo/export/[type]', { type: 'balance-sheet' })}
		data-sveltekit-reload
		class="btn btn-ghost">Balance Sheet CSV</a
	>
	<a
		href={resolve('/demo/export/[type]', { type: 'profit-loss' })}
		data-sveltekit-reload
		class="btn btn-ghost">P&amp;L CSV</a
	>
	<a
		href={resolve('/demo/export/[type]', { type: 'register' })}
		data-sveltekit-reload
		class="btn btn-ghost">Transaction register CSV</a
	>
{/snippet}

<div class="card mb-6 p-6">
	<p class="eyebrow">Public demo</p>
	<h1 class="mt-1 text-2xl font-bold">Real on-chain data, read-only</h1>
	<p class="mt-2 max-w-3xl text-sm text-ink-600">
		These statements are derived from a real Cardano wallet's transaction history, pulled from the
		chain and categorised against a chart of accounts. Nothing here is editable. To connect your own
		wallet, categorise its transactions, and export your own books,
		<a href={resolve('/login')} class="text-mercury-ink underline">sign in</a>.
	</p>
	<p class="mt-3 max-w-3xl text-xs text-ink-400">
		A Catalyst proof of concept. It reads on-chain data only: no fiat conversion, no oracle pricing,
		and figures are denominated in ADA. Statements produced here need review by a qualified
		accountant before they are used for anything.
	</p>
</div>

<Statements
	entityName={data.entityName}
	trialBalance={data.trialBalance}
	profitAndLoss={data.profitAndLoss}
	balanceSheet={data.balanceSheet}
	{exportLinks}
/>
