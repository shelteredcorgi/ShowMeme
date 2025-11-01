<script lang="ts">
	import type { ImageRecord } from '$lib/db/schema';
	import { getThumbnailURL } from '$lib/cache/thumbnail-cache';
	import { formatSize, formatDate } from '$lib/utils/format';
	import { onMount } from 'svelte';
	import { Heart, Eye } from 'lucide-svelte';
	import { toggleFavorite } from '$lib/db/images';
	import { sortBy, sortOrder, allImages } from '$lib/stores/filters';

	export let images: ImageRecord[];
	export let onImageClick: (image: ImageRecord) => void;

	let thumbnails = new Map<number, string>();

	onMount(async () => {
		// Load thumbnails for visible images
		loadThumbnails();
	});

	$: if (images) {
		loadThumbnails();
	}

	async function loadThumbnails() {
		for (const image of images.slice(0, 50)) {
			if (image.id && !thumbnails.has(image.id)) {
				const url = await getThumbnailURL(image);
				if (url) {
					thumbnails.set(image.id, url);
					thumbnails = thumbnails;
				}
			}
		}
	}

	async function handleFavoriteClick(image: ImageRecord, e: Event) {
		e.stopPropagation();
		if (image.id) {
			await toggleFavorite(image.id);
			// Update store directly instead of full refresh
			allImages.update($images =>
				$images.map(img => img.id === image.id ? { ...img, favorite: !img.favorite } : img)
			);
		}
	}

	function handleSort(column: 'name' | 'date' | 'size') {
		if ($sortBy === column) {
			$sortOrder = $sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			$sortBy = column;
			$sortOrder = 'asc';
		}
	}

	function getSortIcon(column: 'name' | 'date' | 'size') {
		if ($sortBy !== column) return '↕';
		return $sortOrder === 'asc' ? '↑' : '↓';
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full">
		<thead class="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
			<tr>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					Thumbnail
				</th>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					<button on:click={() => handleSort('name')} class="flex items-center gap-1 hover:text-blue-600">
						Name {getSortIcon('name')}
					</button>
				</th>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					Tags
				</th>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					<button on:click={() => handleSort('size')} class="flex items-center gap-1 hover:text-blue-600">
						Size {getSortIcon('size')}
					</button>
				</th>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					<button on:click={() => handleSort('date')} class="flex items-center gap-1 hover:text-blue-600">
						Modified {getSortIcon('date')}
					</button>
				</th>
				<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
					Actions
				</th>
			</tr>
		</thead>
		<tbody class="divide-y dark:divide-gray-700">
			{#each images as image (image.id)}
				<tr
					class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
					on:click={() => onImageClick(image)}
				>
					<td class="px-4 py-3">
						{#if image.id && thumbnails.has(image.id)}
							<img
								src={thumbnails.get(image.id)}
								alt={image.name}
								class="h-12 w-12 rounded object-cover"
							/>
						{:else}
							<div class="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
						{/if}
					</td>
					<td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
						{image.name}
					</td>
					<td class="px-4 py-3">
						<div class="flex flex-wrap gap-1">
							{#each image.tags.slice(0, 2) as tag}
								<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
									{tag}
								</span>
							{/each}
							{#if image.tags.length > 2}
								<span class="text-xs text-gray-500">+{image.tags.length - 2}</span>
							{/if}
						</div>
					</td>
					<td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
						{formatSize(image.size)}
					</td>
					<td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
						{formatDate(image.lastModified)}
					</td>
					<td class="px-4 py-3">
						<div class="flex gap-2">
							<button
								on:click={(e) => handleFavoriteClick(image, e)}
								class="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
								title="Toggle favorite"
							>
								<Heart size={16} class={image.favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
							</button>
							<button
								on:click={() => onImageClick(image)}
								class="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
								title="View"
							>
								<Eye size={16} class="text-gray-600" />
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if images.length === 0}
	<div class="flex h-64 items-center justify-center text-gray-500">
		<p>No images found</p>
	</div>
{/if}

