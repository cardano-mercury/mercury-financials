<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const options = $derived([...data.accounts, ...data.internalTransfer]);
</script>

<div class="card p-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{#each data.wallets as w (w.id)}
				<span class="chip" title={w.bech32}>{w.name}</span>
			{/each}
			<a href="/" class="text-sm font-medium text-ink-400 hover:text-ink-900">+ Add wallet</a>
		</div>
		<div class="flex items-center gap-2">
			<form method="POST" action="?/sync" use:enhance>
				<button type="submit" class="btn btn-ghost">Sync</button>
			</form>
			<a href="/address-book" class="btn btn-affirmative">Edit address book</a>
		</div>
	</div>

	{#if form?.message}
		<p class="mt-3 text-sm text-mercury-ink">{form.message}</p>
	{/if}

	<div class="mt-6 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="text-left text-ink-400">
					<th class="py-2 pr-3 font-medium">#</th>
					<th class="py-2 pr-3 font-medium">Description</th>
					<th class="py-2 pr-3 font-medium">Tx Hash</th>
					<th class="py-2 pr-3 font-medium">Date</th>
					<th class="py-2 pr-3 text-right font-medium">Sent</th>
					<th class="py-2 pr-3 text-right font-medium">Received</th>
					<th class="py-2 pr-3 font-medium">Purpose</th>
					<th class="py-2 pr-3 text-right font-medium">Fee</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row, i (row.id)}
					<tr class="border-t border-ink-100 hover:bg-ink-100">
						<td class="py-2.5 pr-3 text-ink-400">{data.rows.length - i}</td>
						<td class="py-2.5 pr-3 font-medium">{row.counterparty}</td>
						<td class="mono py-2.5 pr-3 text-ink-600">{row.hashShort}</td>
						<td class="mono py-2.5 pr-3 text-ink-600">{row.date}</td>
						<td class="mono py-2.5 pr-3 text-right text-neg">{row.sent}</td>
						<td class="mono py-2.5 pr-3 text-right text-pos">{row.received}</td>
						<td class="py-2.5 pr-3">
							<form method="POST" action="?/categorize" use:enhance>
								<input type="hidden" name="transactionId" value={row.id} />
								<select
									class="select"
									name="accountId"
									value={row.accountId}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each options as opt (opt.id)}
										<option value={opt.id}>{opt.path}</option>
									{/each}
								</select>
							</form>
						</td>
						<td class="mono py-2.5 pr-3 text-right text-ink-400">{row.fee}</td>
					</tr>
				{/each}
				{#if !data.rows.length}
					<tr>
						<td colspan="8" class="py-10 text-center text-ink-400">
							No transactions yet. Hit Sync to pull this wallet's history.
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<div class="mt-6 flex flex-wrap justify-end gap-3">
		<a href="/export/register" data-sveltekit-reload class="btn btn-ghost">Export register</a>
		<a href="/export/trial-balance" data-sveltekit-reload class="btn btn-primary">
			Export Full Trial Balance
		</a>
		<a href="/reports" class="btn btn-primary">Balance Sheet / P&amp;L</a>
	</div>
</div>
