import type { ImageRecord } from '$lib/db/schema';

interface WebKitFile extends Omit<File, 'webkitRelativePath'> {
	webkitRelativePath?: string;
}

export function hasFileSystemAccess(): boolean {
	return 'showDirectoryPicker' in window;
}

export async function scanDirectoryFallback(input: HTMLInputElement): Promise<ImageRecord[]> {
	const files = Array.from(input.files || []);

	return files
		.filter((file) => file.type.startsWith('image/'))
		.map((file) => ({
			path: (file as WebKitFile).webkitRelativePath || file.name,
			name: file.name,
			size: file.size,
			lastModified: file.lastModified,
			directoryHandle: 'fallback',
			tags: [],
			favorite: false,
			dateAdded: Date.now()
		}));
}

