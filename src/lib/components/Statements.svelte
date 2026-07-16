<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The Trial Balance / Balance Sheet / P&L tables, rendered by the /reports page.
	 *
	 * The export links are a caller-supplied snippet rather than a prop because resolve() needs a
	 * literal route id at the call site.
	 */
	interface Line {
		name: string;
		amount: string;
	}

	interface Props {
		entityName: string;
		trialBalance: {
			rows: { name: string; debit: string; credit: string }[];
			totalDebit: string;
			totalCredit: string;
		};
		profitAndLoss: {
			income: Line[];
			expenses: Line[];
			tax: Line[];
			totalIncome: string;
			totalExpenses: string;
			profitBeforeTax: string;
			profitForPeriod: string;
		};
		balanceSheet: {
			assets: Line[];
			equity: Line[];
			liabilities: Line[];
			periodResult: string;
			totalAssets: string;
			totalEquity: string;
			totalLiabilities: string;
			totalEquityAndLiabilities: string;
		};
		/** The CSV export buttons, rendered into the toolbar beside the statement tabs. */
		exportLinks: Snippet;
	}

	let { entityName, trialBalance, profitAndLoss, balanceSheet, exportLinks }: Props = $props();

	let tab = $state<'tb' | 'bs' | 'pl'>('bs');

	const tabs = [
		{ id: 'bs', label: 'Balance Sheet' },
		{ id: 'pl', label: 'Profit & Loss' },
		{ id: 'tb', label: 'Trial Balance' }
	] as const;
</script>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<div class="inline-flex gap-1 rounded-lg border border-ink-200 bg-ink-100 p-1" role="tablist">
		{#each tabs as t (t.id)}
			<button
				role="tab"
				aria-selected={tab === t.id}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
				class:bg-surface={tab === t.id}
				class:text-ink-900={tab === t.id}
				class:shadow-sm={tab === t.id}
				class:text-ink-400={tab !== t.id}
				class:hover:text-ink-600={tab !== t.id}
				onclick={() => (tab = t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2">
		{@render exportLinks()}
	</div>
</div>

<div class="card p-8">
	<p class="eyebrow">{entityName}</p>

	{#if tab === 'bs'}
		<h1 class="text-xl font-bold">Balance Sheet</h1>
		<table class="mono mt-5 w-full text-sm">
			<tbody>
				<tr><td class="py-2 font-bold uppercase">Assets</td><td></td></tr>
				{#each balanceSheet.assets as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total assets</td><td class="py-2 text-right"
						>{balanceSheet.totalAssets}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Equity</td><td></td></tr>
				{#each balanceSheet.equity as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr
					><td class="py-1 pl-4 text-ink-600">Profit / (loss) for the period</td><td
						class="py-1 text-right">{balanceSheet.periodResult}</td
					></tr
				>
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total equity</td><td class="py-2 text-right"
						>{balanceSheet.totalEquity}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Liabilities</td><td></td></tr>
				{#each balanceSheet.liabilities as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total liabilities</td><td class="py-2 text-right"
						>{balanceSheet.totalLiabilities}</td
					>
				</tr>
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Total equity and liabilities</td>
					<td class="py-2 text-right">{balanceSheet.totalEquityAndLiabilities}</td>
				</tr>
			</tbody>
		</table>
	{:else if tab === 'pl'}
		<h1 class="text-xl font-bold">Statement of Profit and Loss</h1>
		<table class="mono mt-5 w-full text-sm">
			<tbody>
				<tr><td class="py-2 font-bold uppercase">Income</td><td></td></tr>
				{#each profitAndLoss.income as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total income</td><td class="py-2 text-right"
						>{profitAndLoss.totalIncome}</td
					>
				</tr>
				<tr><td class="pt-4 font-bold uppercase">Expenses</td><td></td></tr>
				{#each profitAndLoss.expenses as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Total expenses</td><td class="py-2 text-right"
						>{profitAndLoss.totalExpenses}</td
					>
				</tr>
				<tr class="border-t border-ink-200 font-semibold">
					<td class="py-2">Profit before tax</td><td class="py-2 text-right"
						>{profitAndLoss.profitBeforeTax}</td
					>
				</tr>
				{#each profitAndLoss.tax as l (l.name)}
					<tr
						><td class="py-1 pl-4 text-ink-600">{l.name}</td><td class="py-1 text-right"
							>{l.amount}</td
						></tr
					>
				{/each}
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Profit for the period</td><td class="py-2 text-right"
						>{profitAndLoss.profitForPeriod}</td
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
				{#each trialBalance.rows as r (r.name)}
					<tr class="border-t border-ink-100">
						<td class="py-1.5 pr-3 text-ink-600">{r.name}</td>
						<td class="py-1.5 text-right">{r.debit}</td>
						<td class="py-1.5 text-right">{r.credit}</td>
					</tr>
				{/each}
				<tr class="border-t-2 border-ink-900 font-bold">
					<td class="py-2">Total</td>
					<td class="py-2 text-right">{trialBalance.totalDebit}</td>
					<td class="py-2 text-right">{trialBalance.totalCredit}</td>
				</tr>
			</tbody>
		</table>
	{/if}
</div>
