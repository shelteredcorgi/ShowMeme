<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { ImageRecord } from '$lib/db/schema';
	import { getFileFromPath, createImageURL } from '$lib/utils/image-loader';
	import TagInput from '$lib/components/Tags/TagInput.svelte';
	import { ChevronLeft, ChevronRight, X, Heart, FolderOpen } from 'lucide-svelte';
	import { toggleFavorite } from '$lib/db/images';
	import { refreshImagesFromDB } from '$lib/stores/filters';
	import { currentDirectory } from '$lib/stores/directory';
	import { get } from 'svelte/store';
	import { isTauri } from '$lib/utils/tauri-helpers';
	import { invoke } from '@tauri-apps/api/core';

	export let image: ImageRecord;
	export let allImages: ImageRecord[];

	const dispatch = createEventDispatcher();

	let currentIndex = allImages.findIndex((img) => img.id === image.id);
	let imageUrl: string | null = null;
	let loading = true;
	let error = false;

	$: currentImage = allImages[currentIndex] || image;

	$: {
		if (currentImage) {
			loadFullImage(currentImage);
		}
	}

	onMount(() => {
		loadFullImage(currentImage);

		// Set up keyboard shortcuts
		const handleKeydown = (e: KeyboardEvent) => {
			// Ignore if user is typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			if (e.key === 'ArrowRight') {
				e.preventDefault();
				next();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				prev();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				close();
			} else if (e.key.toLowerCase() === 'r') {
				e.preventDefault();
				jumpToRandom();
			}
		};

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	async function loadFullImage(img: ImageRecord) {
		loading = true;
		error = false;
		imageUrl = null; // Clear previous image
		
		console.log('Loading image:', img.name, 'Path:', img.path);
		
		try {
			const file = await getFileFromPath(img.path);
			if (file) {
				console.log('File loaded successfully:', file.name, file.size);
				imageUrl = await createImageURL(file, `full-${img.id}`);
				console.log('Image URL created:', imageUrl);
			} else {
				console.error('Failed to get file from path:', img.path);
				error = true;
			}
		} catch (err) {
			console.error('Failed to load image:', err);
			error = true;
		} finally {
			loading = false;
		}
	}

	function next() {
		if (currentIndex < allImages.length - 1) {
			currentIndex++;
		}
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
		}
	}

	function jumpToRandom() {
		if (allImages.length === 0) return;

		// Create weighted array (favorites have 2x chance)
		const weighted: number[] = [];
		allImages.forEach((img, index) => {
			weighted.push(index);
			if (img.favorite) weighted.push(index); // Add twice for favorites
		});

		// Get random index
		const randomWeightedIndex = Math.floor(Math.random() * weighted.length);
		const newIndex = weighted[randomWeightedIndex];

		// Don't jump to the same image if there's more than one
		if (allImages.length > 1 && newIndex === currentIndex) {
			// Try again
			jumpToRandom();
		} else {
			currentIndex = newIndex;
		}
	}

	function close() {
		dispatch('close');
	}

	async function handleFavoriteClick() {
		if (currentImage.id) {
			await toggleFavorite(currentImage.id);
			currentImage.favorite = !currentImage.favorite;
			await refreshImagesFromDB();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	async function revealOrCopyPath() {
		try {
			const dirHandle = get(currentDirectory);
			if (!dirHandle) {
				alert('No directory selected');
				return;
			}

			// In Tauri, reveal in Finder
			if (isTauri() && typeof dirHandle === 'string') {
				const fullPath = `${dirHandle}/${currentImage.path}`;
				await invoke('reveal_in_finder', { path: fullPath });
			}
			// In browser, copy to clipboard
			else if (typeof dirHandle !== 'string') {
				const fullPath = `${dirHandle.name}/${currentImage.path}`;
				await navigator.clipboard.writeText(fullPath);
				alert('Path copied to clipboard!');
			}
		} catch (err) {
			console.error('Failed to reveal/copy path:', err);
			alert('Could not reveal file. Path: ' + currentImage.path);
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-sm"
	on:click={handleBackdropClick}
>
	<!-- Close button - positioned over the image area -->
	<button
		on:click={close}
		class="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
		title="Close (Esc)"
	>
		<X size={24} />
	</button>

	<!-- Random button hint -->
	<div class="absolute bottom-4 right-4 z-10 rounded-md bg-black/50 px-3 py-2 text-xs text-white backdrop-blur-sm">
		Press <kbd class="rounded bg-white/20 px-2 py-1 font-mono">R</kbd> for random
	</div>

	<!-- Navigation buttons - positioned over the image area, not the sidebar -->
	{#if currentIndex > 0}
		<button
			on:click={prev}
			class="absolute bottom-4 left-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
			title="Previous (←)"
		>
			<ChevronLeft size={32} />
		</button>
	{/if}

	{#if currentIndex < allImages.length - 1}
		<button
			on:click={next}
			class="absolute bottom-4 left-20 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
			title="Next (→)"
		>
			<ChevronRight size={32} />
		</button>
	{/if}

	<!-- Main content -->
	<div class="flex flex-1 items-center justify-center p-4">
		{#if loading}
			<div class="flex flex-col items-center gap-4">
				<div class="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
				<p class="text-white">Loading image...</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center gap-4 text-white">
				<p class="text-xl">⚠️ Failed to load image</p>
				<p class="text-sm text-gray-400">The file may have been moved or deleted</p>
			</div>
		{:else if imageUrl}
			<img
				src={imageUrl}
				alt={currentImage.name}
				class="max-h-full max-w-full object-contain"
			/>
		{:else}
			<p class="text-white">No image available</p>
		{/if}
	</div>

	<!-- Sidebar -->
	<div
		class="w-80 overflow-y-auto bg-white p-6 dark:bg-gray-900"
		on:click={(e) => e.stopPropagation()}
	>
		<div class="space-y-4">
			<div class="flex items-start justify-between">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
					{currentImage.name}
				</h2>
				<button
					on:click={handleFavoriteClick}
					class="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<Heart
						size={20}
						class={currentImage.favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
					/>
				</button>
			</div>

			<div class="text-sm text-gray-600 dark:text-gray-400">
				<p>Size: {(currentImage.size / 1024).toFixed(1)} KB</p>
				<p>Modified: {new Date(currentImage.lastModified).toLocaleDateString()}</p>
				{#if isTauri() && typeof $currentDirectory === 'string'}
					<p class="break-all text-xs">{$currentDirectory}/{currentImage.path}</p>
				{/if}
				<p>
					Image {currentIndex + 1} of {allImages.length}
				</p>
			</div>

			<button
				on:click={revealOrCopyPath}
				class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				<FolderOpen size={16} />
				{isTauri() ? 'Show in Finder' : 'Copy File Path'}
			</button>

			<div class="border-t pt-4 dark:border-gray-700">
				<h3 class="mb-2 font-medium text-gray-900 dark:text-white">Tags</h3>
				{#if currentImage.id}
					<TagInput imageId={currentImage.id} bind:currentTags={currentImage.tags} />
				{/if}
			</div>
		</div>
	</div>
</div>

