import { persisted } from 'svelte-persisted-store';

export const viewMode = persisted<'grid' | 'list'>('view-mode', 'grid');
export const gridColumns = persisted<3 | 4 | 5 | 6>('grid-columns', 4);
export const showSidebar = persisted('show-sidebar', true);
export const lastDirectoryId = persisted<string | undefined>('last-directory-id', undefined);

