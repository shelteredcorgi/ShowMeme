# ShowMeme

Organize your meme collection without uploading anything to the cloud. Everything runs in your browser or as a native desktop app.

## Features

- **Privacy-first**: All processing happens locally. Your images never leave your device.
- **Fast**: Handles thousands of images with virtual scrolling and smart caching.
- **Tagging**: Organize images with tags and filter using AND/OR logic.
- **Multiple views**: Grid, list, and lightbox modes.
- **Favorites**: Mark favorites and use weighted random selection.
- **Keyboard shortcuts**: Quick navigation with hotkeys.
- **Data portability**: Export and import your tags and metadata.
- **Native Desktop App**: Tauri-based desktop application for macOS, Windows, and Linux.

## Tech Stack

- **Frontend**: SvelteKit 2, TypeScript, Tailwind CSS
- **Storage**: Dexie (IndexedDB)
- **Desktop**: Tauri 2
- **File System**: File System Access API (browser) / Tauri FS plugin (desktop)

## Getting Started

**Requirements:** Node.js 18+, Rust 1.70+ (for desktop builds)

### Development

```bash
git clone https://github.com/shelteredcorgi/showmeme.git
cd ShowMeme
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Desktop App Development

```bash
npm run tauri:dev
```

### Production Build

**Web:**
```bash
npm run build
npm run preview
```

**Desktop:**
```bash
npm run tauri:build
```

## Usage

1. Click "Select Directory" in the sidebar to choose your image folder
2. Wait for the scan to complete (includes subdirectories)
3. Click an image to open the lightbox and add tags
4. Use the sidebar to filter by tags or search by filename
5. Switch between grid and list views with the header buttons or `G`/`L` keys

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Switch to Grid View |
| `L` | Switch to List View |
| `R` | Show Random Image |
| `T` | Toggle Sidebar |
| `←` / `→` | Navigate in Lightbox |
| `Esc` | Close Lightbox |

## Browser Support

Works best in Chrome/Edge 86+, Opera 72+, and Safari 15.2+. Browsers without File System Access API will use a fallback with some limitations.

## Privacy

- No network requests - everything runs locally
- No analytics or tracking
- No cloud sync
- Your data never leaves your device

## How It Works

ShowMeme stores metadata (paths, tags, favorites) and generated thumbnails in IndexedDB. Preferences are in localStorage. Your original image files are never modified.

## Contributing

Pull requests welcome! Feel free to open issues for bugs or feature requests.

## License

MIT - use this for personal or commercial projects.