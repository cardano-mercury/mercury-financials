<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<div class="card p-8">
	<p class="eyebrow text-center">Address Book</p>
	<h1 class="mt-1 text-center text-2xl font-bold">Name the parties you deal with</h1>

	{#if form?.ok}
		<p class="mt-3 text-center text-sm text-mercury-ink">Saved.</p>
	{/if}

	<form method="POST" use:enhance class="mt-8 space-y-3">
		{#each data.addresses as a (a.id)}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
				<div class="chip justify-self-start" title={a.bech32}>
					{a.short}
					{#if a.isOwn}<span class="text-mercury-ink">· wallet</span>{/if}
				</div>
				<input class="input" name="name_{a.id}" placeholder="Name" value={a.name} />
				<input
					class="input"
					name="description_{a.id}"
					placeholder="Description (e.g. Employee)"
					value={a.description}
				/>
			</div>
		{/each}

		{#if !data.addresses.length}
			<p class="py-8 text-center text-ink-400">
				Counterparties show up here once you sync a wallet's transactions.
			</p>
		{/if}

		<div class="flex justify-end pt-4">
			<button type="submit" class="btn btn-primary">Save</button>
		</div>
	</form>
</div>
