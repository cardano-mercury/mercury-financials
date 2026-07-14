<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { form } = $props();
</script>

<svelte:head><title>Create account · Mercury Financials</title></svelte:head>

<div class="mx-auto max-w-md">
	<div class="card p-8">
		<p class="eyebrow text-center">Mercury Financials</p>
		<h1 class="mt-1 text-center text-2xl font-bold">Create your account</h1>

		<form method="POST" use:enhance class="mt-6 space-y-3">
			<input class="input" name="name" placeholder="Name" value={form?.name ?? ''} required />
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
				placeholder="Password (8+ characters)"
				autocomplete="new-password"
				required
			/>
			{#if form?.message}
				<p class="text-sm text-neg">{form.message}</p>
			{/if}
			<button type="submit" class="btn btn-primary w-full">Create account</button>
		</form>

		<p class="mt-4 text-center text-sm text-ink-400">
			Already have an account? <a href={resolve('/login')} class="text-mercury-ink">Sign in</a>
		</p>
	</div>
</div>
