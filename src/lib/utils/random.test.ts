import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRandomImage } from './random';
import type { ImageRecord } from '$lib/db/schema';

// Mock the filteredImages store
const mockFilteredImages = vi.fn();
vi.mock('$lib/stores/filters', () => ({
	filteredImages: {
		subscribe: vi.fn((callback: (value: ImageRecord[]) => void) => {
			callback(mockFilteredImages());
			return () => {};
		})
	}
}));

// Mock svelte/store get
vi.mock('svelte/store', async () => {
	const actual = await vi.importActual('svelte/store');
	return {
		...actual,
		get: vi.fn((store: any) => mockFilteredImages())
	};
});

describe('Random Image Selection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns null for empty array', () => {
		mockFilteredImages.mockReturnValue([]);
		expect(getRandomImage()).toBeNull();
	});

	it('returns an image from the array', () => {
		const images: ImageRecord[] = [
			{
				path: 'test1.jpg',
				name: 'test1.jpg',
				size: 1024,
				lastModified: Date.now(),
				directoryHandle: 'test',
				tags: [],
				favorite: false,
				dateAdded: Date.now()
			},
			{
				path: 'test2.jpg',
				name: 'test2.jpg',
				size: 1024,
				lastModified: Date.now(),
				directoryHandle: 'test',
				tags: [],
				favorite: false,
				dateAdded: Date.now()
			}
		];
		mockFilteredImages.mockReturnValue(images);
		const result = getRandomImage();
		expect(result).not.toBeNull();
		expect(images).toContain(result);
	});

	it('favors favorites with 2x weight', () => {
		const images: ImageRecord[] = [
			{
				path: 'normal.jpg',
				name: 'normal.jpg',
				size: 1024,
				lastModified: Date.now(),
				directoryHandle: 'test',
				tags: [],
				favorite: false,
				dateAdded: Date.now()
			},
			{
				path: 'favorite.jpg',
				name: 'favorite.jpg',
				size: 1024,
				lastModified: Date.now(),
				directoryHandle: 'test',
				tags: [],
				favorite: true,
				dateAdded: Date.now()
			}
		];
		mockFilteredImages.mockReturnValue(images);

		// Run multiple times - favorite should appear more often
		const results: ImageRecord[] = [];
		for (let i = 0; i < 100; i++) {
			const result = getRandomImage();
			if (result) results.push(result);
		}

		const favoriteCount = results.filter(img => img.favorite).length;
		// With 2x weight, favorite should be selected more often (roughly 66% of the time)
		expect(favoriteCount).toBeGreaterThan(40);
	});
});
