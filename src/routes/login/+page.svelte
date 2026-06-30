<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data } = $props();
</script>

<svelte:head><title>Sign in · Mercury Financials</title></svelte:head>

<div class="mx-auto max-w-md">
	<div class="card p-8">
		<p class="eyebrow text-center">Mercury Financials</p>
		<h1 class="mt-1 text-center text-2xl font-bold">Sign in</h1>

		<form method="POST" use:enhance class="mt-6 space-y-3">
			<input
				class="input"
				name="email"
				type="email"
				placeholder="Email"
				value={form?.email ?? ''}
				autocomplete="email"
				required
			/>
			<input
				class="input"
				name="password"
				type="password"
				placeholder="Password"
				autocomplete="current-password"
				required
			/>
			{#if form?.message}
				<p class="text-sm text-neg">{form.message}</p>
			{/if}
			<button type="submit" class="btn btn-primary w-full">Sign in</button>
		</form>

		{#if data.signupsOpen}
			<p class="mt-4 text-center text-sm text-ink-400">
				No account? <a href="/signup" class="text-mercury-ink">Create one</a>
			</p>
		{/if}
	</div>
</div>
