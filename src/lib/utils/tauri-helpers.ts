// Detect if running in Tauri
export function isTauri(): boolean {
	if (typeof window === 'undefined') return false;

	// Check for Tauri-specific globals
	return '__TAURI__' in window ||
	       '__TAURI_INTERNALS__' in window ||
	       (window as any).__TAURI_INTERNALS__ !== undefined;
}

// Check if running in browser
export function isBrowser(): boolean {
	return !isTauri();
}
