<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	const variantClasses = {
		primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-border disabled:text-text-muted shadow-sm hover:shadow-md',
		secondary: 'bg-surface text-text border border-border hover:bg-bg hover:border-text-muted/50',
		ghost: 'bg-transparent hover:bg-surface text-text-muted hover:text-text'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	{type}
	{disabled}
	on:click
	class="rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 {variantClasses[variant]} {sizeClasses[size]} {$$props.class || ''}"
>
	<slot />
</button>

