'use strict'
const express = require('express')
const WebSocketServer = require('ws').Server
const ip = require('ip')
// const uuid = require('uuid')

const httpServer = express()
const httpServerPort = process.env.PORT || 8080

httpServer.use(express.static(__dirname))
httpServer.listen(httpServerPort)
console.dir(`Available on: http://${ip.address()}:${httpServerPort}`)

const wsPort = process.env.WSPORT || 9999
const wss = new WebSocketServer({
  port: wsPort
  // verifyClient: (info, done) => {
  //   info.req.session.userId = uuid.v4()
  //   console.log(`Adding id ${info.req.session.userId} to user`)
  //   done(info.req.session.userId)
  // }
})
console.log(`WebSocket server is listening on port ${wsPort}`)

let master
let clients = []

wss.on('connection', (ws, req) => {
  // console.log(`Client ${req.session.userId} connected`)
  if (!master) {
    console.log('Connected master')
    master = ws
  } else {
    console.log('Connected client')
    clients.push(ws)
    ws.on('message', message => {
      // console.log(`Sending: ${message}`)
      master.send(message)
    })
  }
})
