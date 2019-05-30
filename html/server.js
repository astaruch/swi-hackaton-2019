console.log('Server started')
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: 9999 })

var screenSharer
var screenController

wss.on('connection', function (ws) {
  if (!screenSharer) {
    console.log('Connected screen sharer')
    screenSharer = ws
  } else {
    console.log('Connected screen controller')
    screenController = ws
    screenController.on('message', function (message) {
      console.log(`Sending mouse position: ${message}`)
      screenSharer.send(message)
    })
  }
})
