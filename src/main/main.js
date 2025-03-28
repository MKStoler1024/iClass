﻿const { app, Tray, Menu, BrowserWindow, screen,
        nativeTheme, nativeImage, dialog, ipcMain,
     } = require('electron')
const path = require('path')

let tray, win, clock, duty, settingsWindow, editWindow;

function createWindow() {
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height,
        frame: 0,
        transparent: 1,
        focusable: 0,
        show: 0,
        resizable: 0,
        minimizable: 0,
        maximizable: 0,
        skipTaskbar: 1,
        webPreferences: {
            nodeIntegration: 1,
            enableRemoteModule: 1
        }
    })

    win.loadFile(path.join(__dirname, 'html/index.html'));
    win.setAlwaysOnTop(1, 'normal');
    win.setIgnoreMouseEvents(1);
    win.setVisibleOnAllWorkspaces(1);
    win.show();

    clock = new BrowserWindow({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height,
        frame: 0,
        transparent: 1,
        focusable: 0,
        show: 0,
        resizable: 0,
        minimizable: 0,
        maximizable: 0,
        skipTaskbar: 1,
        webPreferences: {
            nodeIntegration: 1,
            enableRemoteModule: 1
        }
    })
    clock.loadFile(path.join(__dirname, 'html/clock.html'));
    clock.setAlwaysOnTop(1, 'normal');
    clock.setIgnoreMouseEvents(1);
    clock.setVisibleOnAllWorkspaces(1);

    duty = new BrowserWindow({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height,
        frame: 0,
        transparent: 1,
        focusable: 0,
        show: 0,
        resizable: 0,
        minimizable: 0,
        maximizable: 0,
        skipTaskbar: 1,
        webPreferences: {
            nodeIntegration: 1,
            enableRemoteModule: 1
        }
    })
    duty.loadFile(path.join(__dirname, 'html/clock.html'));
    duty.setAlwaysOnTop(1, 'normal');
    duty.setIgnoreMouseEvents(1);
    duty.setVisibleOnAllWorkspaces(1);

    if (process.platform === 'darwin') {
        win.setFullScreenable(0);
        nativeTheme.themeSource = 'dark';
    }
}

function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: Math.floor((3 / 4) * screen.getPrimaryDisplay().workAreaSize.width),
        height: Math.floor((4 / 5) * screen.getPrimaryDisplay().workAreaSize.height),
        focusable: 1,
        show: 0,
        resizable: 1,
    });
    settingsWindow.loadFile(path.join(__dirname, 'html/settings.html'));
    settingsWindow.show();
    Menu.setApplicationMenu(null);
}

function createEditWindow() {
    editWindow = new BrowserWindow({
        width: Math.floor((3 / 4) * screen.getPrimaryDisplay().workAreaSize.width),
        height: Math.floor((4 / 5) * screen.getPrimaryDisplay().workAreaSize.height),
        focusable: 1,
        show: 0,
        resizable: 1,
    });
    editWindow.loadURL("https://edit.cses-org.cn/");
    editWindow.webContents.on('did-finish-load', () => {
        dialog.showMessageBox(editWindow, {
            title: 'CSES课程表编辑器',
            message: '注意：这个功能通过 https://edit.cses-org.cn 提供，版权归原网站所有。我们仅提供访问入口，不对内容负责。如有问题请找原作者（关于 页面内）\n导出时请在 高级导出 选项选择JSON格式，且不要更改文件名\n请导出到“iClass/resources/app/data/config”',
            buttons: ['OK'],
        });
    });
    editWindow.show();
    Menu.setApplicationMenu(null);
}

function showHideClock(){
    if (clock.isVisible()) {
        clock.hide();
    } else {
        clock.show();
    }
}

function showHideWin(){
    if (win.isVisible()) {
        win.hide();
    } else {
        win.show();
    }
}

function createTray() {
    tray = new Tray(path.join(__dirname, '../assets/img/tray-icon.png'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '软件设置',
            click: () => {
                createSettingsWindow();
            }
        },
        {
            label: '课表编辑',
            click: () => {
                createEditWindow();
            }
        },
        {
            label: '调整课程',
            click: () => {
                
            }
        },
        {
            label: '显示/隐藏',
            click: () => {
                showHideWin();
            }
        },
        {
            label: '时钟',
            click: () => {
                showHideClock();
            }
        },
        {
            type: 'separator'
        },
        {
            label: '退出',
            role: 'quit'
        }
    ])

    tray.setToolTip('iClass');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

win?.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) {
        win.hide();
    }
})

// 保存设置
ipcMain.on('save-settings', (event, { path, settings }) => {
    try {
        // 读取现有设置
        let existingSettings = {};
        if (fs.existsSync(path)) {
            existingSettings = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        // 合并新设置
        const updatedSettings = { ...existingSettings, ...settings };

        // 确保目录存在
        const dir = path.dirname(path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(path, JSON.stringify(updatedSettings, null, 2), 'utf8');
        event.reply('save-settings-reply', { success: true });
    } catch (error) {
        event.reply('save-settings-reply', { success: false, error: error.message });
    }
});

// 加载设置
ipcMain.on('load-settings', (event, path) => {
    try {
        if (fs.existsSync(path)) {
            const settings = JSON.parse(fs.readFileSync(path, 'utf8'));
            event.reply('load-settings-reply', settings);
        } else {
            event.reply('load-settings-reply', {});
        }
    } catch (error) {
        event.reply('load-settings-reply', { error: error.message });
    }
});