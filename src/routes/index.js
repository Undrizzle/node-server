const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')

const User = require('../models/user')

const router = express.Router()

const upload = multer(({ dest: 'uploads/' }))

const jsonParser = bodyParser.json()

const tokens = {
    admin: {
        token: 'admin-token'
    },
    editor: {
        token: 'editor-token'
    }
}

const users = {
    'admin-token': {
      roles: ['admin'],
      introduction: 'I am a super administrator',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      name: 'Super Admin'
    },
    'editor-token': {
      roles: ['editor'],
      introduction: 'I am an editor',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      name: 'Normal Editor'
    }
}

const options = {
    styleMap: [
        "p[style-name='Image'] => div.center",
        "p[style-name='Title'] => div.center > h1:fresh",
        "p[style-name='heading 1'] => div.center > h2:fresh",
        "p[style-name='heading 2'] => div.center > h3:fresh",
        "p[style-name='heading 4'] => div.center > h4:fresh",
        "p[style-name='heading 5'] => h5:fresh",
        "table => div.tbl > table:fresh"
    ]
}

const layout = "<% layout('layout') -%>"

function readDirSync(path) {
	let fileList = []
	let pa = fs.readdirSync(path)
	pa.forEach(function(ele, index) {
		let info = fs.statSync(path + '\\' + ele)
		if (info.isDirectory()) {
			readDirSync(path + '\\' + ele)
		} else {
			let fileName = ele.replace(/\.(docx)$/,'')
			fileList.push(fileName)
		}
	})
	
	return fileList
}

function removeFileSync(path, name) {
	const pa = fs.readdirSync(path)

	pa.forEach(function (ele, index) {
		const info = fs.statSync(path + '\\' + ele)
		if (info.isDirectory()) {
			readDirSync(path + '\\' + ele)
		} else {
			if (ele == name) {
				fs.unlinkSync(path + '\\' + ele)
			}
		}
	})
}

router.get('/*.html', function(req, res) {
    let originalUrl = req.originalUrl
    let url = originalUrl.replace("/","")
    res.render(url)
})

router.get('/', function(req, res) {
    res.render('index')
})

router.post('/user/login', jsonParser, function(req, res) {
    let username = req.body.username
    let password = req.body.password

    let query = User.findOne({'username': username})

    query.select('username password')

    query.exec(function (err, user) {
        if (err) return handleError(err)
        if (user.password == password) {
            const token = tokens[username]
            res.status(200).send({ code: 20000, data: token })
        } else {
            res.status(200).send({
                code: 60204,
                message: 'Account and password are incorrect.'
            })
        }      
    })
})

router.get('/user/info', jsonParser, function(req, res) {
    const token = req.query.token
    const info = users[token]

    if (!info) {
        res.status(200).send({ code: 50008, message: 'Login failed, unable to get user details.' })
    } else {
        res.status(200).send({ code: 20000, data: info })
    }
})

router.get('/documents/get', jsonParser, function(req, res) {
	let docArray = []
	let docPath = path.join(__dirname, '../../docs')
	let docs = readDirSync(docPath)
	docs.forEach(function(doc) {
		let docObj = {}
		let docHtml = doc + '.html'
		docObj.name = doc
		docObj.url = 'http://localhost:3000/' + docHtml
		docArray.push(docObj)
	})
	res.status(200).send({ code: 20000, data: docArray })
})

router.post('/documents/del', jsonParser, function(req, res) {
	const name = req.body.name
	const html = req.body.name + '.html'
	const doc = req.body.name + '.docx'
	
	removeFileSync(path.join(__dirname, '../../docs'), doc);
	removeFileSync(path.join(__dirname, '../views'), html);
	
	const docObj = {}
	docObj.name = name
	docObj.url = 'http://localhost:3000/' + name + '.html'
	
	res.status(200).send({ code: 20000, data: docObj })
})

router.post('/documents/post', upload.any(), function(req, res) {
    let des_file = '../../docs/' + req.files[0].originalname
    let html_file = req.files[0].originalname.replace(/\.(docx)$/, '.html')
    let des_html = '../views/' + html_file
	let name = req.files[0].originalname.replace(/\.(docx)$/, '');
	
	const docObj = {}
	docObj.name = name
	docObj.url = 'http://localhost:3000/' + html_file

    fs.readFile(req.files[0].path, function(err, data) {
        if (err) {
            console.log('read file error')
        }
        fs.writeFile(path.join(__dirname, des_file), data, function(err) {
            if (err) {
                console.log('save file error')
            } else {
                console.log('save file success')
            }
        })

        mammoth.convertToHtml({buffer: data}, options)
            .then(function(result) {
                fs.writeFile(path.join(__dirname, des_html), result.value, function(err) {
                    if (err) {
                        console.log('convert to html error')
                    } else {
                        console.log('convert to html success')
                    }
                })

                fs.appendFile(path.join(__dirname, des_html), layout, (err) => {
                    if (err) {
                        console.log('append layout error')
                    } else {
                        console.log('append layout success')
                    }
                })
            })
            .done()
    })

    res.status(200).send({ code: 20000, data: docObj })
})

module.exports = router