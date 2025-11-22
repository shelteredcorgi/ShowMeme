<script lang="ts">
	import { searchQuery } from '$lib/stores/filters';
	import { Search, X } from 'lucide-svelte';

	let inputElement: HTMLInputElement;

	export function focus() {
		inputElement?.focus();
	}

	function clear() {
		$searchQuery = '';
	}
</script>

<div class="relative group">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
		<Search size={18} class="text-text-muted group-focus-within:text-accent transition-colors" />
	</div>
	<input
		bind:this={inputElement}
		bind:value={$searchQuery}
		type="text"
		placeholder="Search images..."
		class="w-full rounded-xl border border-border bg-bg py-2.5 pl-10 pr-10 text-sm text-text placeholder-text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-sm"
	/>
	{#if $searchQuery}
		<button
			on:click={clear}
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text transition-colors"
		>
			<X size={16} />
		</button>
	{/if}
</div>

