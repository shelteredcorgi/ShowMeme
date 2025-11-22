/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Outfit', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			colors: {
				accent: 'var(--color-accent)',
				'accent-hover': 'var(--color-accent-hover)',
				bg: 'var(--color-bg)',
				surface: 'var(--color-surface)',
				text: 'var(--color-text)',
				'text-muted': 'var(--color-text-muted)',
				border: 'var(--color-border)',
				danger: 'var(--color-danger)',
			}
		}
	},
	plugins: []
};


