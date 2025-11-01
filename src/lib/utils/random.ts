import { get } from 'svelte/store';
import { filteredImages } from '$lib/stores/filters';
import type { ImageRecord } from '$lib/db/schema';

export function getRandomImage(): ImageRecord | null {
	const images = get(filteredImages);
	if (images.length === 0) return null;

	// Weighted random selection: favorites have 2x weight
	const totalWeight = images.reduce((sum, img) => sum + (img.favorite ? 2 : 1), 0);
	let random = Math.random() * totalWeight;

	for (const img of images) {
		const weight = img.favorite ? 2 : 1;
		random -= weight;
		if (random <= 0) return img;
	}

	return images[images.length - 1];
}

