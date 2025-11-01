<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllTags, createTag, deleteTag, updateTagColor, generateRandomColor } from '$lib/db/tags';
	import type { TagRecord } from '$lib/db/schema';
	import { Plus, Trash2, Edit2 } from 'lucide-svelte';
	import Button from '$lib/components/UI/Button.svelte';

	let tags: TagRecord[] = [];
	let newTagName = '';
	let editingTag: string | null = null;
	let editingColor = '';

	onMount(async () => {
		await loadTags();
	});

	async function loadTags() {
		tags = await getAllTags();
		tags = tags.sort((a, b) => b.count - a.count);
	}

	async function handleCreateTag() {
		if (!newTagName.trim()) return;

		const color = generateRandomColor();
		await createTag(newTagName.trim(), color);
		newTagName = '';
		await loadTags();
	}

	async function handleDeleteTag(tagName: string) {
		if (confirm(`Delete tag "${tagName}"? This will remove it from all images.`)) {
			await deleteTag(tagName);
			await loadTags();
		}
	}

	function startEditColor(tag: TagRecord) {
		editingTag = tag.name;
		editingColor = tag.color;
	}

	async function saveColor() {
		if (editingTag) {
			await updateTagColor(editingTag, editingColor);
			editingTag = null;
			await loadTags();
		}
	}
</script>

<div class="space-y-4">
	<h3 class="font-semibold text-gray-900 dark:text-white">Manage Tags</h3>

	<div class="flex gap-2">
		<input
			bind:value={newTagName}
			on:keydown={(e) => e.key === 'Enter' && handleCreateTag()}
			type="text"
			placeholder="New tag name..."
			class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
		/>
		<Button on:click={handleCreateTag}>
			<Plus size={18} />
		</Button>
	</div>

	<div class="space-y-2">
		{#each tags as tag (tag.name)}
			<div class="flex items-center justify-between rounded-md border p-2 dark:border-gray-700">
				<div class="flex items-center gap-2">
					{#if editingTag === tag.name}
						<input
							bind:value={editingColor}
							type="color"
							class="h-6 w-6 cursor-pointer"
						/>
					{:else}
						<div
							class="h-6 w-6 rounded"
							style="background-color: {tag.color}"
						></div>
					{/if}
					<span class="font-medium">{tag.name}</span>
					<span class="text-sm text-gray-500">({tag.count})</span>
				</div>
				<div class="flex gap-2">
					{#if editingTag === tag.name}
						<Button size="sm" on:click={saveColor}>Save</Button>
						<Button size="sm" variant="ghost" on:click={() => editingTag = null}>Cancel</Button>
					{:else}
						<button
							on:click={() => startEditColor(tag)}
							class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
							title="Edit color"
						>
							<Edit2 size={16} />
						</button>
						<button
							on:click={() => handleDeleteTag(tag.name)}
							class="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
							title="Delete tag"
						>
							<Trash2 size={16} />
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if tags.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400">
			No tags yet. Create your first tag above!
		</p>
	{/if}
</div>

