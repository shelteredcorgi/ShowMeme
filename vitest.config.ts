import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		testTimeout: 10000,
		teardownTimeout: 2000,
		// Use single worker to minimize issues
		maxWorkers: 1,
		minWorkers: 1
	}
});
