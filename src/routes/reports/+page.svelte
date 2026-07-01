<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();

	let tab = $state<'tb' | 'bs' | 'pl'>('bs');

	const tabs = [
		{ id: 'bs', label: 'Balance Sheet' },
		{ id: 'pl', label: 'Profit & Loss' },
		{ id: 'tb', label: 'Trial Balance' }
	] as const;
</script>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div class="flex gap-1">
		{#each tabs as t (t.id)}
			<button
				class="rounded-md px-3 py-1.5 text-sm font-medium"
				class:bg-surface={tab === t.id}
				class:text-ink-900={tab === t.id}
				class:text-ink-400={tab !== t.id}
				onclick={() => (tab = t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>
	<div class="flex gap-2">
		<a href={resolve('/export/trial-balance')} data-sveltekit-reload class="btn btn-ghost"
			>Trial Balance CSV</a
		>
		<a href={resolve('/export/balance-sheet')} data-sveltekit-reload class="btn btn-ghost"
			>Balance Sheet CSV</a
		>
		<a href={resolve('/export/profit-loss')} data-sveltekit-reload class="btn btn-ghost"
			>P&amp;L CSV</a
		>
	</div>
</div>

<div class="card p-8">
	<p class="eyebrow">{data.entityName}</p>

	{#if tab === 'bs'}
		<h1 class="text-xl font-bold">Balance Sheet</h1>
		<table class="mono mt-5 w-full text-sm">
			<tbody>
				<tr><td class="py-2 font-bold uppercase">Assets</td><td></td></tr>
				{#each data.balanceSheet.assets as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total assets</td><td class="py-2 text-right"
						>{data.balanceSheet.totalAssets}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Equity</td><td></td></tr>
				{#each data.balanceSheet.equity as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr
					><td class="py-1 pl-4 text-ink-600">Profit / (loss) for the period</td><td
						class="py-1 text-right">{data.balanceSheet.periodResult}</td
					></tr
				>
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total equity</td><td class="py-2 text-right"
						>{data.balanceSheet.totalEquity}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Liabilities</td><td></td></tr>
				{#each data.balanceSheet.liabilities as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total liabilities</td><td class="py-2 text-right"
						>{data.balanceSheet.totalLiabilities}</td
					>
				</tr>
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Total equity and liabilities</td>
					<td class="py-2 text-right">{data.balanceSheet.totalEquityAndLiabilities}</td>
				</tr>
			</tbody>
		</table>
	{:else if tab === 'pl'}
		<h1 class="text-xl font-bold">Statement of Profit and Loss</h1>
		<table class="mono mt-5 w-full text-sm">
			<tbody>
				<tr><td class="py-2 font-bold uppercase">Income</td><td></td></tr>
				{#each data.profitAndLoss.income as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total income</td><td class="py-2 text-right"
						>{data.profitAndLoss.totalIncome}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Expenses</td><td></td></tr>
				{#each data.profitAndLoss.expenses as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total expenses</td><td class="py-2 text-right"
						>{data.profitAndLoss.totalExpenses}</td
					>
				</tr>
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Profit before tax</td><td class="py-2 text-right"
						>{data.profitAndLoss.profitBeforeTax}</td
					>
				</tr>
				{#each data.profitAndLoss.tax as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Profit for the period</td><td class="py-2 text-right"
						>{data.profitAndLoss.profitForPeriod}</td
					>
				</tr>
			</tbody>
		</table>
	{:else}
		<h1 class="text-xl font-bold">Trial Balance</h1>
		<table class="mono mt-5 w-full text-sm">
			<thead>
				<tr class="text-left text-ink-400">
					<th class="py-2 font-medium">Account</th>
					<th class="py-2 text-right font-medium">Debit</th>
					<th class="py-2 text-right font-medium">Credit</th>
				</tr>
			</thead>
			<tbody>
				{#each data.trialBalance.rows as r (r.name)}
					<tr class="border-t border-ink-100">
						<td class="py-1.5 pr-3 text-ink-600">{r.name}</td>
						<td class="py-1.5 text-right">{r.debit}</td>
						<td class="py-1.5 text-right">{r.credit}</td>
					</tr>
				{/each}
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Total</td>
					<td class="py-2 text-right">{data.trialBalance.totalDebit}</td>
					<td class="py-2 text-right">{data.trialBalance.totalCredit}</td>
				</tr>
			</tbody>
		</table>
	{/if}
</div>
