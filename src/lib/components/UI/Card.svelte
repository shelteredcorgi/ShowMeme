<script lang="ts">
	export let clickable = false;
</script>

<div
	class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 {clickable
		? 'cursor-pointer transition-shadow hover:shadow-md'
		: ''}"
	on:click
>
	<slot />
</div>

