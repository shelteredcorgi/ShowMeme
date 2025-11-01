<script lang="ts">
	import { db } from '$lib/db/schema';
	import TagManager from '$lib/components/Tags/TagManager.svelte';
	import Button from '$lib/components/UI/Button.svelte';
	import Card from '$lib/components/UI/Card.svelte';
	import { Download, Upload, Trash2 } from 'lucide-svelte';

	let imageCount = 0;
	let tagCount = 0;

	async function loadStats() {
		imageCount = await db.images.count();
		tagCount = await db.tags.count();
	}

	loadStats();

	async function handleExportData() {
		const images = await db.images.toArray();
		const tags = await db.tags.toArray();

		const data = {
			version: 1,
			exportDate: new Date().toISOString(),
			images: images.map((img) => ({
				...img,
				thumbnailBlob: undefined // Don't export thumbnails
			})),
			tags
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `showmeme-export-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleImportData() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const data = JSON.parse(text);

				if (data.version !== 1) {
					alert('Unsupported export format');
					return;
				}

				// Import tags
				for (const tag of data.tags) {
					await db.tags.put(tag);
				}

				// Import images (without thumbnails)
				for (const img of data.images) {
					await db.images.put(img);
				}

				alert('Data imported successfully!');
				await loadStats();
			} catch (err) {
				console.error('Import failed:', err);
				alert('Failed to import data. Please check the file format.');
			}
		};
		input.click();
	}

	async function handleClearData() {
		if (
			confirm(
				'Are you sure you want to clear all data? This will delete all images and tags from the database.'
			)
		) {
			await db.images.clear();
			await db.tags.clear();
			alert('All data cleared!');
			await loadStats();
		}
	}
</script>

<svelte:head>
	<title>ShowMeme - Settings</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

	<div class="space-y-6">
		<!-- Tags -->
		<Card>
			<TagManager />
		</Card>

		<!-- Data Management -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>

			<div class="space-y-4">
				<div class="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p class="text-gray-600 dark:text-gray-400">Total Images</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">{imageCount}</p>
						</div>
						<div>
							<p class="text-gray-600 dark:text-gray-400">Total Tags</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">{tagCount}</p>
						</div>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<Button on:click={handleExportData}>
						<div class="flex items-center gap-2">
							<Download size={18} />
							<span>Export Data</span>
						</div>
					</Button>

					<Button variant="secondary" on:click={handleImportData}>
						<div class="flex items-center gap-2">
							<Upload size={18} />
							<span>Import Data</span>
						</div>
					</Button>

					<Button variant="ghost" on:click={handleClearData}>
						<div class="flex items-center gap-2 text-red-600">
							<Trash2 size={18} />
							<span>Clear All Data</span>
						</div>
					</Button>
				</div>

				<p class="text-xs text-gray-500 dark:text-gray-400">
					Note: Export does not include thumbnail images. They will be regenerated when you
					select the directory again.
				</p>
			</div>
		</Card>

		<!-- Keyboard Shortcuts -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
				Keyboard Shortcuts
			</h2>

			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Switch to Grid View</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700">G</kbd>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Switch to List View</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700">L</kbd>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Random Image</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700">R</kbd>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Toggle Sidebar</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700">T</kbd>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Navigate in Lightbox</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700"
						>← →</kbd
					>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Close Lightbox</span>
					<kbd class="rounded bg-gray-200 px-2 py-1 font-mono dark:bg-gray-700">Esc</kbd>
				</div>
			</div>
		</Card>

		<!-- About -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">About ShowMeme</h2>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				ShowMeme is a privacy-first, local-first image organization app. All your images and
				data stay on your device. Nothing is uploaded to any server.
			</p>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Version 0.1.0</p>
		</Card>
	</div>
</div>

