/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				accent: 'var(--color-accent)',
				bg: 'var(--color-bg)',
				text: 'var(--color-text)',
				border: 'var(--color-border)'
			}
		}
	},
	plugins: []
};


