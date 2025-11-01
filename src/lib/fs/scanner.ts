import type { ImageRecord } from '$lib/db/schema';

export class ScanError extends Error {
	constructor(
		message: string,
		public code: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'QUOTA_EXCEEDED'
	) {
		super(message);
	}
}

// Detect if running in Tauri by checking for window.__TAURI_INTERNALS__
function isTauriEnvironment(): boolean {
	return typeof window !== 'undefined' &&
	       (window as any).__TAURI_INTERNALS__ !== undefined;
}

export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | string | null> {
	const isTauri = isTauriEnvironment();
	console.log('requestDirectoryAccess - isTauri:', isTauri);

	// Try Tauri first
	if (isTauri) {
		console.log('Attempting to use Tauri dialog...');
		try {
			const { open } = await import('@tauri-apps/plugin-dialog');
			console.log('Tauri dialog imported successfully');
			const selected = await open({
				directory: true,
				multiple: false,
				title: 'Select Image Directory'
			});
			console.log('Tauri dialog returned:', selected);
			return selected as string | null;
		} catch (err) {
			console.error('Tauri dialog error:', err);
			alert('Failed to open directory picker: ' + (err as Error).message);
			return null;
		}
	}

	// Use browser File System Access API
	console.log('Attempting to use browser showDirectoryPicker...');
	if ('showDirectoryPicker' in window && typeof (window as any).showDirectoryPicker === 'function') {
		try {
			const handle = await (window as any).showDirectoryPicker({
				mode: 'read',
				startIn: 'pictures'
			});
			return handle;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') {
				return null; // User cancelled
			}
			throw err;
		}
	}

	// No file picker available
	console.error('No file picker available');
	alert('File picker not supported in this environment');
	return null;
}

export async function scanDirectoryRecursive(
	dirHandle: FileSystemDirectoryHandle | string,
	relativePath = '',
	onProgress?: (current: number) => void,
	basePath?: string
): Promise<ImageRecord[]> {
	const images: ImageRecord[] = [];

	// Tauri path
	if (typeof dirHandle === 'string') {
		try {
			const { readDir, stat } = await import('@tauri-apps/plugin-fs');
			const entries = await readDir(dirHandle);
			const dirName = basePath || dirHandle.split('/').pop() || dirHandle;

			for (const entry of entries) {
				const fullPath = `${dirHandle}/${entry.name}`;
				const currentPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

				if (entry.isFile) {
					if (isImageFile(entry.name)) {
						try {
							const fileStat = await stat(fullPath);
							images.push({
								path: currentPath,
								name: entry.name,
								size: fileStat.size,
								lastModified: fileStat.mtime ? new Date(fileStat.mtime).getTime() : Date.now(),
								directoryHandle: dirName,
								tags: [],
								favorite: false,
								dateAdded: Date.now()
							});
							onProgress?.(images.length);
						} catch (err) {
							console.warn(`Failed to process ${entry.name}:`, err);
						}
					}
				} else if (entry.isDirectory) {
					// Recursive scan
					const subImages = await scanDirectoryRecursive(fullPath, currentPath, onProgress, basePath || dirHandle);
					images.push(...subImages);
				}
			}
		} catch (err: unknown) {
			console.error('Failed to scan directory in Tauri:', err);
			throw new ScanError('Failed to scan directory', 'PERMISSION_DENIED');
		}
	}
	// Browser FileSystemDirectoryHandle
	else {
		try {
			for await (const entry of dirHandle.values()) {
				const currentPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

				if (entry.kind === 'file') {
					if (isImageFile(entry.name)) {
						try {
							const file = await entry.getFile();
							images.push({
								path: currentPath,
								name: entry.name,
								size: file.size,
								lastModified: file.lastModified,
								directoryHandle: dirHandle.name,
								tags: [],
								favorite: false,
								dateAdded: Date.now()
							});
							onProgress?.(images.length);
						} catch (err) {
							console.warn(`Failed to process ${entry.name}:`, err);
						}
					}
				} else if (entry.kind === 'directory') {
					// Recursive scan
					const subImages = await scanDirectoryRecursive(entry, currentPath, onProgress);
					images.push(...subImages);
				}
			}
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'NotAllowedError') {
				throw new ScanError('Permission denied', 'PERMISSION_DENIED');
			}
			throw err;
		}
	}

	return images;
}

function isImageFile(filename: string): boolean {
	const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i;
	return imageExtensions.test(filename);
}

