import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateRandomColor, createTag, deleteTag } from './tags';
import { db } from './schema';
import type { TagRecord, ImageRecord } from './schema';

// Mock Dexie database
vi.mock('./schema', () => {
	const mockDb = {
		tags: {
			get: vi.fn(),
			add: vi.fn(),
			delete: vi.fn()
		},
		images: {
			where: vi.fn(() => ({
				equals: vi.fn(() => ({
					toArray: vi.fn()
				}))
			})),
			update: vi.fn()
		}
	};

	return {
		db: mockDb,
		ShowMemeDB: vi.fn()
	};
});

describe('Tag System', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generateRandomColor', () => {
		it('returns valid hex color', () => {
			const color = generateRandomColor();
			expect(color).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});

	describe('createTag', () => {
		it('creates a new tag', async () => {
			vi.mocked(db.tags.get).mockResolvedValue(undefined);
			vi.mocked(db.tags.add).mockResolvedValue(undefined);

			await createTag('meme', '#ff0000');

			expect(db.tags.get).toHaveBeenCalledWith('meme');
			expect(db.tags.add).toHaveBeenCalledWith({
				name: 'meme',
				color: '#ff0000',
				count: 0,
				createdAt: expect.any(Number)
			});
		});

		it('prevents duplicate tags', async () => {
			const existingTag: TagRecord = {
				name: 'meme',
				color: '#ff0000',
				count: 5,
				createdAt: Date.now()
			};
			vi.mocked(db.tags.get).mockResolvedValue(existingTag);

			await createTag('meme', '#0000ff');

			expect(db.tags.add).not.toHaveBeenCalled();
		});
	});

	describe('deleteTag', () => {
		it('removes tag from all images', async () => {
			const images: ImageRecord[] = [
				{
					id: 1,
					path: 'img1.jpg',
					name: 'img1.jpg',
					size: 1024,
					lastModified: Date.now(),
					directoryHandle: 'test',
					tags: ['funny', 'meme'],
					favorite: false,
					dateAdded: Date.now()
				},
				{
					id: 2,
					path: 'img2.jpg',
					name: 'img2.jpg',
					size: 1024,
					lastModified: Date.now(),
					directoryHandle: 'test',
					tags: ['meme'],
					favorite: false,
					dateAdded: Date.now()
				}
			];

			const imageWhereMock = vi.fn(() => ({
				equals: vi.fn(() => ({
					toArray: vi.fn().mockResolvedValue(images)
				}))
			}));
			vi.mocked(db.images.where).mockReturnValue(imageWhereMock() as any);

			await deleteTag('meme');

			expect(db.images.update).toHaveBeenCalledWith(1, { tags: ['funny'] });
			expect(db.images.update).toHaveBeenCalledWith(2, { tags: [] });
			expect(db.tags.delete).toHaveBeenCalledWith('meme');
		});
	});
});
