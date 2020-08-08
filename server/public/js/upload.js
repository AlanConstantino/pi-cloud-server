async function deleteFileFromServer(file) {
    const url = `${location.origin}/deleteFile`
    const options = {
        method: 'delete',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file)
    }
    const response = await fetch(url, options)
    return response
}

// dropzone config
Dropzone.options.dropzoneArea = {
    paramName: 'uploaded-files',
    addRemoveLinks: true,
    removedfile: async function (file) {
        // sends DELETE request to server to remove file
        const response = await deleteFileFromServer({ 'fileName': file.name })
        if (response.status === 200) console.log('Successfully deleted file.')
        if (response.status === 500) console.log('Couldn\'t delete file.')

        // deletes dropzone thumbnail
        let _ref;
        return (_ref = file.previewElement) != null ? _ref.parentNode.removeChild(file.previewElement) : void 0;
    },
    dictDefaultMessage: "Drop file(s) here or click to upload",
};

const url = (route) => `${location.origin}${route}`

// when you click on the home button, you go to the '/home' url route
const homeButton = document.getElementById('home-btn')
homeButton.addEventListener('click', async () => window.location.href = url('/home'))

// when you click on the back button, you go to the '/menu' url route
const backButton = document.getElementById('menu-btn')
backButton.addEventListener('click', async () => window.location.href = url('/menu'))