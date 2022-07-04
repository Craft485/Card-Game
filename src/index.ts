const express = require('express')
const app = express()
const http = require('http').createServer(app)
const fs = require('fs')
const io = require('socket.io')(http)

app.use(express.static('../public'))

http.listen(process.argv[2] || 8080, console.info('Online!'))