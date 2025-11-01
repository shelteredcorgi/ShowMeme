<script lang="ts">
	import { onMount } from 'svelte';
	import { selectedTags, tagFilterMode } from '$lib/stores/filters';
	import { getAllTags } from '$lib/db/tags';
	import type { TagRecord } from '$lib/db/schema';
	import { X } from 'lucide-svelte';

	let tags: TagRecord[] = [];

	onMount(async () => {
		await loadTags();
	});

	async function loadTags() {
		tags = await getAllTags();
		tags = tags.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
	}

	function toggleTag(tagName: string) {
		selectedTags.update((current) => {
			if (current.includes(tagName)) {
				return current.filter((t) => t !== tagName);
			}
			return [...current, tagName];
		});
	}

	function clearAll() {
		selectedTags.set([]);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="font-semibold text-gray-900 dark:text-white">Filter by Tags</h3>
		{#if $selectedTags.length > 0}
			<button
				on:click={clearAll}
				class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
			>
				Clear all
			</button>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<label class="text-sm text-gray-600 dark:text-gray-400">Match:</label>
		<button
			on:click={() => ($tagFilterMode = 'OR')}
			class="rounded px-2 py-1 text-sm {$tagFilterMode === 'OR'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
		>
			Any
		</button>
		<button
			on:click={() => ($tagFilterMode = 'AND')}
			class="rounded px-2 py-1 text-sm {$tagFilterMode === 'AND'
				? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
		>
			All
		</button>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each tags as tag (tag.name)}
			<button
				on:click={() => toggleTag(tag.name)}
				class="flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-all {$selectedTags.includes(
					tag.name
				)
					? 'ring-2 ring-blue-600'
					: ''}"
				style="background-color: {tag.color}20; color: {tag.color}"
			>
				<span>{tag.name}</span>
				<span class="text-xs opacity-70">({tag.count})</span>
			</button>
		{/each}
	</div>

	{#if tags.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">No tags yet. Add tags to your images!</p>
	{/if}
</div>

