const { BrowserWindow, ipcRenderer } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const single = require('../signal')
const { send: sendPuppetWindow } = require('./puppet')
let win
let camp = ''
function create() {
    win = new BrowserWindow({
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.on('close', () => {
        if (camp != 'receive') {
            console.log(camp)
            single.send('forward', { event: "operate-close", data: "" })
        }
        sendPuppetWindow('close')
        camp = ''
        win = null
    })
    if (isDev) {
        win.loadURL('http://localhost:8080/#/control/')
    } else {
        win.loadFile(path.resolve(__dirname, '../../dist/control.html'))
    }
}

function send(channel, ...args) {
    win.webContents.send(channel, ...args)
}

function close() {
    camp = 'receive'
    win.close()
}

module.exports = { create, send, close }