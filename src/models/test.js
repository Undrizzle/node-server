const mongoose = require('mongoose')
const User = require('./user')

mongoose.connect('mongodb://localhost/qrcode_doc', {useNewUrlParser: true})

const user = new User

user.username = 'admin'
user.password = '123456'

user.save(function (err, message) {
    if (err) 
        console.log('error')
    else
        console.log('success')
})