<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatAda } from '$lib/money';
	import {
		ChevronRight,
		ChevronDown,
		Copy,
		Check,
		ExternalLink,
		ArrowUp,
		ArrowDown
	} from '@lucide/svelte';

	let { data, form } = $props();

	type Row = (typeof data.rows)[number];
	type SortKey = 'date' | 'sent' | 'received' | 'fee';

	let query = $state('');
	let direction = $state<'all' | 'sent' | 'received'>('all');
	let sortKey = $state<SortKey>('date');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let expanded = $state<number | null>(null);
	let copied = $state('');

	const ada = (lovelace: string) => formatAda(BigInt(lovelace), { decimals: 2 });

	function matches(r: Row, q: string) {
		if (r.hash.includes(q) || r.date.includes(q)) return true;
		if (r.tags.some((t) => t.includes(q))) return true;
		return r.counterparties.some((c) => c.label.toLowerCase().includes(q) || c.bech32.includes(q));
	}

	function sortValue(r: Row, key: SortKey): bigint {
		if (key === 'date') return BigInt(r.blockTime);
		if (key === 'sent') return BigInt(r.sent);
		if (key === 'received') return BigInt(r.received);
		return BigInt(r.fee);
	}

	const visible = $derived.by(() => {
		const q = query.trim().toLowerCase();
		let rows = data.rows.filter((r) => {
			if (direction === 'sent' && BigInt(r.sent) === 0n) return false;
			if (direction === 'received' && BigInt(r.received) === 0n) return false;
			return q ? matches(r, q) : true;
		});
		const dir = sortDir === 'asc' ? 1n : -1n;
		rows = [...rows].sort((a, b) => {
			const d = (sortValue(a, sortKey) - sortValue(b, sortKey)) * dir;
			return d > 0n ? 1 : d < 0n ? -1 : 0;
		});
		return rows;
	});

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'desc';
		}
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = text;
			setTimeout(() => (copied = copied === text ? '' : copied), 1200);
		} catch {
			/* clipboard unavailable */
		}
	}

	const directions = [
		{ id: 'all', label: 'All' },
		{ id: 'sent', label: 'Sent' },
		{ id: 'received', label: 'Received' }
	] as const;
</script>

{#snippet sortHead(key: SortKey, label: string, alignRight = false)}
	<th class="py-2 pr-3 font-medium" class:text-right={alignRight}>
		<button
			class="inline-flex items-center gap-1 hover:text-ink-900"
			class:flex-row-reverse={alignRight}
			onclick={() => toggleSort(key)}
		>
			<span>{label}</span>
			{#if sortKey === key}
				{#if sortDir === 'asc'}<ArrowUp size={13} />{:else}<ArrowDown size={13} />{/if}
			{/if}
		</button>
	</th>
{/snippet}

<div class="card p-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{#each data.wallets as w (w.id)}
				<span class="chip" title={w.bech32}>{w.name}</span>
			{/each}
			<a href={resolve('/')} class="text-sm font-medium text-ink-400 hover:text-ink-900"
				>+ Add wallet</a
			>
		</div>
		<div class="flex items-center gap-2">
			<form method="POST" action="?/sync" use:enhance>
				<button type="submit" class="btn btn-ghost">Sync</button>
			</form>
			<a href={resolve('/address-book')} class="btn btn-affirmative">Edit address book</a>
		</div>
	</div>

	{#if form?.message}
		<p class="mt-3 text-sm text-mercury-ink">{form.message}</p>
	{/if}

	<!-- Controls -->
	<div class="mt-5 flex flex-wrap items-center gap-3">
		<input
			class="input max-w-xs flex-1"
			placeholder="Search address, name, hash, tag…"
			bind:value={query}
		/>
		<div class="flex overflow-hidden rounded-md border border-ink-200">
			{#each directions as d (d.id)}
				<button
					class="px-3 py-1.5 text-sm font-medium"
					class:bg-ink-100={direction === d.id}
					class:text-ink-900={direction === d.id}
					class:text-ink-400={direction !== d.id}
					onclick={() => (direction = d.id)}
				>
					{d.label}
				</button>
			{/each}
		</div>
		<span class="text-sm text-ink-400">{visible.length} of {data.rows.length}</span>
	</div>

	<!-- Table -->
	<div class="mt-4 overflow-x-auto">
		<table class="w-full table-fixed text-sm">
			<colgroup>
				<col class="w-28" />
				<col />
				<col class="w-32" />
				<col class="w-32" />
				<col class="w-24" />
				<col class="w-56" />
				<col class="w-12" />
			</colgroup>
			<thead>
				<tr class="text-left text-ink-400">
					{@render sortHead('date', 'Date')}
					<th class="py-2 pr-3 font-medium">Description</th>
					{@render sortHead('sent', 'Sent', true)}
					{@render sortHead('received', 'Received', true)}
					{@render sortHead('fee', 'Fee', true)}
					<th class="py-2 pr-3 font-medium">Purpose</th>
					<th class="py-2 font-medium"></th>
				</tr>
			</thead>
			<tbody>
				{#each visible as row (row.id)}
					<tr class="border-t border-ink-100 align-top hover:bg-ink-100">
						<td class="mono py-2.5 pr-3 text-ink-600">{row.date}</td>
						<td class="py-2.5 pr-3">
							{#if row.counterparties.length === 0}
								<span class="text-ink-400">—</span>
							{:else}
								<span class="block truncate font-medium" title={row.counterparties[0].bech32}>
									{row.counterparties[0].label}
								</span>
								{#if row.counterparties.length > 1}
									<button
										class="text-xs text-ink-400 hover:text-ink-900"
										onclick={() => (expanded = expanded === row.id ? null : row.id)}
									>
										+{row.counterparties.length - 1} more
									</button>
								{/if}
							{/if}
							{#if row.tags.includes('withdrawal')}
								<span class="ml-1 text-xs text-mercury-ink">· reward</span>
							{/if}
						</td>
						<td class="mono py-2.5 pr-3 text-right text-neg">
							{BigInt(row.sent) > 0n ? ada(row.sent) : ''}
						</td>
						<td class="mono py-2.5 pr-3 text-right text-pos">
							{BigInt(row.received) > 0n ? ada(row.received) : ''}
						</td>
						<td class="mono py-2.5 pr-3 text-right text-ink-400">{ada(row.fee)}</td>
						<td class="py-2.5 pr-3">
							<form method="POST" action="?/categorize" use:enhance>
								<input type="hidden" name="transactionId" value={row.id} />
								<select
									class="select w-full"
									name="accountId"
									value={row.accountId}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each data.accountGroups as g (g.label)}
										<optgroup label={g.label}>
											{#each g.options as opt (opt.id)}
												<option value={opt.id} title={opt.path}>{opt.name}</option>
											{/each}
										</optgroup>
									{/each}
								</select>
							</form>
						</td>
						<td class="py-2.5">
							<button
								class="inline-flex items-center justify-center rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-900"
								aria-label="Toggle details"
								aria-expanded={expanded === row.id}
								onclick={() => (expanded = expanded === row.id ? null : row.id)}
							>
								{#if expanded === row.id}
									<ChevronDown size={18} />
								{:else}
									<ChevronRight size={18} />
								{/if}
							</button>
						</td>
					</tr>
					{#if expanded === row.id}
						<tr class="border-t border-ink-100 bg-surface-2">
							<td colspan="7" class="px-2 py-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<div class="min-w-0">
										<p class="eyebrow mb-1">Transaction</p>
										<p class="mono break-all text-xs text-ink-600">
											{row.hash}
										</p>
										<div class="mt-2 flex items-center gap-4 text-xs">
											<button
												class="inline-flex items-center gap-1 whitespace-nowrap text-mercury-ink"
												onclick={() => copy(row.hash)}
											>
												{#if copied === row.hash}
													<Check size={14} /> Copied
												{:else}
													<Copy size={14} /> Copy hash
												{/if}
											</button>
											<a
												class="inline-flex items-center gap-1 whitespace-nowrap text-mercury-ink"
												href={`${data.explorerBase}${row.hash}`}
												target="_blank"
												rel="external noreferrer"
											>
												<ExternalLink size={14} /> Explorer
											</a>
										</div>
										<p class="mt-2 text-xs text-ink-400">
											Net {ada(row.net)} ADA · fee {ada(row.fee)} ADA
											{#if row.tags.length}· {row.tags.join(', ')}{/if}
										</p>
									</div>
									<div class="min-w-0">
										<p class="eyebrow mb-1">
											Counterparties ({row.counterparties.length})
										</p>
										<ul class="space-y-1">
											{#each row.counterparties as c (c.bech32)}
												<li class="flex items-center gap-2">
													<span class="mono truncate text-xs" title={c.bech32}>
														{c.named ? c.label : c.bech32}
													</span>
													<button
														class="shrink-0 text-mercury-ink"
														aria-label="Copy address"
														onclick={() => copy(c.bech32)}
													>
														{#if copied === c.bech32}
															<Check size={14} />
														{:else}
															<Copy size={14} />
														{/if}
													</button>
												</li>
											{/each}
											{#if !row.counterparties.length}
												<li class="text-xs text-ink-400">
													No external counterparties (mint/burn).
												</li>
											{/if}
										</ul>
									</div>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
				{#if !visible.length}
					<tr>
						<td colspan="7" class="py-10 text-center text-ink-400">
							{data.rows.length
								? 'No transactions match your filters.'
								: "No transactions yet. Hit Sync to pull this wallet's history."}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<div class="mt-6 flex flex-wrap justify-end gap-3">
		<a href={resolve('/export/register')} data-sveltekit-reload class="btn btn-ghost"
			>Export register</a
		>
		<a href={resolve('/export/trial-balance')} data-sveltekit-reload class="btn btn-primary">
			Export Full Trial Balance
		</a>
		<a href={resolve('/reports')} class="btn btn-primary">Balance Sheet / P&amp;L</a>
	</div>
</div>
