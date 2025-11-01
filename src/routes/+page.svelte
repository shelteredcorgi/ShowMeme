<script lang="ts">
	import { filteredImages } from '$lib/stores/filters';
	import { gridColumns, showSidebar } from '$lib/stores/preferences';
	import { currentDirectory } from '$lib/stores/directory';
	import VirtualGrid from '$lib/components/Grid/VirtualGrid.svelte';
	import ImageGrid from '$lib/components/Grid/ImageGrid.svelte';
	import Lightbox from '$lib/components/Lightbox/Lightbox.svelte';
	import DirectorySelector from '$lib/components/DirectorySelector.svelte';
	import SearchBar from '$lib/components/Filters/SearchBar.svelte';
	import TagFilter from '$lib/components/Filters/TagFilter.svelte';
	import type { ImageRecord } from '$lib/db/schema';

	let selectedImage: ImageRecord | null = null;

	function openLightbox(image: ImageRecord) {
		// Check if we have directory access
		if (!$currentDirectory) {
			alert('Please select your image directory again to view full-size images.\n\nThe thumbnails are cached, but full images need directory access.');
			return;
		}
		selectedImage = image;
	}

	function closeLightbox() {
		selectedImage = null;
	}

	// Use virtual scrolling for large collections
	$: useVirtual = $filteredImages.length > 100;
</script>

<svelte:head>
	<title>ShowMeme - Grid View</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden">
	<!-- Warning banner when directory access is lost -->
	{#if $filteredImages.length > 0 && !$currentDirectory}
		<div class="bg-yellow-100 border-b border-yellow-300 px-4 py-3 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
			<p class="text-sm">
				⚠️ <strong>Directory access lost.</strong> Click "Select Directory" to view full-size images. Thumbnails are cached.
			</p>
		</div>
	{/if}

	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<aside
			class="overflow-y-auto border-r bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 {$showSidebar
				? 'w-80 p-4'
				: 'w-0 p-0'}"
		>
			{#if $showSidebar}
				<div class="space-y-6">
					<DirectorySelector />
					<div class="border-t pt-4 dark:border-gray-700">
						<SearchBar />
					</div>
					<div class="border-t pt-4 dark:border-gray-700">
						<TagFilter />
					</div>
				</div>
			{/if}
		</aside>

		<!-- Main content -->
		<div class="flex-1 overflow-auto">
		{#if $filteredImages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-gray-500">
				<p class="mb-4 text-lg">No images yet</p>
				<p class="text-sm">Select a directory from the sidebar to get started</p>
			</div>
		{:else if useVirtual}
			<VirtualGrid images={$filteredImages} columns={$gridColumns} onImageClick={openLightbox} />
		{:else}
			<ImageGrid images={$filteredImages} columns={$gridColumns} onImageClick={openLightbox} />
		{/if}
		</div>
	</div>
</div>

{#if selectedImage}
	<Lightbox image={selectedImage} allImages={$filteredImages} on:close={closeLightbox} />
{/if}

