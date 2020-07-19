const WebSocket = require('ws')
const ws = new WebSocket('ws://188.131.221.100:8010')
// const ws = new WebSocket('ws://127.0.0.1:8010')
const EventEmitter = require("events")
const signal = new EventEmitter()
ws.on('open', () => {
    console.log('connect success');
})
ws.on('message', message => {
    let parseMessage = {}
    try {
        parseMessage = JSON.parse(message)
    } catch (error) {
        console.log('parse error');
        return
    }
    if (!parseMessage.name.length)
        signal.emit(parseMessage.event, parseMessage.data)
    else
        signal.emit(parseMessage.event, parseMessage.data, parseMessage.name)
})
function send(event, data) {
    ws.send(JSON.stringify({ event, data }))
}
function invoke(event, data, answerEvent) {
    return new Promise((resolve, reject) => {
        send(event, data)
        signal.once(answerEvent, resolve)
        setTimeout(() => {
            reject('timeout')
        }, 5000);
    })
}

signal.send = send

signal.invoke = invoke

module.exports = signal