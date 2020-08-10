# pi-cloud-server
A Dropbox-like cloud server with a web interface.

Essentially, it's a server that runs on a [Pi](https://en.wikipedia.org/wiki/Raspberry_Pi) (or any computer really) that allows you to upload/download files through a web interface.

Note: I tried to keep this project as simple as possible... keyword "tried."

## Tech Stack
- [Boostrap](https://getbootstrap.com/)
  - For frontend
- [Node.js](https://nodejs.org/en/)
  - For backend
- [Express.js](https://expressjs.com/)
  - For API calls
- [Google Sheets/Excel (soon)](https://www.npmjs.com/package/google-spreadsheet)
  - For a pseudo-database

## Libraries
- [Dropzone.js](https://www.dropzonejs.com/)
  - For drag'n'drop uploads

## Emoji Legend
- ❌ not possible/not implemented
- ❗ attention/note
- ✅ done
- 🔜 will get implemented soon/working on it
- 🤷 maybe
&#38;

## Table of Contents
- [pi-cloud-server](#pi-cloud-server)
  * [Install](#install)
  * [Running the server](#running-the-server)
  * [Default login credentials](#default-login-credentials)
  * [Changing default login credentials](#changing-default-login-credentials)
    + [Changing the default username](#changing-the-default-username)
    + [Changing the default password](#changing-the-default-password)
  * [Todo](#todo)
  
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

## Default login credentials
```
username: username
password: password
```

## Changing default login credentials
I will make changing your username and password easier in the future, but for now, you have to do the following:

### Changing the default username
1. Change the directory called ```/username/``` to whatever name you'd like to use.
   - This directory can be found in ```/users/username/home```
   - Make sure to not get rid of the ```/home``` folder
   - i.e. ```users/alanc/home```

2. Change the ```storagePath``` variable to reflect your new username.
   - Variable can be found on line 23 of ```/server/app.js```
   - i.e. ```const storagePath = __dirname.replace('/server', '') + '/users/alanc/home'```

3. Change the ```username``` property of the ```user``` object to reflect your new username.
   - The ```user``` object can be found on line 42 of ```/server/app.js/```
   - i.e.
   ```
   const user = {
    username: 'alanc',
    password: '$2b$10$6EwITJ7wXFDxUR0wquEg6enrkQnGGJCd2UQZZzAFdxwCE6HsUXojO'
   }
   ```

4. Restart the app.
   - ```^C``` to stop the app if it's running in the command line
   - ```npm run server```

### Changing the default password
1. Uncomment lines 86 through 90 in ```/server/app.js```

2. Comment lines 91 through 101 in ```/server/app.js```

3. Make sure you are in the ```/server/``` directory and run the app.
   - ```npm run server```

4. Go to http://localhost:3000/

5. Enter your new password into the password box.
   - The username doesn't matter. You can enter one or not, you just need the hashed password.
   - The hashed password will show up on the command line from where you ran the app.

6. From the command line that you ran the command ```npm run server``` copy the hashed password.
   - You should see two printed lines after the message ```Example app listening at http://localhost:3000```
   - The first is your password in plain text.
   - The second is your hashed password.
   - i.e.
   ```
   Example app listening at http://localhost:3000
   newPassword
   $2b$10$yTLEZzv0fil0r1CPBhhAn.FcQ5Va/P9PAFlgUxa2QEPaHrHQ4Uyxa
   ```

7. Copy the newly hashed password to the ```password``` property of the ```user``` object found on line 42.
   - i.e.
   ```
   const user = {
    username: 'alanc',
    password: 'PASTE YOUR NEWLY HASHED PASSWORD HERE'
   }
   ```

8. Comment lines 86 through 90 in ```/server/app.js```

9. Uncomment lines 91 through 101 in ```/server/app.js```

10. Restart the app and login with your new username/password.
    - ```^C``` to stop the app if it's running in the command line
    - ```npm run server```
    
## Todo
- 🔜 Refactor code
- 🔜 Add error handling, i.e. when the server sends an error/message, display an alert on the client's side
- 🔜 Make the process of making a new username and password easier for the user
- 🔜 Move the user object into an excel document to act as a psuedo database so it isn't stored in the source code
- 🤷 Use Google Sheets as a pseudo database to store usernames and passwords
  - Seems a bit overkill to use a fully fledged database like MySQL/MongoDB
- ❌ Figure out how to upload directories
  - ❗ Don't think it's possible as of right now with Dropzone. The Dropzone docs don't mention anything about uploading a directory. Will have to probably edit their source code to make this possible.
- ✅ Figure out how to move files from one directory to another (drag and drop maybe)
  - ❗ Basic functionality is done but it's still a little janky, play around with this to uncover bugs
- ✅ Figure out how to create a new directory by pressing a button
- ✅ Instead of showing 403 error page, redirect to /
- ✅ When clicking on the upload button in '/home', instead of redirecting to '/upload', bring up a modal that has dropzone within it and upload files that way. (Implemented a similar idea, modal wasn't working)
