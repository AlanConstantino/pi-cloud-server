// TODO:
// - Make the process of making a new username and password easier for the user
// - Move the user object into an excel document to act as a psuedo database so it isn't stored in the source code
// - When clicking 'upload here,' make sure to add a back button to go back to the previous page instead of just having a home button
// - Remove 'menu' and just add logout button to 'home.html'

// BUGS:
// - When moving mutliple files, it will break. You get greeted with the error message "Already sent headers." The error has
//   something to do with trying to send another header/message to the client again, however, actually moving the files
//   doesn't give you an error. The system will move the files for you successfully.
//   - Fixed bug but have not tested on Windows/Linux

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
  const containsBeginningSlash = systemAgnosticPath[0] === '/' || systemAgnosticPath[0] === '\\'
  if (!containsBeginningSlash) return nodePath.normalize('/' + systemAgnosticPath)
  return systemAgnosticPath
})()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = req.headers.path
    if (path !== undefined && path !== '') {
      const newPath = nodePath.normalize(removeEncodedUrlSpace(path).replace('?path=', ''))
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
app.use(express.static(nodePath.normalize(__dirname + '/public')))
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
  if (!isValid(pathName) && !isValid(dirName)) return res.status(400).redirect('/home')

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
  if (!isArrayValid(req.body.fileNames)) return res.status(400).send('There is no list of files.')
  const files = []
  req.body.fileNames.forEach(name => files.push({ path: `${storagePath}${name}`, name }))
  req.session.files = files
  return res.status(200).send()
})

app.post('/moveTo', (req, res) => {
  const destinationDir = req.body.destinationDir
  const listOfFiles = req.body.listOfFiles
  if (!isValid(destinationDir)) {
    return res.status(400).send('No destination directory specified')
  }
  if (!isArrayValid(listOfFiles)) {
    return res.status(400).send('No file(s) are present to move.')
  }

  const dir = nodePath.normalize(storagePath + destinationDir.replace('/home', '/'))

  fs.access(dir, (err) => {
    if (err) {
      // maybe create the folder/path instead of returning an error
      return res.status(400).send(`No directory by the name of "${err.path}" exits.`)
    } else {
      listOfFiles.forEach(file => {
        const splitPath = file.split(nodePath.sep)
        const fileName = splitPath[splitPath.length - 1]

        const oldPath = nodePath.normalize(storagePath + removeEncodedUrlSpace(file))
        const newPath = nodePath.normalize(dir + '/' + fileName)

        const duplicatedDirectory = nodePath.normalize(`/${fileName}/${fileName}`)
        const isDuplicateDirectory = newPath.endsWith(duplicatedDirectory)
        if (isDuplicateDirectory) {
          return res.status(400).send('Can\'t move a folder into itself.\n')
        }

        fs.rename(oldPath, newPath, (err) => {
          if (err) {
            // may be able to get rid of this if I remove fs.access altogether
            return res.status(400).send('The path you inputted is incorrect, try again.\n' + err)
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
  if (!isArrayValid(files)) return res.status(400).send('There are no files to delete.')

  files.forEach(file => {
    const filePath = nodePath.normalize(storagePath + removeEncodedUrlSpace(file))
    const isDirectory = fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory();
    if (isDirectory) {
      fs.rmdir(filePath, { recursive: true }, (err) => {
        if (err) {
          console.log('Error in deleting directory.')
          return res.status(400).send('Error in deleting directory.\n' + err)
        } else {
          console.log('Directory has been deleted successfully.')
          return res.status(200).send()
        }
      })
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log('Error in deleting file(s).')
          return res.status(400).send('Error in deleting file(s).\n' + err)
        } else {
          console.log('File(s) have been deleted successfully.')
          return res.status(200).send('File(s) have been deleted successfully.')
        }
      })
    }
  })
})

// only gets called when you upload a file then click on the remove link attached to dropzone
app.delete('/deleteFile', (req, res) => {
  let pathToFile = ''
  const fileName = req.body.fileName
  if (!isValid(fileName)) return res.status(500).send('File does not exist.')
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


// HELPER FUNCTIONS
const views = (file) => nodePath.normalize(`${__dirname}/views/${file}`)
const removeEncodedUrlSpace = string => string.replace(/%20/g, ' ')
const isValid = input => ((input !== undefined) && (input !== '') && (input !== null) && (!input))
const isArrayValid = array => ((array !== undefined) && (array !== null) && (array.length !== 0))
const fileExists = path => {
  try {
    fs.accessSync(path, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK)
    console.log('File exists, and can be read, and can be written to.')
    return true
  } catch (error) {
    console.log('File does not exist, or cannot be read, or cannot be written to.')
    return false
  }
}


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