<script lang="ts">
	import { notifications, type Notification } from '$lib/stores/notifications';
	import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

	let notificationList: Notification[] = [];
	$: notificationList = $notifications;

	function getIcon(type: Notification['type']) {
		switch (type) {
			case 'success': return CheckCircle;
			case 'error': return AlertCircle;
			case 'warning': return AlertTriangle;
			case 'info': return Info;
		}
	}

	function getColorClasses(type: Notification['type']) {
		switch (type) {
			case 'success': return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
			case 'error': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
			case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
			case 'info': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-full px-4">
	{#each notificationList as notification (notification.id)}
		<div
			class="flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all {getColorClasses(notification.type)}"
			role="alert"
		>
			<svelte:component this={getIcon(notification.type)} size={20} class="flex-shrink-0 mt-0.5" />
			<p class="flex-1 text-sm">{notification.message}</p>
			<button
				on:click={() => notifications.dismiss(notification.id)}
				class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
				aria-label="Dismiss"
			>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>
