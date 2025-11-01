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

<div class="relative">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		<Search size={18} class="text-gray-400" />
	</div>
	<input
		bind:this={inputElement}
		bind:value={$searchQuery}
		type="text"
		placeholder="Search images..."
		class="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
	/>
	{#if $searchQuery}
		<button
			on:click={clear}
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
		>
			<X size={18} />
		</button>
	{/if}
</div>

