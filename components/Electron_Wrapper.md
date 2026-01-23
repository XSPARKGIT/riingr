# Complete Guide: Wrapping a Web App with Electron and Building macOS .dmg

This guide explains how to wrap any web application (React, Vue, Angular, or any hosted web app) into a native macOS desktop application using Electron, and package it as a `.dmg` file for distribution.

---

## 📋 Overview

**What you'll accomplish:**
- ✅ Wrap a web app (hosted URL or local) in Electron
- ✅ Create a native macOS application (`.app`)
- ✅ Package as a distributable `.dmg` file
- ✅ Set custom app icon and name
- ✅ Configure window behavior and security

**Prerequisites:**
- macOS (for building macOS apps)
- Node.js 16+ and npm installed
- Basic terminal knowledge

---

## 🏗️ Step 1: Project Setup

### 1.1 Create Project Directory

```bash
mkdir desktop-wrapper
cd desktop-wrapper
```

### 1.2 Initialize npm Project

```bash
npm init -y
```

This creates a `package.json` file. You'll edit it in the next steps.

### 1.3 Install Dependencies

Install Electron and electron-builder (for packaging):

```bash
npm install --save-dev electron electron-builder
npm install --save-dev typescript @types/node
npm install --save-dev typescript
```

**What each package does:**
- `electron`: The Electron framework
- `electron-builder`: Builds distributable packages (.dmg, .exe, etc.)
- `typescript`: TypeScript compiler (optional, but recommended)
- `@types/node`: TypeScript types for Node.js

---

## 📝 Step 2: Configure package.json

Edit `package.json` to configure your Electron app:

```json
{
  "name": "your-app-desktop",
  "version": "1.0.0",
  "description": "Your App Description",
  "main": "dist/main.js",
  "scripts": {
    "build:ts": "tsc",
    "start": "npm run build:ts && electron .",
    "dev": "tsc && electron .",
    "dist": "npm run build:ts && electron-builder",
    "dist:mac": "npm run build:ts && electron-builder --mac"
  },
  "keywords": ["electron", "desktop"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.19.27",
    "electron": "^28.3.3",
    "electron-builder": "^24.13.3",
    "typescript": "^5.9.3"
  },
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name",
    "files": [
      "dist/**/*",
      "assets/**/*"
    ],
    "directories": {
      "output": "release"
    },
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "category": "public.app-category.utilities",
      "icon": "assets/icons/mac/icon.icns",
      "extendInfo": {
        "CFBundleName": "Your App Name",
        "CFBundleDisplayName": "Your App Name",
        "LSMinimumSystemVersion": "10.13.0"
      },
      "hardenedRuntime": false,
      "gatekeeperAssess": false
    }
  }
}
```

### Key Configuration Explained:

- **`main`**: Entry point for your Electron app (compiled TypeScript output)
- **`appId`**: Unique identifier (reverse domain notation)
- **`productName`**: Display name of your app
- **`target: "dmg"`**: Builds a macOS disk image
- **`arch: ["x64", "arm64"]`**: Builds for Intel (x64) and Apple Silicon (arm64)
- **`icon`**: Path to your macOS icon file (`.icns` format)

---

## 📁 Step 3: Create Project Structure

Create the following directory structure:

```
desktop-wrapper/
├── src/
│   └── main.ts          # Electron main process
├── assets/
│   ├── icon.png         # Source icon (1024x1024 PNG)
│   └── icons/
│       └── mac/
│           └── icon.icns # macOS icon (generated)
├── dist/                # Compiled TypeScript (auto-generated)
├── release/             # Built packages (auto-generated)
├── package.json
├── tsconfig.json
└── README.md
```

**Create directories:**
```bash
mkdir -p src assets/icons/mac
```

---

## ⚙️ Step 4: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 💻 Step 5: Create Electron Main Process

Create `src/main.ts` - this is the heart of your Electron app:

```typescript
import { app, BrowserWindow, Menu, nativeImage } from "electron";
import * as path from "path";

// Set app name IMMEDIATELY (must be first thing after import)
// This ensures macOS shows the correct name in the dock
app.setName("Your App Name");

// Your deployed app URL (or local file:// path)
const APP_URL = process.env.APP_URL || "https://your-app-url.com";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#ffffff",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      nodeIntegration: false,        // Security: don't expose Node.js
      contextIsolation: true,         // Security: isolate context
      webSecurity: true,              // Security: enable web security
      allowRunningInsecureContent: false,
    },
    icon: (() => {
      const fs = require("fs");
      const appRoot = path.resolve(__dirname, "..");
      
      // Priority: custom .icns → default .icns → .png
      const customIcns = path.join(appRoot, "assets", "icons", "mac", "icon.icns");
      const defaultIcns = path.join(appRoot, "assets", "icon.icns");
      const defaultPng = path.join(appRoot, "assets", "icon.png");
      
      if (fs.existsSync(customIcns)) return customIcns;
      if (fs.existsSync(defaultIcns)) return defaultIcns;
      return defaultPng;
    })(),
    show: false, // Don't show until ready (prevents flash)
  });

  // Load the app URL
  mainWindow.loadURL(APP_URL);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    
    // Focus the window
    if (process.platform === "darwin") {
      app.dock.show();
    }
    mainWindow?.focus();
  });

  // Open DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Your App Name",
          click: () => {
            require("electron").dialog.showMessageBox(mainWindow!, {
              type: "info",
              title: "About Your App Name",
              message: "Your App Name",
              detail: "Version 1.0.0\nYour app description",
            });
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });

    // Window menu for macOS
    template[4].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App initialization
app.whenReady().then(() => {
  // Set dock icon for macOS
  if (process.platform === "darwin" && app.dock) {
    const fs = require("fs");
    const appRoot = path.resolve(__dirname, "..");
    
    const customIcnsPath = path.join(appRoot, "assets", "icons", "mac", "icon.icns");
    const defaultIcnsPath = path.join(appRoot, "assets", "icon.icns");
    const defaultPngPath = path.join(appRoot, "assets", "icon.png");
    
    let iconPath: string;
    if (fs.existsSync(customIcnsPath)) {
      iconPath = customIcnsPath;
    } else if (fs.existsSync(defaultIcnsPath)) {
      iconPath = defaultIcnsPath;
    } else {
      iconPath = defaultPngPath;
    }
    
    // Use nativeImage for better .icns support
    try {
      const iconImage = nativeImage.createFromPath(iconPath);
      if (!iconImage.isEmpty()) {
        app.dock.setIcon(iconImage);
      }
    } catch (error: any) {
      console.error("Failed to set dock icon:", error.message);
    }
  }
  
  createWindow();
  createMenu();

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation (open external links in browser)
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
});
```

### Key Features Explained:

1. **`app.setName()`**: Sets the app name shown in macOS dock (must be called early)
2. **`APP_URL`**: The URL of your web app (can be local or remote)
3. **`BrowserWindow`**: Creates the app window with security settings
4. **`setWindowOpenHandler`**: Opens external links in default browser (security best practice)
5. **Menu creation**: Standard macOS menu bar
6. **Icon handling**: Prioritizes `.icns` files for smooth macOS icons

---

## 🎨 Step 6: Prepare App Icon

### 6.1 Create Source Icon

You need a **1024x1024 PNG** image as your source icon.

**Requirements:**
- Square (1:1 aspect ratio)
- 1024x1024 pixels minimum
- PNG format
- Transparent background (optional)
- Simple, recognizable design

**Save it as:** `assets/icon.png`

### 6.2 Convert to .icns (macOS Icon Format)

macOS uses `.icns` files for smooth, scalable icons. You have several options:

#### Option A: Using electron-builder (Automatic)

`electron-builder` can automatically generate `.icns` from PNG during build, but for best results, create it manually.

#### Option B: Using macOS `iconutil` (Recommended)

```bash
# 1. Create an iconset directory
mkdir -p icon.iconset

# 2. Generate all required sizes from your 1024x1024 source
sips -z 16 16 assets/icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 assets/icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 assets/icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 assets/icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 assets/icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 assets/icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 assets/icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 assets/icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 assets/icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 assets/icon.png --out icon.iconset/icon_512x512@2x.png

# 3. Create Contents.json
cat > icon.iconset/Contents.json << 'EOF'
{
  "images" : [
    {
      "idiom" : "universal",
      "scale" : "1x",
      "size" : "16x16",
      "filename" : "icon_16x16.png"
    },
    {
      "idiom" : "universal",
      "scale" : "2x",
      "size" : "16x16",
      "filename" : "icon_16x16@2x.png"
    },
    {
      "idiom" : "universal",
      "scale" : "1x",
      "size" : "32x32",
      "filename" : "icon_32x32.png"
    },
    {
      "idiom" : "universal",
      "scale" : "2x",
      "size" : "32x32",
      "filename" : "icon_32x32@2x.png"
    },
    {
      "idiom" : "universal",
      "scale" : "1x",
      "size" : "128x128",
      "filename" : "icon_128x128.png"
    },
    {
      "idiom" : "universal",
      "scale" : "2x",
      "size" : "128x128",
      "filename" : "icon_128x128@2x.png"
    },
    {
      "idiom" : "universal",
      "scale" : "1x",
      "size" : "256x256",
      "filename" : "icon_256x256.png"
    },
    {
      "idiom" : "universal",
      "scale" : "2x",
      "size" : "256x256",
      "filename" : "icon_256x256@2x.png"
    },
    {
      "idiom" : "universal",
      "scale" : "1x",
      "size" : "512x512",
      "filename" : "icon_512x512.png"
    },
    {
      "idiom" : "universal",
      "scale" : "2x",
      "size" : "512x512",
      "filename" : "icon_512x512@2x.png"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

# 4. Convert iconset to .icns
iconutil -c icns icon.iconset -o assets/icons/mac/icon.icns

# 5. Cleanup
rm -rf icon.iconset
```

#### Option C: Using Online Tools

1. Go to https://cloudconvert.com/png-to-icns
2. Upload your `assets/icon.png` (1024x1024)
3. Download the `.icns` file
4. Save as `assets/icons/mac/icon.icns`

#### Option D: Using Image2icon (Mac App Store)

1. Download Image2icon from Mac App Store
2. Drag your PNG into Image2icon
3. Export as `.icns`
4. Save as `assets/icons/mac/icon.icns`

---

## 🧪 Step 7: Test Your App

### 7.1 Compile TypeScript

```bash
npm run build:ts
```

This compiles `src/main.ts` → `dist/main.js`

### 7.2 Run in Development Mode

```bash
npm run dev
```

This will:
1. Compile TypeScript
2. Launch Electron with your app

**You should see:**
- Electron window opens
- Your web app loads in the window
- App icon appears in dock (if configured)

### 7.3 Test Features

- ✅ Window opens and loads your URL
- ✅ External links open in browser (not new Electron window)
- ✅ Menu bar works
- ✅ App icon appears in dock
- ✅ App name is correct in dock

---

## 📦 Step 8: Build macOS .dmg

### 8.1 Build for Current Architecture

```bash
npm run dist:mac
```

This will:
1. Compile TypeScript
2. Package Electron app
3. Create `.dmg` file in `release/` directory

**Output:**
- `release/Your-App-Name-1.0.0.dmg` (Intel Macs)
- `release/Your-App-Name-1.0.0-arm64.dmg` (Apple Silicon Macs)

### 8.2 Build for Specific Architecture

#### Intel Macs Only (x64)

Edit `package.json`:
```json
"mac": {
  "target": [
    {
      "target": "dmg",
      "arch": ["x64"]
    }
  ],
  ...
}
```

Then build:
```bash
npm run dist:mac
```

#### Apple Silicon Only (arm64)

Edit `package.json`:
```json
"mac": {
  "target": [
    {
      "target": "dmg",
      "arch": ["arm64"]
    }
  ],
  ...
}
```

Then build:
```bash
npm run dist:mac
```

### 8.3 Universal Binary (Both Architectures)

Edit `package.json`:
```json
"mac": {
  "target": [
    {
      "target": "dmg",
      "arch": ["x64", "arm64"]
    }
  ],
  ...
}
```

This creates separate `.dmg` files for each architecture.

---

## 🚀 Step 9: Distribute Your .dmg

### 9.1 Test the .dmg

1. **Double-click** the `.dmg` file
2. **Drag** the app to Applications folder
3. **Open** the app from Applications
4. **Verify** it works correctly

### 9.2 Distribution Methods

#### USB Distribution

```bash
# Copy .dmg to USB drive
cp release/Your-App-Name-1.0.0.dmg /Volumes/USB_DRIVE_NAME/
```

#### Network Distribution

- Upload to file server
- Share via cloud storage (Dropbox, Google Drive, etc.)
- Host on your website

#### Email Distribution

- Attach `.dmg` file (if under size limit)
- Or send download link

---

## 🔧 Step 10: Customization Options

### 10.1 Change App URL

**Option A: Environment Variable**
```bash
APP_URL=https://your-new-url.com npm run dev
```

**Option B: Edit `src/main.ts`**
```typescript
const APP_URL = "https://your-new-url.com";
```

### 10.2 Change Window Size

Edit `src/main.ts`:
```typescript
mainWindow = new BrowserWindow({
  width: 1920,    // Change width
  height: 1080,   // Change height
  ...
});
```

### 10.3 Disable DevTools in Production

Edit `src/main.ts`:
```typescript
// Remove or comment out this section:
if (process.env.NODE_ENV === "development") {
  mainWindow.webContents.openDevTools();
}
```

Or set `NODE_ENV=production`:
```bash
NODE_ENV=production npm run dist:mac
```

### 10.4 Add Splash Screen

1. Create `assets/splash.png`
2. Edit `src/main.ts` to show splash before loading:
```typescript
// Show splash immediately
mainWindow.show();

// Load URL
mainWindow.loadURL(APP_URL);

// Hide splash when ready
mainWindow.webContents.once("did-finish-load", () => {
  // Splash hidden, app loaded
});
```

### 10.5 Change App Category

Edit `package.json`:
```json
"mac": {
  "category": "public.app-category.social-networking",
  ...
}
```

**Common categories:**
- `public.app-category.utilities`
- `public.app-category.productivity`
- `public.app-category.social-networking`
- `public.app-category.business`
- `public.app-category.developer-tools`

---

## 🐛 Troubleshooting

### Issue: "App shows default Electron icon"

**Solution:**
1. Verify `icon.icns` exists: `ls -la assets/icons/mac/icon.icns`
2. Check `package.json` icon path is correct
3. Rebuild: `npm run dist:mac`

### Issue: "App name shows as 'Electron' in dock"

**Solution:**
1. Ensure `app.setName()` is called **very early** in `main.ts` (right after imports)
2. Clear macOS dock cache: `killall Dock`
3. Rebuild and reinstall app

### Issue: "Build fails with 'icon not found'"

**Solution:**
1. Create `assets/icons/mac/icon.icns` (see Step 6)
2. Or use PNG fallback: `assets/icon.png`
3. Update `package.json` icon path if needed

### Issue: ".dmg won't open on other Macs"

**Solution:**
1. **Gatekeeper**: Users may need to right-click → Open (first time)
2. **Code Signing**: For distribution, you may need to code sign:
   ```bash
   # Requires Apple Developer account
   codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" release/mac/Your-App.app
   ```
3. **Notarization**: For wider distribution, notarize with Apple

### Issue: "App is slow or unresponsive"

**Solution:**
1. Check your web app performance
2. Enable hardware acceleration (default in Electron)
3. Optimize your web app code

### Issue: "External links don't open in browser"

**Solution:**
Verify `setWindowOpenHandler` is configured in `main.ts`:
```typescript
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  require("electron").shell.openExternal(url);
  return { action: "deny" };
});
```

---

## 📋 Complete Build Script

Create `build-for-distribution.sh`:

```bash
#!/bin/bash

# Build script for macOS distribution
# Usage: ./build-for-distribution.sh

set -e

echo "🔨 Building Electron app for macOS..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist release

# Compile TypeScript
echo "📝 Compiling TypeScript..."
npm run build:ts

# Build for macOS
echo "🍎 Building macOS .dmg..."
npm run dist:mac

# Check if build succeeded
if [ -f "release/Your-App-Name-1.0.0.dmg" ]; then
    echo "✅ Build successful!"
    echo "📦 DMG location: release/Your-App-Name-1.0.0.dmg"
    ls -lh release/*.dmg
else
    echo "❌ Build failed!"
    exit 1
fi
```

Make it executable:
```bash
chmod +x build-for-distribution.sh
```

Run it:
```bash
./build-for-distribution.sh
```

---

## ✅ Pre-Distribution Checklist

Before distributing your `.dmg`:

- [ ] App name is correct (not "Electron")
- [ ] App icon appears correctly in dock
- [ ] Window size is appropriate
- [ ] External links open in browser
- [ ] Menu bar works correctly
- [ ] App loads your URL correctly
- [ ] `.dmg` opens and installs correctly
- [ ] App runs after installation
- [ ] Tested on target macOS version
- [ ] Tested on both Intel and Apple Silicon (if building universal)

---

## 🎯 Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Run in development mode

# Building
npm run build:ts         # Compile TypeScript only
npm run dist:mac         # Build macOS .dmg

# Testing
open release/*.dmg       # Open DMG in Finder
```

### File Locations

```
src/main.ts              # Electron main process
dist/main.js             # Compiled JavaScript (auto-generated)
assets/icon.png          # Source icon (1024x1024 PNG)
assets/icons/mac/icon.icns  # macOS icon
release/*.dmg            # Built distribution files
```

### Key Configuration Files

- `package.json` - App metadata and build config
- `tsconfig.json` - TypeScript configuration
- `src/main.ts` - Electron app logic

---

## 📚 Additional Resources

- **Electron Documentation**: https://www.electronjs.org/docs
- **electron-builder Documentation**: https://www.electron.build/
- **macOS App Distribution**: https://developer.apple.com/distribute/
- **Icon Design Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons

---

## 💡 Tips & Best Practices

1. **Start with a simple setup** - Get basic functionality working first
2. **Test frequently** - Run `npm run dev` often during development
3. **Use TypeScript** - Catches errors early and improves code quality
4. **Version control** - Commit your source code, ignore `dist/` and `release/`
5. **Icon quality** - Use `.icns` for best macOS appearance
6. **Security** - Keep `nodeIntegration: false` and `contextIsolation: true`
7. **Performance** - Optimize your web app, Electron is just a wrapper
8. **Updates** - Consider adding auto-update functionality later (electron-updater)

---

**Last Updated**: Based on Electron 28.3.3 and electron-builder 24.13.3
