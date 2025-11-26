<script lang="ts">
	import {
		requestDirectoryAccess,
		scanDirectoryRecursive,
	} from "$lib/fs/scanner";
	import { persistDirectoryHandle } from "$lib/fs/directory-handle";
	import {
		currentDirectory,
		isScanning,
		scanProgress,
	} from "$lib/stores/directory";
	import { addImages, mergeImages } from "$lib/db/images";
	import { refreshImagesFromDB, allImages } from "$lib/stores/filters";
	import { db } from "$lib/db/schema";
	import { memoryManager } from "$lib/cache/memory-manager";
	import { clearFileCache } from "$lib/utils/image-loader";
	import { FolderOpen, Loader2, RefreshCw } from "lucide-svelte";
	import Button from "./UI/Button.svelte";
	import { get } from "svelte/store";
	import { isTauri } from "$lib/utils/tauri-helpers";
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	async function handleSelectDirectory() {
		const handle = await requestDirectoryAccess();
		if (!handle) return;

		$currentDirectory = handle;
		await scanDirectory(handle);

		// Notify parent to setup file watcher (in Tauri)
		if (isTauri() && typeof handle === "string") {
			dispatch("directorySelected", { path: handle });
		}
	}

	async function handleRefreshDirectory() {
		if (!$currentDirectory) return;

		const confirm = window.confirm(
			"This will re-scan the directory and may take a few minutes.\n\nContinue?",
		);
		if (!confirm) return;

		await scanDirectory($currentDirectory);
	}

	async function scanDirectory(handle: FileSystemDirectoryHandle | string) {
		$isScanning = true;
		$scanProgress = 0;

		try {
			// Don't clear data to preserve tags/favorites
			console.log("Starting scan...");

			// Clear file cache but keep DB
			clearFileCache();

			// Update UI to show empty state
			await refreshImagesFromDB();

			// Persist the handle
			await persistDirectoryHandle(handle);

			// Scan the directory
			console.log("Scanning directory...");
			const images = await scanDirectoryRecursive(handle, "", (count) => {
				$scanProgress = count;
			});

			// Merge to database
			await mergeImages(images);
			await refreshImagesFromDB();

			console.log(`Loaded ${images.length} images`);
		} catch (err) {
			console.error("Failed to scan directory:", err);
			alert("Failed to scan directory. Please try again.");
		} finally {
			$isScanning = false;
		}
	}
</script>

<div class="space-y-4">
	{#if $currentDirectory}
		<div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
			<h3 class="mb-2 font-medium text-text">Current Directory</h3>
			<p
				class="text-sm text-text-muted font-mono bg-bg p-2 rounded-lg border border-border/50 break-all"
			>
				{typeof $currentDirectory === "string"
					? $currentDirectory.split('/').filter(Boolean).pop() || $currentDirectory
					: $currentDirectory.name}
			</p>
			{#if isTauri()}
				<p class="mt-2 text-xs text-green-600 flex items-center gap-1">
					<span class="inline-block w-2 h-2 rounded-full bg-green-500"
					></span>
					Auto-refresh enabled
				</p>
			{/if}
		</div>
	{/if}

	{#if $isScanning}
		<div
			class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-center gap-2">
				<Loader2 size={20} class="animate-spin text-blue-600" />
				<span class="text-sm text-gray-700 dark:text-gray-300">
					Scanning... {$scanProgress} images found
				</span>
			</div>
		</div>
	{:else}
		<div class="flex gap-3">
			<Button
				on:click={handleSelectDirectory}
				class="flex-1 justify-center py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 transition-all active:scale-95"
			>
				<div class="flex items-center gap-2">
					<FolderOpen size={18} />
					<span class="font-medium"
						>{$currentDirectory
							? "Change Folder"
							: "Select Folder"}</span
					>
				</div>
			</Button>
			{#if $currentDirectory}
				<Button
					variant="secondary"
					on:click={handleRefreshDirectory}
					class="px-4 rounded-xl border border-border bg-surface hover:bg-bg text-text-muted hover:text-text transition-all active:scale-95"
				>
					<div class="flex items-center gap-2">
						<RefreshCw size={18} />
					</div>
				</Button>
			{/if}
		</div>
		{#if !$currentDirectory}
			<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
				Images and tags will be cached for fast loading on future
				visits.
			</p>
		{/if}
	{/if}
</div>
