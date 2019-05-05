const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')

const routes = require('./routes/index')

const app = express()
const http = require('http').Server(app)

mongoose.connect('mongodb://localhost/qrcode_doc', {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'database connection error:'))

app.use(cors())

app.use(express.static(path.join(__dirname, '../public')))

app.set('views', path.join(__dirname, 'views'))
app.engine('html', ejsMate)
app.set('view engine', 'html')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', routes)

app.use(function(req, res, next) {
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

const port = process.env.Port || 3000

http.listen(port, function() {
    console.log('Server listening at port %d', port)
})

module.exports = app