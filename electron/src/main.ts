import { app, BrowserWindow, Menu, nativeImage } from "electron";
import * as path from "path";
import * as fs from "fs";

// Set app name IMMEDIATELY (must be first thing after import)
// This ensures macOS shows the correct name in the dock
app.setName("Riingr");

// Your deployed app URL
const APP_URL = process.env.APP_URL || "https://riingr.onrender.com";

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
      const appRoot = path.resolve(__dirname, "../..");
      
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
    if (process.platform === "darwin" && app.dock) {
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
          label: "About Riingr",
          click: () => {
            require("electron").dialog.showMessageBox(mainWindow!, {
              type: "info",
              title: "About Riingr",
              message: "Riingr",
              detail: "Version 1.0.1\nRiingr Messenger - Connect and chat with friends",
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
    const appRoot = path.resolve(__dirname, "../..");
    
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
