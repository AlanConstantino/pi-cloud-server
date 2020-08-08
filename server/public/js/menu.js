const url = (route) => `${location.origin}${route}`

// when you click on the home button, you go to the '/home' url route
const homeButton = document.getElementById('home-btn')
homeButton.addEventListener('click', async () => window.location.href = url('/home'))

// when you click on the upload button, you go to the '/upload' url route
const uploadButton = document.getElementById('upload-btn')
uploadButton.addEventListener('click', async () => window.location.href = url('/upload'))

// when you click on the logout button, you go to the '/logout' url route
const logoutButton = document.getElementById('logout-btn')
logoutButton.addEventListener('click', async () => window.location.replace('/logout'))