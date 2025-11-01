<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/utils/click-outside';

	export let open = false;

	const dispatch = createEventDispatcher();

	function toggle() {
		open = !open;
	}

	function handleClickOutside() {
		if (open) {
			open = false;
			dispatch('close');
		}
	}
</script>

<div class="relative" use:clickOutside on:click_outside={handleClickOutside}>
	<button
		on:click={toggle}
		class="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 {open
			? 'bg-gray-100 dark:bg-gray-800'
			: ''}"
	>
		<slot name="trigger" />
	</button>

	{#if open}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<slot />
		</div>
	{/if}
</div>

