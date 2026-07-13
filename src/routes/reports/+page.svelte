<script lang="ts">
	import { resolve } from '$app/paths';
	import Statements from '$lib/components/Statements.svelte';

	let { data } = $props();
</script>

{#snippet exportLinks()}
	<a
		href={resolve('/export/[type]', { type: 'trial-balance' })}
		data-sveltekit-reload
		class="btn btn-ghost">Trial Balance CSV</a
	>
	<a
		href={resolve('/export/[type]', { type: 'balance-sheet' })}
		data-sveltekit-reload
		class="btn btn-ghost">Balance Sheet CSV</a
	>
	<a
		href={resolve('/export/[type]', { type: 'profit-loss' })}
		data-sveltekit-reload
		class="btn btn-ghost">P&amp;L CSV</a
	>
{/snippet}

<Statements
	entityName={data.entityName}
	trialBalance={data.trialBalance}
	profitAndLoss={data.profitAndLoss}
	balanceSheet={data.balanceSheet}
	{exportLinks}
/>
