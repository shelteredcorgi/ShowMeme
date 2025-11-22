import { db, type ImageRecord } from './schema';

export async function addImages(records: Omit<ImageRecord, 'id'>[]) {
	return await db.images.bulkAdd(records);
}

export async function mergeImages(newRecords: Omit<ImageRecord, 'id'>[]) {
	// Get all existing images to check for duplicates and preserve metadata
	const existingImages = await db.images.toArray();
	const existingMap = new Map(existingImages.map(img => [img.path, img]));

	const recordsToPut: ImageRecord[] = [];

	for (const record of newRecords) {
		const existing = existingMap.get(record.path);
		if (existing) {
			// Preserve ID, tags, favorite status, and dateAdded
			recordsToPut.push({
				...record,
				id: existing.id,
				tags: existing.tags,
				favorite: existing.favorite,
				dateAdded: existing.dateAdded
			});
		} else {
			// New image
			recordsToPut.push(record as ImageRecord);
		}
	}

	// Use bulkPut to update existing and add new
	await db.images.bulkPut(recordsToPut);
	await recalculateTagCounts();
}

export async function updateImageTags(imageId: number, tags: string[]) {
	await db.images.update(imageId, { tags });
	await recalculateTagCounts();
}

export async function getImagesByTags(tags: string[], matchAll = false) {
	if (matchAll) {
		return await db.images
			.where('tags')
			.equals(tags[0])
			.filter((img) => tags.every((tag) => img.tags.includes(tag)))
			.toArray();
	}
	return await db.images.where('tags').anyOf(tags).toArray();
}

export async function toggleFavorite(imageId: number) {
	const image = await db.images.get(imageId);
	if (image) {
		await db.images.update(imageId, { favorite: !image.favorite });
	}
}

export async function deleteImage(imageId: number) {
	await db.images.delete(imageId);
	await recalculateTagCounts();
}

export async function recalculateTagCounts() {
	const allImages = await db.images.toArray();
	const tagCounts = new Map<string, number>();

	allImages.forEach((img) => {
		img.tags.forEach((tag) => {
			tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
		});
	});

	// Get all existing tags
	const existingTags = await db.tags.toArray();

	// Batch update for better performance
	const updates = [];
	for (const [name, count] of tagCounts) {
		updates.push(db.tags.update(name, { count }));
	}

	// Remove tags with zero count
	for (const tag of existingTags) {
		if (!tagCounts.has(tag.name)) {
			updates.push(db.tags.update(tag.name, { count: 0 }));
		}
	}

	// Execute all updates in parallel
	await Promise.all(updates);
}

export async function incrementTagCount(tagName: string) {
	const tag = await db.tags.get(tagName);
	if (tag) {
		await db.tags.update(tagName, { count: tag.count + 1 });
	}
}

export async function decrementTagCount(tagName: string) {
	const tag = await db.tags.get(tagName);
	if (tag && tag.count > 0) {
		await db.tags.update(tagName, { count: tag.count - 1 });
	}
}


