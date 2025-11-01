import { CACHE_CONFIG } from '$lib/config/constants';

class MemoryManager {
	private objectURLs = new Map<string, string>();
	private readonly MAX_CACHED_URLS = CACHE_CONFIG.MAX_OBJECT_URLS;
	private urlOrder: string[] = [];

	createObjectURL(blob: Blob, key: string): string {
		const existing = this.objectURLs.get(key);
		if (existing) {
			// Update LRU on cache hit
			const index = this.urlOrder.indexOf(key);
			if (index > -1) {
				this.urlOrder.splice(index, 1);
				this.urlOrder.push(key);
			}
			return existing;
		}

		const url = URL.createObjectURL(blob);
		this.objectURLs.set(key, url);
		this.urlOrder.push(key);

		if (this.objectURLs.size > this.MAX_CACHED_URLS) {
			this.evictOldest();
		}

		return url;
	}

	revokeObjectURL(key: string) {
		const url = this.objectURLs.get(key);
		if (url) {
			URL.revokeObjectURL(url);
			this.objectURLs.delete(key);
			this.urlOrder = this.urlOrder.filter((k) => k !== key);
		}
	}

	private evictOldest() {
		if (this.urlOrder.length === 0) return;

		const oldest = this.urlOrder.shift()!;
		const url = this.objectURLs.get(oldest);
		if (url) {
			URL.revokeObjectURL(url);
			this.objectURLs.delete(oldest);
		}
	}

	cleanup() {
		this.objectURLs.forEach((url) => URL.revokeObjectURL(url));
		this.objectURLs.clear();
		this.urlOrder = [];
	}

	getURL(key: string): string | undefined {
		return this.objectURLs.get(key);
	}
}

export const memoryManager = new MemoryManager();

