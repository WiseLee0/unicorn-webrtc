const { app, Menu, Tray } = require('electron')
const path = require('path')
const { show: showPuppetWindow, realClose: closePuppetWindow } = require('../windows/puppet')
const { create: createAboutWindow } = require('../windows/about')

let tray;
app.whenReady().then(() => {
  tray = new Tray(path.resolve(__dirname, './icon_win32.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开' + app.name, click: showPuppetWindow },
    { label: '关于' + app.name, click: createAboutWindow },
    { type: 'separator' },
    { label: '退出', click: closePuppetWindow }
  ])
  tray.setContextMenu(contextMenu)
  menu = Menu.buildFromTemplate([])
  app.applicationMenu = menu;
})