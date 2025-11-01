import { writable } from 'svelte/store';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: number;
	type: NotificationType;
	message: string;
	duration?: number;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);
	let nextId = 1;

	return {
		subscribe,
		show: (type: NotificationType, message: string, duration = 5000) => {
			const notification: Notification = {
				id: nextId++,
				type,
				message,
				duration
			};

			update(notifications => [...notifications, notification]);

			if (duration > 0) {
				setTimeout(() => {
					update(notifications => notifications.filter(n => n.id !== notification.id));
				}, duration);
			}

			return notification.id;
		},
		dismiss: (id: number) => {
			update(notifications => notifications.filter(n => n.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};
}

export const notifications = createNotificationStore();
