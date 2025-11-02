import { vi } from 'vitest';
import { afterAll } from 'vitest';

// Mock IndexedDB for tests
global.indexedDB = {
	open: vi.fn(),
	deleteDatabase: vi.fn()
} as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}`);
global.URL.revokeObjectURL = vi.fn();

// Cleanup after all tests
afterAll(() => {
	// Force cleanup of any remaining mocks
	vi.clearAllMocks();
});
