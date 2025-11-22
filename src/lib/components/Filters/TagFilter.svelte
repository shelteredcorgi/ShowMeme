<script lang="ts">
	import { onMount } from "svelte";
	import { selectedTags, tagFilterMode, tags } from "$lib/stores/filters";
	import type { TagRecord } from "$lib/db/schema";
	import { X } from "lucide-svelte";

	// Use global tags store
	$: sortedTags = $tags
		.filter((t) => t.count > 0)
		.sort((a, b) => b.count - a.count);

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
		<h3 class="font-semibold text-text">Filter by Tags</h3>
		{#if $selectedTags.length > 0}
			<button
				on:click={clearAll}
				class="text-xs font-medium text-accent hover:text-accent-hover bg-accent/10 px-2 py-1 rounded-md transition-colors"
			>
				Clear all
			</button>
		{/if}
	</div>

	<div
		class="flex items-center gap-2 p-1 bg-bg rounded-lg border border-border w-fit"
	>
		<button
			on:click={() => ($tagFilterMode = "OR")}
			class="rounded-md px-3 py-1 text-xs font-medium transition-all {$tagFilterMode ===
			'OR'
				? 'bg-white shadow-sm text-accent dark:bg-white/10'
				: 'text-text-muted hover:text-text'}"
		>
			Any
		</button>
		<button
			on:click={() => ($tagFilterMode = "AND")}
			class="rounded-md px-3 py-1 text-xs font-medium transition-all {$tagFilterMode ===
			'AND'
				? 'bg-white shadow-sm text-accent dark:bg-white/10'
				: 'text-text-muted hover:text-text'}"
		>
			All
		</button>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each sortedTags as tag (tag.name)}
			<button
				on:click={() => toggleTag(tag.name)}
				class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border border-transparent {$selectedTags.includes(
					tag.name,
				)
					? 'ring-2 ring-accent ring-offset-1 ring-offset-surface'
					: 'hover:border-border hover:shadow-sm'}"
				style="background-color: {tag.color}15; color: {tag.color}"
			>
				<span>{tag.name}</span>
				<span class="opacity-60">({tag.count})</span>
			</button>
		{/each}
	</div>

	{#if sortedTags.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">
			No tags yet. Add tags to your images!
		</p>
	{/if}
</div>
