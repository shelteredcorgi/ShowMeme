<script lang="ts">
	import {
		addTagToImage,
		removeTagFromImage,
		tags,
	} from "$lib/stores/filters";
	import type { TagRecord } from "$lib/db/schema";
	import { onMount } from "svelte";
	import { X, Plus } from "lucide-svelte";

	export let imageId: number;
	export let currentTags: string[] = [];

	let newTagName = "";
	let showSuggestions = false;

	// Use global tags store
	$: allTags = $tags;

	$: suggestedTags = allTags
		.filter((tag) => !currentTags.includes(tag.name))
		.filter((tag) =>
			tag.name.toLowerCase().includes(newTagName.toLowerCase()),
		)
		.slice(0, 5);

	async function addTag(tagName: string) {
		if (!tagName.trim()) return;

		// Optimistic update - update UI immediately
		const trimmedTag = tagName.trim();
		if (!currentTags.includes(trimmedTag)) {
			currentTags = [...currentTags, trimmedTag];
		}
		newTagName = "";
		showSuggestions = false;

		// Update in background
		await addTagToImage(imageId, trimmedTag);
	}

	async function removeTag(tagName: string) {
		// Optimistic update - update UI immediately
		currentTags = currentTags.filter((t) => t !== tagName);

		// Update in background
		await removeTagFromImage(imageId, tagName);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			addTag(newTagName);
		}
	}

	function getTagColor(tagName: string): string {
		const tag = allTags.find((t) => t.name === tagName);
		return tag?.color || "#6b7280";
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap gap-2">
		{#each currentTags as tag (tag)}
			<span
				class="flex items-center gap-1 rounded-full px-3 py-1 text-sm"
				style="background-color: {getTagColor(
					tag,
				)}20; color: {getTagColor(tag)}"
			>
				{tag}
				<button
					on:click={() => removeTag(tag)}
					class="hover:opacity-70"
				>
					<X size={14} />
				</button>
			</span>
		{/each}
	</div>

	<div class="relative">
		<div class="flex gap-2">
			<input
				bind:value={newTagName}
				on:keydown={handleKeyDown}
				on:focus={() => (showSuggestions = true)}
				on:blur={() => setTimeout(() => (showSuggestions = false), 200)}
				type="text"
				placeholder="Add tag..."
				class="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
			/>
			<button
				on:click={() => addTag(newTagName)}
				class="rounded-md bg-blue-600 p-1 text-white hover:bg-blue-700"
			>
				<Plus size={18} />
			</button>
		</div>

		{#if showSuggestions && suggestedTags.length > 0}
			<div
				class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
			>
				{#each suggestedTags as tag (tag.name)}
					<button
						on:click={() => addTag(tag.name)}
						class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<span class="flex items-center gap-2">
							<span
								class="h-3 w-3 rounded-full"
								style="background-color: {tag.color}"
							></span>
							{tag.name}
							<span class="text-xs text-gray-500"
								>({tag.count})</span
							>
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
