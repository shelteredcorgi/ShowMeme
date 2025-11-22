import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergeImages } from './images';
import { db } from './schema';

// Mock db
vi.mock('./schema', () => ({
    db: {
        images: {
            toArray: vi.fn(),
            bulkPut: vi.fn(),
            update: vi.fn()
        },
        tags: {
            toArray: vi.fn().mockResolvedValue([]),
            update: vi.fn()
        }
    }
}));

describe('Image Database Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mergeImages', () => {
        it('preserves tags and favorites for existing images', async () => {
            // Setup existing image in DB
            const existingImage = {
                id: 1,
                path: 'test.jpg',
                name: 'test.jpg',
                tags: ['funny'],
                favorite: true,
                dateAdded: 1000
            };

            (db.images.toArray as any).mockResolvedValue([existingImage]);

            // New scan result (fresh state)
            const newScanResult = [{
                path: 'test.jpg',
                name: 'test.jpg',
                size: 1024,
                lastModified: 2000,
                directoryHandle: 'test',
                tags: [], // Scan returns empty tags
                favorite: false, // Scan returns false
                dateAdded: 2000
            }];

            await mergeImages(newScanResult as any);

            // Verify bulkPut was called with preserved metadata
            expect(db.images.bulkPut).toHaveBeenCalledWith([
                expect.objectContaining({
                    path: 'test.jpg',
                    tags: ['funny'], // Should keep 'funny'
                    favorite: true   // Should keep true
                })
            ]);
        });

        it('adds new images correctly', async () => {
            (db.images.toArray as any).mockResolvedValue([]);

            const newImage = {
                path: 'new.jpg',
                name: 'new.jpg',
                tags: [],
                favorite: false
            };

            await mergeImages([newImage] as any);

            expect(db.images.bulkPut).toHaveBeenCalledWith([
                expect.objectContaining({
                    path: 'new.jpg'
                })
            ]);
        });
    });
});
