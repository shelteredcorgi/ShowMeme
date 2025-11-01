import Dexie, { type Table } from 'dexie';

export interface ImageRecord {
	id?: number; // Auto-increment primary key
	path: string; // Unique: relative path from directory root
	name: string; // File name
	size: number; // File size in bytes
	lastModified: number; // Timestamp
	directoryHandle: string; // Serialized directory handle ID
	thumbnailBlob?: Blob; // Cached thumbnail (optional)
	tags: string[]; // Array of tag names
	favorite: boolean; // Quick filter flag
	dateAdded: number; // When first scanned
}

export interface TagRecord {
	name: string; // Primary key
	color: string; // Hex color (#RRGGBB)
	count: number; // Number of images with this tag
	createdAt: number; // Timestamp
}

export interface DirectoryRecord {
	id: string; // Unique ID for handle
	name: string; // Directory name
	lastScanned: number; // Last scan timestamp
	imageCount: number; // Total images
}

export class ShowMemeDB extends Dexie {
	images!: Table<ImageRecord, number>;
	tags!: Table<TagRecord, string>;
	directories!: Table<DirectoryRecord, string>;

	constructor() {
		super('ShowMemeDB');

		this.version(1).stores({
			images: '++id, path, name, lastModified, directoryHandle, *tags, favorite',
			tags: 'name, count',
			directories: 'id, lastScanned'
		});
	}
}

export const db = new ShowMemeDB();


