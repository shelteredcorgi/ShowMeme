import { currentDirectory } from '$lib/stores/directory';
import { get } from 'svelte/store';
import { memoryManager } from '$lib/cache/memory-manager';

const fileCache = new Map<string, File>();
const tauriUrlCache = new Map<string, string>();

// Detect Tauri environment
function isTauriEnvironment(): boolean {
	return typeof window !== 'undefined' &&
	       (window as any).__TAURI_INTERNALS__ !== undefined;
}

export async function getFileFromPath(path: string): Promise<File | null> {
	const dirHandle = get(currentDirectory);
	if (!dirHandle) return null;

	// Tauri path-based file system
	if (typeof dirHandle === 'string') {
		// Check cache first
		if (fileCache.has(path)) {
			return fileCache.get(path)!;
		}

		try {
			const { readFile } = await import('@tauri-apps/plugin-fs');
			const fullPath = `${dirHandle}/${path}`;
			const contents = await readFile(fullPath);

			// Convert Uint8Array to File
			const fileName = path.split('/').pop() || path;
			const file = new File([contents], fileName, {
				type: getImageMimeType(fileName)
			});

			// Cache it
			fileCache.set(path, file);
			return file;
		} catch (err) {
			console.error(`Failed to load file ${path} in Tauri:`, err);
			return null;
		}
	}
	// Browser FileSystemDirectoryHandle
	else {
		// Check cache first
		if (fileCache.has(path)) {
			return fileCache.get(path)!;
		}

		try {
			const pathParts = path.split('/');
			let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = dirHandle;

			// Navigate to the file
			for (let i = 0; i < pathParts.length - 1; i++) {
				if (currentHandle.kind === 'directory') {
					currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
				}
			}

			// Get the file
			if (currentHandle.kind === 'directory') {
				const fileName = pathParts[pathParts.length - 1];
				const fileHandle = await currentHandle.getFileHandle(fileName);
				const file = await fileHandle.getFile();

				// Cache it
				fileCache.set(path, file);

				return file;
			}
		} catch (err) {
			console.error(`Failed to load file ${path}:`, err);
		}

		return null;
	}
}

export async function createImageURL(file: File, key: string): Promise<string> {
	// Always use blob URLs - they work in both Tauri and browser
	return memoryManager.createObjectURL(file, key);
}

function getImageMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	const mimeTypes: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
		bmp: 'image/bmp',
		svg: 'image/svg+xml'
	};
	return mimeTypes[ext || ''] || 'image/jpeg';
}

export function clearFileCache() {
	fileCache.clear();
}

