import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	allImages,
	searchQuery,
	selectedTags,
	tagFilterMode,
	showFavoritesOnly,
	filteredImages
} from './filters';
import type { ImageRecord } from '$lib/db/schema';

describe('Filtering System', () => {
	const createImage = (
		name: string,
		tags: string[] = [],
		favorite: boolean = false
	): ImageRecord => ({
		id: Math.random(),
		path: name,
		name,
		size: 1024,
		lastModified: Date.now(),
		directoryHandle: 'test',
		tags,
		favorite,
		dateAdded: Date.now()
	});

	beforeEach(() => {
		allImages.set([]);
		searchQuery.set('');
		selectedTags.set([]);
		tagFilterMode.set('OR');
		showFavoritesOnly.set(false);
	});

	describe('Search', () => {
		it('filters images by name', () => {
			const images = [
				createImage('funny-meme.jpg'),
				createImage('serious-photo.png'),
				createImage('another-meme.gif')
			];
			allImages.set(images);

			searchQuery.set('meme');
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(2);
			expect(filtered.map(img => img.name)).toContain('funny-meme.jpg');
			expect(filtered.map(img => img.name)).toContain('another-meme.gif');
		});

		it('is case-insensitive', () => {
			const images = [
				createImage('MEME.jpg'),
				createImage('photo.png')
			];
			allImages.set(images);

			searchQuery.set('meme');
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].name).toBe('MEME.jpg');
		});
	});

	describe('Tag Filtering', () => {
		it('filters by OR mode (any tag matches)', () => {
			const images = [
				createImage('img1.jpg', ['funny']),
				createImage('img2.jpg', ['cute']),
				createImage('img3.jpg', ['funny', 'cute']),
				createImage('img4.jpg', ['other'])
			];
			allImages.set(images);

			selectedTags.set(['funny', 'cute']);
			tagFilterMode.set('OR');
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(3);
			expect(filtered.map(img => img.name)).toContain('img1.jpg');
			expect(filtered.map(img => img.name)).toContain('img2.jpg');
			expect(filtered.map(img => img.name)).toContain('img3.jpg');
		});

		it('filters by AND mode (all tags required)', () => {
			const images = [
				createImage('img1.jpg', ['funny']),
				createImage('img2.jpg', ['cute']),
				createImage('img3.jpg', ['funny', 'cute']),
				createImage('img4.jpg', ['funny', 'cute', 'meme'])
			];
			allImages.set(images);

			selectedTags.set(['funny', 'cute']);
			tagFilterMode.set('AND');
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(2);
			expect(filtered.map(img => img.name)).toContain('img3.jpg');
			expect(filtered.map(img => img.name)).toContain('img4.jpg');
		});
	});

	describe('Favorites', () => {
		it('filters to only favorites', () => {
			const images = [
				createImage('img1.jpg', [], true),
				createImage('img2.jpg', [], false),
				createImage('img3.jpg', [], true)
			];
			allImages.set(images);

			showFavoritesOnly.set(true);
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(2);
			expect(filtered.every(img => img.favorite)).toBe(true);
		});
	});

	describe('Combined Filters', () => {
		it('combines search, tags, and favorites', () => {
			const images = [
				createImage('funny-meme.jpg', ['meme'], true),
				createImage('funny-photo.jpg', ['meme'], false),
				createImage('serious-meme.jpg', ['meme'], true),
				createImage('funny-meme.gif', ['other'], true)
			];
			allImages.set(images);

			searchQuery.set('funny');
			selectedTags.set(['meme']);
			tagFilterMode.set('OR');
			showFavoritesOnly.set(true);
			const filtered = get(filteredImages);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].name).toBe('funny-meme.jpg');
		});
	});
});
