import { isTauri } from '$lib/utils/tauri-helpers';

const HANDLE_STORAGE_KEY = 'dir-handle';
const TAURI_PATH_STORAGE_KEY = 'tauri-dir-path';

export async function persistDirectoryHandle(
	handle: FileSystemDirectoryHandle | string
): Promise<void> {
	if (isTauri() && typeof handle === 'string') {
		// In Tauri, just store the path
		localStorage.setItem(TAURI_PATH_STORAGE_KEY, handle);
	} else if (typeof handle !== 'string') {
		// In browser, store the FileSystemDirectoryHandle
		const db = await openHandleDB();
		const transaction = db.transaction('handles', 'readwrite');
		const store = transaction.objectStore('handles');
		await store.put(handle, HANDLE_STORAGE_KEY);
	}
}

export async function restoreDirectoryHandle(): Promise<FileSystemDirectoryHandle | string | null> {
	// In Tauri, return the stored path string
	if (isTauri()) {
		const path = localStorage.getItem(TAURI_PATH_STORAGE_KEY);
		return path || null;
	}

	// In browser, return FileSystemDirectoryHandle
	try {
		const db = await openHandleDB();
		const transaction = db.transaction('handles', 'readonly');
		const store = transaction.objectStore('handles');
		const request = store.get(HANDLE_STORAGE_KEY);

		const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});

		if (!handle) return null;

		// Verify permissions (but don't request - user must click button for that)
		if ('queryPermission' in handle) {
			const permission = await (handle as any).queryPermission({ mode: 'read' });
			if (permission === 'granted') {
				return handle;
			}
		} else {
			// If queryPermission is not available, assume permission is granted
			return handle;
		}

		// Permission not granted - user will need to re-select directory
		console.log('Directory handle found but permission not granted. User must re-select directory.');
		return null;
	} catch (err: any) {
		console.log('Could not restore directory handle:', err.message);
		return null;
	}
}

function openHandleDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('FileSystemHandles', 1);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onupgradeneeded = () => {
			request.result.createObjectStore('handles');
		};
	});
}

