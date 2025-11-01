import { db, type ImageRecord } from '$lib/db/schema';
import { memoryManager } from './memory-manager';
import { CACHE_CONFIG } from '$lib/config/constants';

export async function generateThumbnail(file: File): Promise<Blob> {
	if (file.size > CACHE_CONFIG.MAX_IMAGE_SIZE) {
		throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${CACHE_CONFIG.MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
	}

	const bitmap = await createImageBitmap(file, {
		resizeWidth: CACHE_CONFIG.THUMBNAIL_WIDTH,
		resizeHeight: CACHE_CONFIG.THUMBNAIL_HEIGHT,
		resizeQuality: 'medium'
	});

	const canvas = new OffscreenCanvas(CACHE_CONFIG.THUMBNAIL_WIDTH, CACHE_CONFIG.THUMBNAIL_HEIGHT);
	const ctx = canvas.getContext('2d')!;

	// White background for transparency
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, CACHE_CONFIG.THUMBNAIL_WIDTH, CACHE_CONFIG.THUMBNAIL_HEIGHT);

	// Center image while maintaining aspect ratio
	const scale = Math.min(
		CACHE_CONFIG.THUMBNAIL_WIDTH / bitmap.width,
		CACHE_CONFIG.THUMBNAIL_HEIGHT / bitmap.height
	);
	const scaledWidth = bitmap.width * scale;
	const scaledHeight = bitmap.height * scale;
	const x = (CACHE_CONFIG.THUMBNAIL_WIDTH - scaledWidth) / 2;
	const y = (CACHE_CONFIG.THUMBNAIL_HEIGHT - scaledHeight) / 2;

	ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);

	return await canvas.convertToBlob({
		type: 'image/webp',
		quality: CACHE_CONFIG.THUMBNAIL_QUALITY
	});
}

export async function getThumbnailURL(imageRecord: ImageRecord): Promise<string | null> {
	const cachedUrl = memoryManager.getURL(`thumb-${imageRecord.id}`);
	if (cachedUrl) {
		return cachedUrl;
	}

	if (imageRecord.thumbnailBlob) {
		return memoryManager.createObjectURL(imageRecord.thumbnailBlob, `thumb-${imageRecord.id}`);
	}

	return null;
}

export async function cacheThumbnail(imageId: number, blob: Blob): Promise<void> {
	await db.images.update(imageId, { thumbnailBlob: blob });
}

