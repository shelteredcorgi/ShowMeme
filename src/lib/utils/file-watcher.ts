import { isTauri } from './tauri-helpers';
import { watch, type WatchEvent } from '@tauri-apps/plugin-fs';

type WatchCallback = (event: WatchEvent) => void;

let currentWatcher: (() => Promise<void>) | null = null;

/**
 * Starts watching a directory for file changes (Tauri only)
 */
export async function startWatching(
	path: string,
	callback: WatchCallback
): Promise<void> {
	if (!isTauri()) {
		console.warn('File watching is only available in Tauri');
		return;
	}

	// Stop existing watcher if any
	await stopWatching();

	try {
		// Start watching the directory recursively
		const unwatch = await watch(
			path,
			(event) => {
				console.log('File system event:', event);
				callback(event);
			},
			{ recursive: true, delayMs: 500 }
		);

		currentWatcher = unwatch;
		console.log(`Started watching directory: ${path}`);
	} catch (err) {
		console.error('Failed to start file watcher:', err);
		throw err;
	}
}

/**
 * Stops the current file watcher
 */
export async function stopWatching(): Promise<void> {
	if (currentWatcher) {
		await currentWatcher();
		currentWatcher = null;
		console.log('Stopped file watcher');
	}
}

/**
 * Checks if a file path is an image based on extension
 */
export function isImageFile(path: string): boolean {
	const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i;
	return imageExtensions.test(path);
}
