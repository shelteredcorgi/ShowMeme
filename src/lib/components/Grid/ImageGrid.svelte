<script lang="ts">
	import type { ImageRecord } from '$lib/db/schema';
	import ImageCard from './ImageCard.svelte';

	export let images: ImageRecord[];
	export let columns = 4;
	export let onImageClick: (image: ImageRecord) => void;
</script>

<div
	class="grid gap-4 p-4"
	style="grid-template-columns: repeat({columns}, minmax(0, 1fr))"
>
	{#each images as image (image.id)}
		<ImageCard {image} on:click={() => onImageClick(image)} />
	{/each}
</div>

{#if images.length === 0}
	<div class="flex h-64 items-center justify-center text-gray-500">
		<p>No images found</p>
	</div>
{/if}

