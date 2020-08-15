// TODO:
// - Make the process of making a new username and password easier for the user
// - Move the user object into an excel document to act as a psuedo database so it isn't stored in the source code

// BUGS:
// - When moving mutliple files, it will break. You get greeted with the error message "Already sent headers." The error has
//   something to do with trying to send another header/message to the client again, however, actually moving the files
//   doesn't give you an error. The system will move the files for you successfully.
//   - Have not tested moving multiple directories
//   - Have not tested moving both directories and files
//   - What happens when you move a directory or file into itself?

// require
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const serveIndex = require('serve-index')
const multer = require('multer')
const fs = require('fs')
const nodePath = require('path')
const zip = require('express-easy-zip')

// variables
const app = express()
const port = 3000

// making the storage path system agnostic
const storagePath = (() => {
  const originalPath = __dirname.split(nodePath.sep)
  originalPath.pop()
  const systemAgnosticPath = nodePath.normalize(nodePath.join(...originalPath, '/users/username/home'))
  return systemAgnosticPath
})()

const views = (file) => nodePath.normalize(`${__dirname}/views/${file}`)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = req.headers.path
    if (path !== undefined && path !== '') {
      const newPath = nodePath.normalize(path.replace(/%20/g, ' ').replace('?path=', ''))
      const newStoragePath = storagePath.replace('home', '') + newPath.slice(1, newPath.length)
      return cb(null, newStoragePath)
    }
    return cb(null, storagePath)
  },
  filename: (req, file, cb) => {
    const fileExists = fs.existsSync(nodePath.join(storagePath, file.originalname))
    const [, ext] = file.mimetype.split('/')
    if (fileExists) {
      const [name,] = file.originalname.split(`.${ext}`)
      return cb(null, `${name}-copy.${ext}`)
    }
    return cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

// username and password
const user = {
  username: 'username',
  password: '$2b$10$6EwITJ7wXFDxUR0wquEg6enrkQnGGJCd2UQZZzAFdxwCE6HsUXojO'
}

app.use(session({
  secret: '588673a595e29fcd75e4567768d0f601',
  resave: false,
  saveUninitialized: false
}))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/home', express.static(storagePath), serveIndex(storagePath, { 'template': `${views('home.html')}` }))
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(bodyParser.raw())
app.use(zip())

app.get('/', redirectToMenuIfLoggedIn, (req, res) => res.sendFile(views('login.html')))

app.get('/menu', (req, res) => res.sendFile(views('menu.html')))

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send(err)
    return res.status(200).redirect('/')
  })
})

app.get('/upload', (req, res) => {
  res.sendFile(views('/upload.html'))
})

app.get('/downloadZip', (req, res) => {
  const noFiles = req.session.files === undefined || req.session.files.length === 0
  if (noFiles) return res.status(400).send()
  const filesToDownload = {
    files: req.session.files,
    filename: 'files.zip'
  }
  res.zip(filesToDownload)
})

app.get('/createFolder', (req, res) => {
  const pathName = req.query.path
  const dirName = req.query.dirName
  if (!pathName || !dirName) return res.status(400).redirect('/home')

  const fullPath = nodePath.normalize(storagePath.replace('home', pathName) + dirName)
  fs.mkdir(fullPath, (err) => {
    if (err) return res.status(400).redirect(pathName)
    else return res.status(200).redirect(pathName)
  })
})

app.post('/loginAuth', async (req, res) => {
  // MAKING A PASSWORD
  // console.log(req.body.password)
  // bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
  //     if (err) return res.status(400).send()
  //     console.log(hashedPassword)
  // })
  try {
    const usernamesMatch = req.body.username === user.username
    const passwordsMatch = await bcrypt.compare(req.body.password, user.password)
    if (usernamesMatch && passwordsMatch) {
      req.session.isUserAuth = true
      return res.status(200).redirect('/menu')
    }
    return res.status(401).redirect('/')
  } catch {
    return res.status(500).send()
  }
})

app.post('/uploadAuth', upload.array('uploaded-files'), (req, res) => {
  if (req.files.length > 0) return res.status(200).send()
  return res.status(500).redirect('/upload')
})

app.post('/download', (req, res) => {
  const fileNamesExist = (req.body.fileNames.length === undefined) || (req.body.fileNames.length === 0)
  if (fileNamesExist) return res.status(400).send()
  const files = []
  req.body.fileNames.forEach(name => files.push({ path: `${storagePath}${name}`, name }))
  req.session.files = files
  return res.status(200).send()
})

app.post('/moveTo', (req, res) => {
  const destinationDir = req.body.destinationDir
  const listOfFiles = req.body.listOfFiles
  if (destinationDir === undefined || destinationDir === '') {
    return res.status(400).send('No destination directory specified')
  }
  if (listOfFiles === undefined || listOfFiles.length === 0) {
    return res.status(400).send('No file(s) are present to move.')
  }

  const dir = storagePath + destinationDir.replace('/home', '/')

  fs.access(dir, (err) => {
    if (err) {
      // maybe create the folder/path instead of returning an error
      return res.status(400).send(`No directory by the name of "${err.path}" exits.`)
    } else {
      listOfFiles.forEach(file => {
        const splitPath = file.split('/')
        const fileName = splitPath[splitPath.length - 1]

        const oldPath = nodePath.normalize(storagePath + file.replace(/%20/g, ' '))
        const newPath = nodePath.normalize(dir + '/' + fileName)
        fs.rename(oldPath, newPath, (err) => {
          if (err) {
            // may be able to get rid of this if I remove fs.access altogether
            return res.status(400).send('Old path or new path may be incorrect.\n' + err)
          } else {
            return res.status(200).send('Successfully moved file(s).')
          }
        })
      })
    }
  })
})

// called whenever 'Delete' button is clicked with checkmarked files
app.delete('/deleteMultiple', (req, res) => {
  const files = req.body.fileNames
  files.forEach(file => {
    const filePath = nodePath.normalize(storagePath + file.replace(/%20/g, ' '))
    const isDirectory = fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();
    if (isDirectory) {
      fs.rmdir(filePath, { recursive: true }, (err) => {
        if (err) {
          console.log('Error in deleting directory.')
          return res.status(400).send(err)
        } else {
          console.log('Directory has been deleted successfully.')
          return res.status(200).send()
        }
      })
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log('Error in deleting file(s).')
          return res.status(400).send(err)
        } else {
          console.log('File(s) have been deleted successfully.')
          return res.status(200).send()
        }
      })
    }
  })
})

// only gets called when you upload a file then click on the remove link attached to dropzone
app.delete('/deleteFile', (req, res) => {
  let pathToFile = ''
  const fileName = req.body.fileName
  if (!fileName) return res.status(500).send('File does not exist.')
  if (req.query.path === undefined || req.query.path === '') {
    pathToFile = nodePath.normalize(storagePath + '/' + fileName)
  } else {
    pathToFile = nodePath.normalize(`${storagePath.replace('home', '')}${req.query.path.replace('?path=')}${fileName}`)
  }
  fs.unlink(pathToFile, (err) => {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).send('File has been deleted successfully.')
    }
  })
})



// MIDDLEWARE
//////////////////////////////////////////////

// checks for user authentication
function checkUserAuth(req, res, next) {
  if (req.session.isUserAuth) return next()
  return res.status(403).redirect('/')
}

// is user logged in
function redirectToMenuIfLoggedIn(req, res, next) {
  if (req.session.isUserAuth) return res.redirect('/menu')
  return next()
}

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))