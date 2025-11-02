import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanDirectoryRecursive, isImageFile } from './scanner';
import type { ImageRecord } from '$lib/db/schema';

// Mock Tauri imports
vi.mock('@tauri-apps/plugin-fs', () => ({
	readDir: vi.fn(),
	stat: vi.fn()
}));

describe('File System Scanner', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('isImageFile', () => {
		it('identifies image files correctly', () => {
			expect(isImageFile('photo.jpg')).toBe(true);
			expect(isImageFile('image.png')).toBe(true);
			expect(isImageFile('meme.gif')).toBe(true);
			expect(isImageFile('pic.webp')).toBe(true);
			expect(isImageFile('image.JPG')).toBe(true);
			expect(isImageFile('image.PNG')).toBe(true);
		});

		it('rejects non-image files', () => {
			expect(isImageFile('document.pdf')).toBe(false);
			expect(isImageFile('video.mp4')).toBe(false);
			expect(isImageFile('text.txt')).toBe(false);
			expect(isImageFile('script.js')).toBe(false);
		});
	});

	describe('scanDirectoryRecursive', () => {
		it('scans Tauri directory paths', async () => {
			const { readDir, stat } = await import('@tauri-apps/plugin-fs');
			
			vi.mocked(readDir).mockResolvedValue([
				{ name: 'photo.jpg', isFile: true, isDirectory: false }
			] as any);
			
			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: new Date().toISOString()
			} as any);

			const images = await scanDirectoryRecursive('/test/path', '');

			expect(readDir).toHaveBeenCalled();
			expect(images.length).toBe(1);
			expect(images[0].name).toBe('photo.jpg');
		});

		it('handles browser FileSystemDirectoryHandle', async () => {
			const mockHandle = {
				name: 'test',
				values: async function* () {
					yield {
						name: 'photo.jpg',
						kind: 'file',
						getFile: async () => ({
							size: 1024,
							lastModified: Date.now()
						})
					};
				}
			} as any;

			const images = await scanDirectoryRecursive(mockHandle, '');

			expect(images.length).toBeGreaterThan(0);
			expect(images[0].name).toBe('photo.jpg');
		});

		it('recursively scans subdirectories', async () => {
			const { readDir, stat } = await import('@tauri-apps/plugin-fs');
			
			vi.mocked(readDir)
				.mockResolvedValueOnce([
					{ name: 'subfolder', isFile: false, isDirectory: true }
				] as any)
				.mockResolvedValueOnce([
					{ name: 'nested.jpg', isFile: true, isDirectory: false }
				] as any);
			
			vi.mocked(stat).mockResolvedValue({
				size: 1024,
				mtime: new Date().toISOString()
			} as any);

			const images = await scanDirectoryRecursive('/test/path', '', undefined, '/test/path');

			expect(readDir).toHaveBeenCalledTimes(2);
			expect(images.length).toBe(1);
			expect(images[0].name).toBe('nested.jpg');
		});
	});
});

