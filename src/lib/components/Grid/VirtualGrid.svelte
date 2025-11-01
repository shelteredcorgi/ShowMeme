<script lang="ts">
	import type { ImageRecord } from '$lib/db/schema';
	import ImageCard from './ImageCard.svelte';
	import { chunkArray } from '$lib/utils/format';
	import VirtualList from 'svelte-virtual-list';

	export let images: ImageRecord[];
	export let columns = 4;
	export let onImageClick: (image: ImageRecord) => void;

	$: rows = chunkArray(images, columns);
</script>

{#if images.length > 0}
	<div class="h-full">
		<VirtualList items={rows} height="100%" itemHeight={350} let:item>
			<div
				class="grid gap-4 px-4"
				style="grid-template-columns: repeat({columns}, minmax(0, 1fr))"
			>
				{#each item as image (image.id)}
					<ImageCard {image} on:click={() => onImageClick(image)} />
				{/each}
			</div>
		</VirtualList>
	</div>
{:else}
	<div class="flex h-64 items-center justify-center text-gray-500">
		<p>No images found</p>
	</div>
{/if}

