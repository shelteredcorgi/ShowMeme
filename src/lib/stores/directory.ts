import { writable } from 'svelte/store';

// Can be either FileSystemDirectoryHandle (browser) or string path (Tauri)
export const currentDirectory = writable<FileSystemDirectoryHandle | string | null>(null);
export const isScanning = writable(false);
export const scanProgress = writable(0);

