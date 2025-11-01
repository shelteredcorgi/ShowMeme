import { db, type TagRecord } from './schema';

export async function createTag(name: string, color: string): Promise<void> {
	const existing = await db.tags.get(name);
	if (existing) {
		return;
	}

	await db.tags.add({
		name,
		color,
		count: 0,
		createdAt: Date.now()
	});
}

export async function getAllTags(): Promise<TagRecord[]> {
	return await db.tags.toArray();
}

export async function deleteTag(name: string): Promise<void> {
	// Remove tag from all images
	const images = await db.images.where('tags').equals(name).toArray();

	for (const image of images) {
		const updatedTags = image.tags.filter((t) => t !== name);
		await db.images.update(image.id!, { tags: updatedTags });
	}

	// Delete the tag
	await db.tags.delete(name);
}

export async function updateTagColor(name: string, color: string): Promise<void> {
	await db.tags.update(name, { color });
}

export function generateRandomColor(): string {
	const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
	return colors[Math.floor(Math.random() * colors.length)];
}


