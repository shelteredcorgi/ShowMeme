import { PERFORMANCE_CONFIG } from '$lib/config/constants';

type ThumbnailTask = () => Promise<void>;

class ThumbnailQueue {
	private queue: ThumbnailTask[] = [];
	private activeCount = 0;
	private readonly maxConcurrent = PERFORMANCE_CONFIG.MAX_CONCURRENT_THUMBNAILS;

	async add<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			const wrappedTask = async () => {
				try {
					const result = await task();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			};

			this.queue.push(wrappedTask);
			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
			return;
		}

		this.activeCount++;
		const task = this.queue.shift();

		if (task) {
			try {
				await task();
			} finally {
				this.activeCount--;
				this.processQueue();
			}
		}
	}
}

export const thumbnailQueue = new ThumbnailQueue();
