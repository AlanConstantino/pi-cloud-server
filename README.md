# pi-cloud-server
A Dropbox-like cloud server with a web interface.

Essentially, it's a server that runs on a [Pi](https://en.wikipedia.org/wiki/Raspberry_Pi) (or any computer really) that allows you to upload/download files through a web interface.

## Table of Contents
- [pi-cloud-server](#pi-cloud-server)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Libraries](#libraries)
  - [Notes](#notes)
  - [Install](#install)
  - [Running the server](#running-the-server)
  - [Default login credentials](#default-login-credentials)
  - [Default storage path](#default-storage-path)
  - [Changing default storage path](#changing-default-storage-path)
  - [Project Images](#project-images)
    - [Login](#login)
    - [Home](#home)
    - [Creating a folder](#creating-a-folder)
    - [Moving files](#moving-files)
    - [Updating login credentials (signup)](#updating-login-credentials-signup)
    - [Upload](#upload)

## Tech Stack
- [Boostrap](https://getbootstrap.com/)
  - For frontend
- [Node.js](https://nodejs.org/en/)
  - For backend
- [Express.js](https://expressjs.com/)
  - For API calls

## Libraries
- [Dropzone.js](https://www.dropzonejs.com/)
  - For drag'n'drop uploads

## Notes

- To change the default username and password, you must first sign in with the default credentials (i.e. username = username and password = password) and then click on the "Update login credentials" button.
- When uploading folders, it won't upload the folder itself, only the contents of the folder.
  - The same thing applies for nested folders, you'll just upload the contents of the nested folders, not the folders themselves.
- I tried to keep this project as simple as possible... keyword "tried."

## Install
```
git clone https://github.com/AlanConstantino/pi-server.git
cd pi-server/server
npm install
```

## Running the server
Make sure you are in the ```/pi-server/server/``` directory, then run the following command:
```
npm run server
```
To run the server in development mode, run the following command:
```
npm run dev
```

## Default login credentials
You must first sign in with the default credentials and then click on the "Update login credentials" button to update the login credentials.
```
username: username
password: password
```

## Default storage path
```
/pi-cloud-server/home/
```

## Changing default storage path
You can change the default storage path to whatever you'd like.

Just go to the ```app.js``` file and edit line 107.

Edit the string "/home" to whatever path you'd like to use.

Example: 

Original line
```
const systemAgnosticPath = nodePath.normalize(nodePath.join(...originalPath, '/home'));
```

Line with your specific path
```
const systemAgnosticPath = nodePath.normalize(nodePath.join(...originalPath, '/your/path/here'));
```

## Project Images
### Login
![Login](project-images/login.png)

### Home
![Home](project-images/home.png)

### Creating a folder
![Creating a folder](project-images/creating-a-folder.png)

### Moving files
![Moving files](project-images/moving-files.png)

### Updating login credentials (signup)
![Signup](project-images/signup.png)

### Upload
![Upload](project-images/upload.png)