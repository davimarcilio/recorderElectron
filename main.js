const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  globalShortcut,
} = require("electron");
const os = require("os");
const path = require("path");
const fs = require("fileServer");
require("dotenv").config();
let destination = path.join(os.homedir(), "audios");

const isDev =
  process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development"
    ? true
    : false;

const isMac = process.platform === "darwin" ? true : false;
function createWindow() {
  const win = new BrowserWindow({
    width: isDev ? 950 : 500,
    height: isDev ? 950 : 300,
    resizable: isDev ? true : false,
    backgroundColor: "#234",
    show: false,
    icon: path.join(__dirname, "./assets/icons/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile("./src/mainWindow/index.html");
  if (isDev) {
    win.webContents.openDevTools();
  }
  win.once("ready-to-show", () => {
    win.show();
    win.webContents.send("cpu_data", os.cpus()[0].model);
  });
  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        { label: "Preferences", click: () => {} },
        { label: "Open destination folder", click: () => {} },
      ],
    },
    { label: "File", submenu: [isMac ? { role: "close" } : { role: "quit" }] },
    {
      label: "Window",
      submenu: [
        {
          label: "New Window",
          click: () => {
            createWindow();
          },
        },
        { type: "separator" },
        {
          label: "Close all Windows",
          accelerator: "CmdOrCtrl+a",
          click: () => {
            BrowserWindow.getAllWindows().forEach((window) => window.close());
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  return win;
}
app.whenReady().then(() => {
  createWindow();
});
app.on("window-all-closed", () => {
  console.log("Todas as janelas fechadas");
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("open_new_window", () => {
  createWindow();
});

ipcMain.on("save_buffer", (e, buffer) => {
  const filePath = path.join(destination, Date.now());
  fs.writeFileSync(`${filePath}.webm`, buffer);
});
