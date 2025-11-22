import { derived, writable } from 'svelte/store';
import { db, type ImageRecord, type TagRecord } from '$lib/db/schema';
import { generateRandomColor } from '$lib/db/tags';

export const searchQuery = writable('');
export const selectedTags = writable<string[]>([]);
export const tagFilterMode = writable<'OR' | 'AND'>('OR');
export const showFavoritesOnly = writable(false);
export const sortBy = writable<'name' | 'date' | 'size'>('name');
export const sortOrder = writable<'asc' | 'desc'>('asc');

export const allImages = writable<ImageRecord[]>([]);

export const filteredImages = derived(
	[allImages, searchQuery, selectedTags, tagFilterMode, showFavoritesOnly, sortBy, sortOrder],
	([$all, $query, $tags, $mode, $favs, $sort, $order]) => {
		let filtered = $all;

		if ($query) {
			const lowerQuery = $query.toLowerCase();
			filtered = filtered.filter((img) => img.name.toLowerCase().includes(lowerQuery));
		}

		if ($tags.length > 0) {
			if ($mode === 'AND') {
				filtered = filtered.filter((img) => $tags.every((tag) => img.tags.includes(tag)));
			} else {
				filtered = filtered.filter((img) => $tags.some((tag) => img.tags.includes(tag)));
			}
		}

		if ($favs) {
			filtered = filtered.filter((img) => img.favorite);
		}

		filtered.sort((a, b) => {
			let comparison = 0;

			switch ($sort) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'date':
					comparison = a.lastModified - b.lastModified;
					break;
				case 'size':
					comparison = a.size - b.size;
					break;
			}

			return $order === 'asc' ? comparison : -comparison;
		});

		return filtered;
	}
);

// Tag operations
export async function addTagToImage(imageId: number, tagName: string) {
	const image = await db.images.get(imageId);
	if (!image) return;

	if (!image.tags.includes(tagName)) {
		const updatedTags = [...image.tags, tagName];
		await db.images.update(imageId, { tags: updatedTags });

		const tag = await db.tags.get(tagName);
		if (tag) {
			await db.tags.update(tagName, { count: tag.count + 1 });
		} else {
			await db.tags.add({
				name: tagName,
				color: generateRandomColor(),
				count: 1,
				createdAt: Date.now()
			});
		}

		// Refresh tags store to reflect count changes or new tags
		await refreshTags();

		allImages.update($images =>
			$images.map(img => img.id === imageId ? { ...img, tags: updatedTags } : img)
		);
	}
}

export async function removeTagFromImage(imageId: number, tagName: string) {
	const image = await db.images.get(imageId);
	if (!image) return;

	const updatedTags = image.tags.filter((t) => t !== tagName);
	await db.images.update(imageId, { tags: updatedTags });

	const tag = await db.tags.get(tagName);
	if (tag && tag.count > 0) {
		await db.tags.update(tagName, { count: tag.count - 1 });
	}

	// Refresh tags store to reflect count changes
	await refreshTags();

	allImages.update($images =>
		$images.map(img => img.id === imageId ? { ...img, tags: updatedTags } : img)
	);
}

export async function refreshImagesFromDB() {
	const images = await db.images.toArray();
	allImages.set(images);
}

// Global tags store
export const tags = writable<TagRecord[]>([]);

export async function refreshTags() {
	const allTags = await db.tags.toArray();
	tags.set(allTags);
}

// Initialize tags
refreshTags();


