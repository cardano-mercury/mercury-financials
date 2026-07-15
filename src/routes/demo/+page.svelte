<script lang="ts">
	import { resolve } from '$app/paths';
	import Statements from '$lib/components/Statements.svelte';

	let { data } = $props();

	const steps = [
		{
			title: 'Add a wallet',
			body: 'Paste a Cardano address or a $handle, or connect a browser wallet.'
		},
		{
			title: 'Sync from the chain',
			body: 'Blockfrost pulls the full transaction history and derives per-counterparty flows.'
		},
		{
			title: 'Categorise',
			body: 'Map each transaction to the chart of accounts, with sensible defaults to start.'
		},
		{
			title: 'Report and export',
			body: 'Read the Trial Balance, Balance Sheet and P&L, then export any of them as CSV.'
		}
	];
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
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="eyebrow">Public demo</p>
			<h1 class="mt-1 text-2xl font-bold">Real on-chain data, read-only</h1>
			<p class="mt-2 max-w-3xl text-sm text-ink-600">
				These statements are derived from a real Cardano wallet's transaction history, pulled from
				the chain and categorised against a chart of accounts. Everything below is live output from
				the tool. Nothing here is editable.
			</p>
		</div>
		<a href={resolve('/login')} class="btn btn-primary whitespace-nowrap">Connect your wallet</a>
	</div>

	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each steps as step, i (step.title)}
			<div class="rounded-lg border border-ink-200 bg-canvas p-4">
				<span class="chip mono text-xs">Step {i + 1}</span>
				<p class="mt-2 text-sm font-semibold text-ink-900">{step.title}</p>
				<p class="mt-1 text-sm text-ink-600">{step.body}</p>
			</div>
		{/each}
	</div>

	<p class="mt-6 max-w-3xl text-sm text-ink-600">
		Sign in to connect your own wallet, categorise its transactions, and export your own books. The
		statements below are the finished product; use the tabs to move between the Balance Sheet,
		Profit &amp; Loss, and Trial Balance, or export any of them as CSV.
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
