<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<div class="card mx-auto max-w-xl p-8">
	<p class="eyebrow text-center">Settings</p>
	<h1 class="mt-1 text-center text-2xl font-bold">Who are these statements for?</h1>
	<p class="mt-2 text-center text-sm text-ink-400">
		This name prints at the top of the Trial Balance, Balance Sheet, P&amp;L, and every CSV
		export.
	</p>

	<form method="POST" use:enhance class="mt-8 space-y-4">
		<div>
			<label class="eyebrow block" for="entityName">Entity or person name</label>
			<input
				id="entityName"
				name="entityName"
				class="input mt-1 w-full"
				placeholder="Acme Foundation"
				value={form?.entityName ?? data.entityName}
				required
			/>
		</div>

		{#if form?.message}
			<p class="text-sm text-neg">{form.message}</p>
		{:else if form?.ok}
			<p class="text-sm text-mercury-ink">Saved.</p>
		{/if}

		<div class="flex justify-end">
			<button type="submit" class="btn btn-primary">Save</button>
		</div>
	</form>
</div>
