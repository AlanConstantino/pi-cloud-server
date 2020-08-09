# pi-server
A pi server that can be accessed through the web.

You can think of this as a dropbox-like clone. Essentially it's a server that runs on a pi (or any computer really) and you can upload/download files through a web interface.

## Table of Contents
- [pi-server](#pi-server)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
  - [Running the server](#running-the-server)
  - [Default login credentials](#default-login-credentials)
  - [Changing default login credentials](#changing-default-login-credentials)
    - [Changing the default username](#changing-the-default-username)
    - [Changing the default password](#changing-the-default-password)
  - [Todo](#todo)

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
- [ ] Figure out how to upload directories
- [ ] Figure out how to create a new directory by pressing a button
- [ ] Figure out how to move files from one directory to another (drag and drop maybe)
- [x] Instead of showing 403 error page, redirect to /
- [ ] Make the process of making a new username and password easier for the user
- [ ] Move the user object into an excel document to act as a psuedo database so it isn't stored in the source code
