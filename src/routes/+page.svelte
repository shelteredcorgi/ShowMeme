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
		<div class="bg-amber-50 border-b border-amber-100 px-4 py-3 text-amber-900 flex items-center gap-3">
			<div class="p-1 bg-amber-100 rounded-full">
				<span class="text-lg">⚠️</span>
			</div>
			<p class="text-sm font-medium">
				<strong>Directory access lost.</strong> Click "Select Directory" to view full-size images. Thumbnails are cached.
			</p>
		</div>
	{/if}

	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<aside
			class="overflow-y-auto border-r border-border bg-surface transition-all duration-300 {$showSidebar
				? 'w-80 p-6'
				: 'w-0 p-0'}"
		>
			{#if $showSidebar}
				<div class="space-y-6">
					<DirectorySelector />
					<div class="border-t border-border pt-6">
						<SearchBar />
					</div>
					<div class="border-t border-border pt-6">
						<TagFilter />
					</div>
				</div>
			{/if}
		</aside>

		<!-- Main content -->
		<div class="flex-1 overflow-auto">
		{#if $filteredImages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-text-muted">
				<div class="mb-6 rounded-3xl bg-surface p-8 shadow-sm border border-border">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-semibold text-text">No images found</h3>
				<p class="text-sm text-text-muted max-w-xs text-center">Select a directory from the sidebar to start browsing your meme collection</p>
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

