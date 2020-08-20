/* eslint-disable require-jsdoc */
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
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const serveIndex = require('serve-index');
const multer = require('multer');
const fs = require('fs');
const nodePath = require('path');
const zip = require('express-easy-zip');

// variables
const app = express();
const port = 3000;

// HELPER FUNCTIONS
function views(file) {
  return nodePath.normalize(`${__dirname}/views/${file}`);
}

function removeEncodedUrlSpace(string) {
  return string.replace(/%20/g, ' ');
}

function isValid(input) {
  return ((input !== undefined) && (input !== '') && (input !== null));
}

function isArrayValid(array) {
  return ((array !== undefined) && (array !== null) && (array.length !== 0));
}

function filePathExists(path) {
  return fs.existsSync(path);
}

function fileExists(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
    console.log('File exists, and can be read, and can be written to.');
    return true;
  } catch (error) {
    console.log('File does not exist, or cannot be read, or cannot be written to.');
    return false;
  }
}

function removeDirectory(path, options) {
  const dirRemoval = { wasSuccessful: false, message: 'N/A' };
  try {
    const filePath = nodePath.normalize(path);
    fs.rmdirSync(filePath, options);
    dirRemoval.wasSuccessful = true;
    dirRemoval.message = 'Directory has been deleted successfully.';
  } catch (err) {
    dirRemoval.wasSuccessful = false;
    dirRemoval.message = err.toString();
  } finally {
    return dirRemoval;
  }
}

function writeToLogFile(text) {
  // if file doesn't exist, it will be created
  const file = nodePath.normalize('./log.txt');
  // has to be a stream to avoid the EMFILE error:
  // https://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node/43370201#43370201
  const stream = fs.createWriteStream(file, { flags: 'a' });
  const date = new Date().toString();
  stream.write(`${date}\n${text}\n\n`);
  stream.end();
}

// making the storage path system agnostic
const storagePath = (() => {
  const originalPath = __dirname.split(nodePath.sep);
  originalPath.pop();
  const systemAgnosticPath = nodePath.normalize(nodePath.join(...originalPath, '/users/username/home'));
  const pathContainsBeginningSlash = systemAgnosticPath[0] === nodePath.sep;

  if (!pathContainsBeginningSlash) {
    return nodePath.normalize('/' + systemAgnosticPath);
  }

  return systemAgnosticPath;
})();

// for multer (storage object)
// only gets called when uploading files
const destination = (req, file, cb) => {
  const path = req.headers.path;
  if (isValid(path)) {
    const newPath = nodePath.normalize(removeEncodedUrlSpace(path).replace('?path=', ''));
    const newStoragePath = storagePath.replace('home', '') + newPath.slice(1, newPath.length);
    return cb(null, newStoragePath);
  }
  return cb(null, storagePath);
};
// for multer (storage object)
// only gets called when uploading files
const filename = (req, file, cb) => {
  const pathExists = filePathExists(nodePath.join(storagePath, file.originalname));
  const [ , ext ] = file.mimetype.split(nodePath.sep);
  if (pathExists) {
    const [ name ] = file.originalname.split(`.${ext}`);
    console.log(name);
    return cb(null, `${name}-copy.${ext}`);
  }
  return cb(null, file.originalname);
};

const storage = multer.diskStorage({ destination, filename });
const upload = multer({ storage });

// username and password
const user = {
  username: 'username',
  password: '$2b$10$6EwITJ7wXFDxUR0wquEg6enrkQnGGJCd2UQZZzAFdxwCE6HsUXojO'
};

app.use(session({
  secret: '588673a595e29fcd75e4567768d0f601',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(nodePath.normalize(__dirname + '/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/home', express.static(storagePath), serveIndex(storagePath, { 'template': `${views('home.html')}` }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(zip());

app.get('/', redirectToMenuIfLoggedIn, (req, res) => res.sendFile(views('login.html')));

app.get('/menu', (req, res) => res.sendFile(views('menu.html')));

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      writeToLogFile('GET "/logout"\nError in destroying session.\n' + err);
      return res.status(500).send(err);
    }

    writeToLogFile('GET "/logout"\nSession has been destroyed successfully.');
    return res.status(200).redirect('/');
  });
});

app.get('/upload', (req, res) => {
  writeToLogFile('GET "/upload" request received.');
  res.sendFile(views('/upload.html'));
});

app.get('/downloadZip', (req, res) => {
  const filesAreAvailableToDownload = isArrayValid(req.session.files);

  if (!filesAreAvailableToDownload) {
    writeToLogFile('GET "/downloadZip"\nError in downloading files.');
    return res.status(400).send('Error in downloading files.');
  }

  const filesToDownload = {
    files: req.session.files,
    filename: 'files.zip'
  };

  writeToLogFile('GET "/downloadZip"\nFiles have been downloaded successfully.');
  res.zip(filesToDownload);
});

app.get('/createFolder', (req, res) => {
  const pathName = req.query.path;
  const dirName = req.query.dirName;

  if (!isValid(pathName) && !isValid(dirName)) {
    writeToLogFile('GET "/createFolder"\nUser did not specify correct path or directory name.');
    return res.status(400).redirect('/home');
  }

  const fullPath = nodePath.normalize(storagePath.replace('home', pathName) + dirName);

  fs.mkdir(fullPath, (err) => {
    if (err) {
      writeToLogFile('GET "/createFolder"\nError in creating folder.');
      return res.status(400).redirect(pathName);
    } else {
      writeToLogFile('GET "/createFolder"\nFolder has been created successfully!');
      return res.status(200).redirect(pathName);
    }
  });
});

app.post('/loginAuth', async (req, res) => {
  // MAKING A PASSWORD
  // console.log(req.body.password)
  // bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
  //     if (err) return res.status(400).send()
  //     console.log(hashedPassword)
  // })
  try {
    const usernamesMatch = req.body.username === user.username;
    const passwordsMatch = await bcrypt.compare(req.body.password, user.password);

    if (usernamesMatch && passwordsMatch) {
      req.session.isUserAuth = true;
      writeToLogFile('POST "/loginAuth"\nUser has logged in successfully and session has been created.');
      return res.status(200).redirect('/menu');
    } else {
      writeToLogFile('POST "/loginAuth"\nUser is not authorized to log in.');
      return res.status(401).redirect('/');
    }
  } catch (err) {
    writeToLogFile(`POST "/loginAuth"\nAn error has occured:\n${err}`);
    return res.status(500).send('An error has occured:\n' + err);
  }
});

app.post('/uploadAuth', upload.array('uploaded-files'), (req, res) => {
  const filesAreAvailableToUpload = isArrayValid(req.files);

  if (!filesAreAvailableToUpload) {
    writeToLogFile('POST "/uploadAuth"\nThere are no files to upload.');
    return res.status(500).redirect('/upload');
  }

  writeToLogFile('POST "/uploadAuth"\nFile(s) have been uploaded successfully.\n' + req.files);
  return res.status(200).send('File(s) have been uploaded successfully.');
});

app.post('/download', (req, res) => {
  const listOfFilesExist = isArrayValid(req.body.fileNames);

  if (!listOfFilesExist) {
    writeToLogFile('POST "/download"\nUser did not select files to download.');
    return res.status(400).send('You did not select files to download.');
  }
  const files = [];

  req.body.fileNames.forEach((name) => {
    const path = `${storagePath}${name}`;
    files.push({ path, name });
  });

  req.session.files = files;
  writeToLogFile('POST "/download"\nFiles have been added to the user\'s session.\n' + files);
  return res.status(200).send('Files downloaded successfully.');
});

app.post('/moveTo', (req, res) => {
  const destinationDir = req.body.destinationDir;
  const listOfFiles = req.body.listOfFiles;

  if (!isValid(destinationDir)) {
    writeToLogFile('POST "/moveTo"\nNo destination directory specified.');
    return res.status(400).send('No destination directory specified.');
  }

  if (!isArrayValid(listOfFiles)) {
    writeToLogFile('POST "/moveTo"\nNo file(s) are present to move.');
    return res.status(400).send('No file(s) are present to move.');
  }

  const dir = nodePath.normalize(storagePath + destinationDir.replace('/home', '/'));

  if (!fileExists(dir)) {
    writeToLogFile('POST "/moveTo"\nDirectory does not exist.');
    return res.status(400).send('The path you entered is incorrect or does not exist, try again.');
  } else {
    // if errors occur, consider changing "forEach" to "every"
    listOfFiles.forEach((file) => {
      const splitPath = file.split(nodePath.sep);
      const fileName = splitPath[splitPath.length - 1];

      const oldPath = nodePath.normalize(storagePath + removeEncodedUrlSpace(file));
      const newPath = nodePath.normalize(dir + '/' + fileName);

      const duplicatedDirectory = nodePath.normalize(`/${fileName}/${fileName}`);
      const isDuplicateDirectory = newPath.endsWith(duplicatedDirectory);

      if (isDuplicateDirectory) {
        writeToLogFile('POST "/moveTo"\nUser tried to move a folder into itself.');
        return res.status(400).send('Can\'t move a folder into itself.');
      }

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          writeToLogFile('POST "/moveTo"\nUser tried to move a folder into itself.');
          return res.status(400).send('The path you entered is incorrect, try again.\n' + err);
        }
      });
    });
    writeToLogFile('POST "/moveTo"\nFiles have been successfully moved.');
    return res.status(200).send('Successfully moved file(s).');
  }
});

// called whenever 'Delete' button is clicked with checkmarked files
app.delete('/deleteCheckmarked', (req, res) => {
  const files = req.body.fileNames;
  const listOfFilesExist = isArrayValid(files);

  if (!listOfFilesExist) {
    writeToLogFile('DELETE "/deleteCheckmarked"\nUser did not select any files to delete.');
    return res.status(400).send('You did not select any files to delete.');
  }

  for (const file of files) {
    const filePath = nodePath.normalize(storagePath + removeEncodedUrlSpace(file));
    const directoryExists = filePathExists(filePath) && fs.lstatSync(filePath).isDirectory();

    if (directoryExists) {
      const dirRemoval = removeDirectory(filePath, { recursive: true });

      if (!dirRemoval.wasSuccessful) {
        writeToLogFile(`DELETE "/deleteCheckmarked"\n${dirRemoval.message}`);
        return res.status(400).send('Error in removing directory.');
      }

      writeToLogFile(`DELETE "/deleteCheckmarked"\n${dirRemoval.message}`);
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          writeToLogFile(`DELETE "/deleteCheckmarked"\nError in deleting file(s).\n${err}`);
          return res.status(400).send('Error in deleting file(s).');
        }
      });
    }
  }
  writeToLogFile('File(s) have been deleted successfully.\nFiles:' + files.toString());
  return res.status(200).send('File(s) have been deleted successfully.');
});

// only gets called when you upload a file then click on the remove link attached to dropzone
app.delete('/deleteFile', checkUserAuth, (req, res) => {
  let pathToFile = '';
  const fileName = req.body.fileName;

  if (!isValid(fileName)) {
    writeToLogFile('DELETE "/deleteFile"\nFile does not exist.');
    return res.status(400).send('File does not exist.');
  }

  if (isValid(req.query.path)) {
    const path = storagePath + '/' + fileName;
    pathToFile = nodePath.normalize(path);
  } else {
    const path = `${storagePath.replace('home', '')}${req.query.path.replace('?path=')}${fileName}`;
    pathToFile = nodePath.normalize(path);
  }

  fs.unlink(pathToFile, (err) => {
    if (err) {
      writeToLogFile(`DELETE "/deleteFile"\nError in deleting file.\n${err}`);
      return res.status(400).send('Error in deleting file.');
    } else {
      writeToLogFile(`DELETE "/deleteFile"\nFile has been deleted successfully.`);
      return res.status(200).send('File has been deleted successfully.');
    }
  });
});

// MIDDLEWARE

// checks for user authentication
function checkUserAuth(req, res, next) {
  if (req.session.isUserAuth) {
    return next();
  } else {
    return res.status(403).redirect('/');
  }
}

// is user logged in
function redirectToMenuIfLoggedIn(req, res, next) {
  if (req.session.isUserAuth) {
    return res.redirect('/menu');
  } else {
    return next();
  }
}

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
