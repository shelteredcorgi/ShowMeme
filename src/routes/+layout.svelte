<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { currentDirectory } from '$lib/stores/directory';
	import { refreshImagesFromDB } from '$lib/stores/filters';
	import { restoreDirectoryHandle } from '$lib/fs/directory-handle';
	import { Grid, List as ListIcon, Settings, Shuffle, Menu, Heart } from 'lucide-svelte';
	import Dropdown from '$lib/components/UI/Dropdown.svelte';
	import { viewMode, showSidebar, gridColumns } from '$lib/stores/preferences';
	import { showFavoritesOnly } from '$lib/stores/filters';
	import { getRandomImage } from '$lib/utils/random';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { isTauri } from '$lib/utils/tauri-helpers';
	import { startWatching, stopWatching, isImageFile } from '$lib/utils/file-watcher';
	import { scanDirectoryRecursive } from '$lib/fs/scanner';
	import { db } from '$lib/db/schema';
	import { get } from 'svelte/store';

	let randomImage: any = null;
	let settingsOpen = false;

	// Rotating taglines
	const taglines = [
		"Meme Worth 1,000 Words",
		"Return To Monke",
		"Good Meme, Good Tek",
		"Feelsgoodman",
		"Bulla vs Bera"
	];
	let currentTaglineIndex = 0;
	let taglineInterval: number;
	
	// Typing animation state
	let displayedText = '';
	let isTyping = false;
	let isDeleting = false;
	let animationTimeout: number;
	
	// Typing animation function
	function startAnimation() {
		// Clear any existing timeout
		if (animationTimeout) {
			clearTimeout(animationTimeout);
		}
		
		// Start deleting current text
		isDeleting = true;
		isTyping = false;
		deleteCharacter();
	}
	
	function deleteCharacter() {
		if (displayedText.length > 0) {
			displayedText = displayedText.slice(0, -1);
			animationTimeout = window.setTimeout(deleteCharacter, 50); // Delete speed
		} else {
			// Finished deleting, move to next tagline and start typing
			currentTaglineIndex = (currentTaglineIndex + 1) % taglines.length;
			const nextTagline = taglines[currentTaglineIndex];
			isDeleting = false;
			isTyping = true;
			typeCharacter(nextTagline, 0);
		}
	}
	
	function typeCharacter(targetText: string, index: number) {
		if (index < targetText.length) {
			displayedText = targetText.slice(0, index + 1);
			animationTimeout = window.setTimeout(() => typeCharacter(targetText, index + 1), 80); // Typing speed
		} else {
			// Finished typing
			isTyping = false;
		}
	}

	onMount(async () => {
		// Initialize displayed text
		displayedText = taglines[0];
		
		// Set up tagline rotation with typing animation
		taglineInterval = window.setInterval(() => {
			startAnimation();
		}, 6000); // Start transition every 6 seconds (gives time to read)
		// Load cached images from IndexedDB
		await refreshImagesFromDB();

		// Try to restore directory handle (for file access)
		const handle = await restoreDirectoryHandle();
		if (handle) {
			$currentDirectory = handle;
			console.log('Directory handle restored:', typeof handle === 'string' ? handle : handle.name);

			// Start file watcher in Tauri
			if (isTauri() && typeof handle === 'string') {
				await setupFileWatcher(handle);
			}
		}

		// Set up keyboard shortcuts
		const handleKeydown = (e: KeyboardEvent) => {
			// Ignore if typing in input field
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			switch (e.key.toLowerCase()) {
				case 'g':
					$viewMode = 'grid';
					goto('/');
					break;
				case 'l':
					$viewMode = 'list';
					goto('/list');
					break;
				case 'r':
					randomImage = getRandomImage();
					break;
				case 't':
					$showSidebar = !$showSidebar;
					break;
			}
		};

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(async () => {
		// Clean up file watcher when component is destroyed
		if (isTauri()) {
			await stopWatching();
		}
		// Clean up tagline interval
		if (taglineInterval) {
			clearInterval(taglineInterval);
		}
		// Clean up animation timeout
		if (animationTimeout) {
			clearTimeout(animationTimeout);
		}
	});

	async function setupFileWatcher(dirPath: string) {
		try {
			await startWatching(dirPath, async (event) => {
				// Handle file system events
				for (const path of event.paths) {
					// Check if it's an image file
					if (!isImageFile(path)) continue;

					const eventType = String(event.type);
					if (eventType === 'Create' || eventType === 'Modify' || eventType === 'create' || eventType === 'modify') {
						// Re-scan the directory to pick up new images
						console.log('New or modified image detected, refreshing...');
						await rescanDirectory();
						break; // Only rescan once per batch of events
					} else if (eventType === 'Remove' || eventType === 'remove') {
						// Remove from database
						console.log('Image removed, updating database...');
						const relativePath = path.replace(dirPath + '/', '');
						await db.images.where('path').equals(relativePath).delete();
						await refreshImagesFromDB();
						break;
					}
				}
			});
		} catch (err) {
			console.error('Failed to setup file watcher:', err);
		}
	}

	async function rescanDirectory() {
		const dirHandle = get(currentDirectory);
		if (!dirHandle) return;

		try {
			// Scan directory for images
			const images = await scanDirectoryRecursive(dirHandle);

			// Update database (add new images, keep existing ones)
			for (const img of images) {
				const existing = await db.images.where('path').equals(img.path).first();
				if (!existing) {
					await db.images.add(img);
				}
			}

			// Refresh the UI
			await refreshImagesFromDB();
			console.log('Directory refreshed successfully');
		} catch (err) {
			console.error('Failed to rescan directory:', err);
		}
	}
</script>

<div class="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<header class="border-b bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
		<div class="flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<button
					on:click={() => ($showSidebar = !$showSidebar)}
					class="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 {$showSidebar ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}"
					title="{$showSidebar ? 'Hide' : 'Show'} sidebar (T)"
				>
					<Menu size={20} />
				</button>
				<h1 class="text-xl font-bold text-gray-900 dark:text-white transition-opacity duration-500 font-mono">
					<span>{displayedText}</span><span class="cursor-blink">█</span>
				</h1>
			</div>

			<div class="flex items-center gap-2">
				<!-- View mode toggle -->
				<div class="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
					<button
						on:click={() => {
							$viewMode = 'grid';
							goto('/');
						}}
						class="rounded-md p-2 text-gray-700 dark:text-gray-200 {$page.url.pathname === '/'
							? 'bg-white shadow-sm dark:bg-gray-700'
							: 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
						title="Grid view (G)"
					>
						<Grid size={18} />
					</button>
					<button
						on:click={() => {
							$viewMode = 'list';
							goto('/list');
						}}
						class="rounded-md p-2 text-gray-700 dark:text-gray-200 {$page.url.pathname === '/list'
							? 'bg-white shadow-sm dark:bg-gray-700'
							: 'hover:bg-gray-200 dark:hover:bg-gray-700'}"
						title="List view (L)"
					>
						<ListIcon size={18} />
					</button>
				</div>

				<!-- Favorites filter -->
				<button
					on:click={() => ($showFavoritesOnly = !$showFavoritesOnly)}
					class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 {$showFavoritesOnly
						? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
						: ''}"
					title="Show favorites only"
				>
					<Heart size={18} class={$showFavoritesOnly ? 'fill-current' : ''} />
				</button>


				<!-- Settings dropdown -->
				<Dropdown bind:open={settingsOpen}>
					<Settings size={18} slot="trigger" class="text-gray-700 dark:text-gray-200" />
					
					<div class="py-1">
						<!-- Random -->
						<button
							on:click={() => {
								randomImage = getRandomImage();
								settingsOpen = false;
							}}
							class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							<Shuffle size={16} />
							<span>Random Image</span>
							<kbd class="ml-auto rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">R</kbd>
						</button>

						<!-- Grid columns (only in grid view) -->
						{#if $viewMode === 'grid'}
							<div class="border-t px-4 py-2 dark:border-gray-700">
								<label class="mb-1 block text-xs text-gray-600 dark:text-gray-400">Grid Columns</label>
								<select
									bind:value={$gridColumns}
									class="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
								>
									<option value={3}>3 columns</option>
									<option value={4}>4 columns</option>
									<option value={5}>5 columns</option>
									<option value={6}>6 columns</option>
								</select>
							</div>
						{/if}

						<!-- Settings page -->
						<button
							on:click={() => {
								goto('/settings');
								settingsOpen = false;
							}}
							class="flex w-full items-center gap-3 border-t px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							<Settings size={16} />
							<span>Settings</span>
						</button>
					</div>
				</Dropdown>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 overflow-auto">
		<slot />
	</main>
</div>

