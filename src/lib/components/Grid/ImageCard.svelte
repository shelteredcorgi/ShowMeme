<script lang="ts">
	import type { ImageRecord } from '$lib/db/schema';
	import { getThumbnailURL } from '$lib/cache/thumbnail-cache';
	import { getFileFromPath, createImageURL } from '$lib/utils/image-loader';
	import { generateThumbnail, cacheThumbnail } from '$lib/cache/thumbnail-cache';
	import { onMount } from 'svelte';
	import { Heart } from 'lucide-svelte';
	import { toggleFavorite } from '$lib/db/images';
	import { allImages } from '$lib/stores/filters';
	import { thumbnailQueue } from '$lib/utils/thumbnail-queue';

	export let image: ImageRecord;

	let thumbnailUrl: string | null = null;
	let loading = true;
	let error = false;

	onMount(async () => {
		await loadThumbnail();
	});

	async function loadThumbnail() {
		try {
			// Try to get cached thumbnail
			thumbnailUrl = await getThumbnailURL(image);

			if (!thumbnailUrl) {
				// Queue thumbnail generation to limit concurrent operations
				await thumbnailQueue.add(async () => {
					const file = await getFileFromPath(image.path);
					if (file) {
						const thumbBlob = await generateThumbnail(file);
						await cacheThumbnail(image.id!, thumbBlob);
						thumbnailUrl = await getThumbnailURL({ ...image, thumbnailBlob: thumbBlob });
					} else {
						error = true;
					}
				});
			}
		} catch (err) {
			console.error('Failed to load thumbnail:', err);
			error = true;
		} finally {
			loading = false;
		}
	}

	async function handleFavoriteClick(e: Event) {
		e.stopPropagation();
		if (image.id) {
			await toggleFavorite(image.id);
			image.favorite = !image.favorite;
			// Update store directly instead of full refresh
			allImages.update($images =>
				$images.map(img => img.id === image.id ? { ...img, favorite: !img.favorite } : img)
			);
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	class="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
	on:click
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const event = new MouseEvent('click', { bubbles: true });
			e.currentTarget.dispatchEvent(event);
		}
	}}
>
	{#if loading}
		<div class="flex h-full items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
		</div>
	{:else if error || !thumbnailUrl}
		<div class="flex h-full items-center justify-center text-gray-400">
			<span class="text-sm">Failed to load</span>
		</div>
	{:else}
		<img
			src={thumbnailUrl}
			alt={image.name}
			class="h-full w-full object-cover transition-transform group-hover:scale-105"
		/>
	{/if}

	<!-- Overlay -->
	<div
		class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
	>
		<div class="absolute bottom-0 left-0 right-0 p-3">
			<p class="truncate text-sm font-medium text-white">{image.name}</p>
			<div class="mt-1 flex flex-wrap gap-1">
				{#each image.tags.slice(0, 3) as tag}
					<span class="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
						{tag}
					</span>
				{/each}
				{#if image.tags.length > 3}
					<span class="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
						+{image.tags.length - 3}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Favorite button -->
	<button
		on:click={handleFavoriteClick}
		class="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 transition-all hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
	>
		<Heart size={18} class={image.favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
	</button>
</div>

