# Nexus Pass Vault Desktop

A secure password vault application built with Electron, Svelte, and TypeScript.

## Features

- **Secure Storage**: Encrypted password vault
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Modern UI**: Built with Svelte for optimal performance
- **Type-Safe**: Full TypeScript support

## Development

### Prerequisites

- Node.js 22.12+
- npm or yarn

### Setup

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This starts Electron, the preload process, and the Svelte renderer together. Changes to
the renderer hot-reload; changes to the main or preload process restart Electron.

## Production Build

### Build for Production

```bash
npm run build
```

This uses `electron-vite` to bundle the main, preload, and renderer processes into `out/`.

### Create Installer

```bash
npm run package
```

This creates installers for your **current platform only**:
- **On macOS**: `.dmg` and `.zip` files
- **On Windows**: NSIS installer and portable `.exe`
- **On Linux**: AppImage and `.deb` files

### Multi-Platform Builds

To generate installers for **all platforms** (macOS, Windows, Linux), use the automated GitHub Actions workflow:

1. Push your code to GitHub
2. Create a tag: `git tag v1.0.0 && git push --tags`
3. GitHub Actions automatically builds on all platforms
4. Download artifacts or create a release with all installers

**Alternative: Build Locally on Each Platform**

```bash
# On macOS
npm run package  # Creates .dmg and .zip

# On Windows
npm run package  # Creates .exe files

# On Linux
npm run package  # Creates AppImage and .deb
```

See `.github/workflows/build.yml` for the automated CI/CD setup.

### Available Scripts

- `npm run dev` - Start Electron with Svelte hot reload
- `npm run build` - Bundle all Electron processes with electron-vite
- `npm run package` - Build installers with electron-builder
- `npm run dist` - Build installers (alias for `package`)

## Architecture

```
src/
├── main/           # Main Electron process
│   └── index.ts    # App initialization & window management
├── preload/        # Preload script (IPC bridge)
│   └── index.ts    # Safe API exposure
└── renderer/       # UI layer
    ├── App.svelte  # Root component
    └── main.ts     # App mount point
```

## Security Considerations

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Preload script for controlled IPC
- ✅ No remote content loaded
- ✅ Menu bar hidden in production

## Configuration

### Electron Builder (package.json)

The `build` section in `package.json` configures:
- App ID and product name
- Platform-specific installers
- Icon and assets paths
- Installation options

### TypeScript

- Strict mode enabled for type safety
- ES modules with proper bundling
- Production optimizations (no sourcemaps, minified)

### electron-vite

- Bundles the Electron main process, preload script, and Svelte renderer without separate TypeScript build steps
- Starts and connects the renderer development server automatically
- Uses `electron.vite.config.ts` only to enable the Svelte plugin and externalize Electron-process dependencies

## Troubleshooting

### Build fails with Node version warnings
Ensure Node.js 22.12+:
```bash
node --version
```

### Preload script not found
`electron-vite` writes the preload bundle to `out/preload/index.mjs`. The main process
loads that path automatically after the production build.

## License

MIT

## Repository

https://github.com/dasmido/nexus-pass-vault-desktop
