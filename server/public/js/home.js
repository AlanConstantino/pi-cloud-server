// Basic DOM manipulation
const cloneNode = (node) => node.cloneNode(true)
const createElement = (type) => document.createElement(type)
const addAttribute = (element, attribute, value) => element.setAttribute(attribute, value)
const removeAttribute = (element, attribute) => element.removeAttribute(attribute)
const removeAttributes = (element, attributes) => {
    attributes.forEach(attribute => element.removeAttribute(attribute))
}
const appendNode = (root, node) => root.appendChild(node)
const addClasses = (element, cssClasses) => {
    cssClasses.forEach(cssClass => element.classList.add(cssClass))
}

// Table helper methods
const calculateKilobytes = (bytes) => (bytes / 1024).toFixed(2)
const validateSize = (size) => (size === 'NaN' ? 'dir' : size)
const cloneRowAndRemoveAttributes = (row, attributes) => {
    const clone = cloneNode(row)
    removeAttributes(clone, attributes)
    return clone
}
const createClickableName = (name) => {
    const aTag = createElement('a')
    addAttribute(aTag, 'href', (window.location.href + name))
    aTag.innerText = name
    return aTag
}
const createCheckbox = (id) => {
    const inputTag = createElement('input')
    addAttribute(inputTag, 'type', 'checkbox')
    addAttribute(inputTag, 'id', id)
    addAttribute(inputTag, 'name', `${window.location.pathname}${id}`)
    addClasses(inputTag, ['checkbox'])
    return inputTag
}

// fetch request
const sendFileNamesToServer = async (url, data, method) => {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return await fetch(url, options)
}

const exampleRow = document.getElementById('example-row')
const tbody = document.getElementById('tbody')
const listItems = [...document.getElementById('files').children]

listItems.forEach((item, count) => {
    const row = cloneRowAndRemoveAttributes(exampleRow, ['id', 'class'])
    const [name, size, date] = [...item.children[0].children]
    const [rowNum, rowName, rowSize, rowDate] = [...row.children]
    const aTag = createClickableName(name.innerText)
    const checkbox = createCheckbox(name.innerText)
    const isHiddenDirectory = (name.innerText === '..') || (name.innerText === '.')

    appendNode(rowName, aTag)
    rowSize.innerText = validateSize(calculateKilobytes(parseInt(size.innerText)))
    rowDate.innerText = date.innerText
    appendNode(tbody, row)
    if (isHiddenDirectory) return
    appendNode(rowNum, checkbox)
})

const checkboxes = [...document.getElementsByClassName('checkbox')]
const getAllCheckedBoxes = (checkboxes) => checkboxes.filter(box => box.checked)
const checkedBoxesAreValid = (checkedBoxes) => ((checkedBoxes === undefined) || (checkedBoxes.length === 0))

const checkboxForm = document.getElementById('checkbox-form') // attach submit event listener
checkboxForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    // making sure user has selected at least one checkbox
    const checkedBoxes = getAllCheckedBoxes(checkboxes)
    if (checkedBoxesAreValid(checkedBoxes)) {
        console.log('You did not select anything.')
        return
    }

    // gathering all checked boxes
    const listOfFileNames = [];
    const filePath = (window.location.pathname).replace('/home', '')
    checkedBoxes.forEach(box => listOfFileNames.push(`${filePath}${box.id}`))

    // sending fetch request to server
    const url = window.location.origin + '/download'
    const data = { fileNames: listOfFileNames }
    const response = await sendFileNamesToServer(url, data, 'POST')
    if (response.status === 200) window.location.href = `${window.location.origin}/downloadZip`
    if (response.status === 400) console.log('Error in deleting file(s).')

    // reset form
    checkboxForm.reset()
})

const deleteBtn = document.getElementById('delete-btn') // attach click event listener
deleteBtn.addEventListener('click', async (e) => {
    e.preventDefault()

    // making sure user has selected at least one checkbox
    const checkedBoxes = getAllCheckedBoxes(checkboxes)
    if (checkedBoxesAreValid(checkedBoxes)) {
        console.log('You did not select anything.')
        return
    }

    // saving each checked box as a path
    const listOfFileNames = [];
    const filePath = (window.location.pathname).replace('/home', '')
    checkedBoxes.forEach(box => listOfFileNames.push(`${filePath}${box.id}`))

    // sending data to backend
    const url = window.location.origin + '/deleteMultiple'
    const data = { fileNames: listOfFileNames }
    const response = await sendFileNamesToServer(url, data, 'DELETE')
    if (response.status === 200) location.reload()
    if (response.status === 400) console.log('Error in deleting file(s).')

    // reset form
    checkboxForm.reset()
})

const selectAllBtn = document.getElementById('select-all-btn')
selectAllBtn.addEventListener('click', () => {
    const checkedBoxes = getAllCheckedBoxes(checkboxes)
    if (checkedBoxes.length > 0) {
        checkedBoxes.forEach(box => box.checked = false)
        return
    }
    checkboxes.forEach(box => box.checked = true)
})

const menuBtn = document.getElementById('menu-btn')
menuBtn.addEventListener('click', () => window.location.href = `${window.location.origin}/menu`)

const uploadBtn = document.getElementById('upload-btn')
uploadBtn.addEventListener('click', () => window.location.href = `${window.location.origin}/upload`)