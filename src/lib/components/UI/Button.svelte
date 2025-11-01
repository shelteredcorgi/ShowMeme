<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	const variantClasses = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
		secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200',
		ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
	};

	const sizeClasses = {
		sm: 'px-2 py-1 text-sm',
		md: 'px-4 py-2',
		lg: 'px-6 py-3 text-lg'
	};
</script>

<button
	{type}
	{disabled}
	on:click
	class="rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 {variantClasses[variant]} {sizeClasses[size]}"
>
	<slot />
</button>

