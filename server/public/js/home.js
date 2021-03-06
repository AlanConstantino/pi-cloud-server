// Basic DOM manipulation
const cloneNode = (node) => node.cloneNode(true);
const createElement = (type) => document.createElement(type);
const addAttribute = (element, attribute, value) => element.setAttribute(attribute, value);
const removeAttribute = (element, attribute) => element.removeAttribute(attribute);
const removeAttributes = (element, attributes) => {
  attributes.forEach((attribute) => element.removeAttribute(attribute));
};
const appendNode = (root, node) => root.appendChild(node);
const addClasses = (element, cssClasses) => {
  cssClasses.forEach((cssClass) => element.classList.add(cssClass));
};

// Table helper methods
const calculateKilobytes = (bytes) => (bytes / 1024).toFixed(2);
const validateSize = (size) => (size === 'NaN' ? 'dir' : size);
const cloneRowAndRemoveAttributes = (row, attributes) => {
  const clone = cloneNode(row);
  removeAttributes(clone, attributes);
  return clone;
};
const createClickableName = (name) => {
  const aTag = createElement('a');
  addAttribute(aTag, 'href', (window.location.href + name));
  aTag.innerText = name;
  return aTag;
};
const createCheckbox = (id) => {
  const inputTag = createElement('input');
  addAttribute(inputTag, 'type', 'checkbox');
  addAttribute(inputTag, 'id', id);
  addAttribute(inputTag, 'name', `${window.location.pathname}${id}`);
  addClasses(inputTag, [ 'checkbox' ]);
  return inputTag;
};

// checkbox helper functions
const getAllCheckedBoxes = (checkboxes) => checkboxes.filter((box) => box.checked);
const checkedBoxesAreValid = (checkedBoxes) => ((checkedBoxes !== undefined) && (checkedBoxes.length !== 0));
const saveCheckedBoxesAsAListOfPaths = (checkedBoxes) => {
  const list = [];
  const filePath = (window.location.pathname).replace('/home', '');
  checkedBoxes.forEach((box) => list.push(`${filePath}${box.id}`));
  return list;
};

// API helper functions
const createUrl = (parameter) => window.location.origin + parameter;
const sendFileNamesToServer = async (url, data, method) => {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  return await fetch(url, options);
};

// verification helper function
const isValid = (input) => {
  if (input === undefined || input === '' || input === null) {
    return false;
  }
  return true;
};

const exampleRow = document.getElementById('example-row');
const tbody = document.getElementById('tbody');
const listItems = [ ...document.getElementById('files').children ];

listItems.forEach((item) => {
  const row = cloneRowAndRemoveAttributes(exampleRow, [ 'id', 'class' ]);
  const [ name, size, date ] = [ ...item.children[0].children ];
  const [ rowNum, rowName, rowSize, rowDate ] = [ ...row.children ];
  const aTag = createClickableName(name.innerText);
  const checkbox = createCheckbox(name.innerText);
  const isHiddenDirectory = (name.innerText === '..') || (name.innerText === '.');

  appendNode(rowName, aTag);
  rowSize.innerText = validateSize(calculateKilobytes(parseInt(size.innerText)));
  rowDate.innerText = date.innerText;
  appendNode(tbody, row);

  if (isHiddenDirectory) {
    return;
  }

  appendNode(rowNum, checkbox);
});

const checkboxForm = document.getElementById('checkbox-form');
const checkboxes = [ ...document.getElementsByClassName('checkbox') ];

const downloadBtn = document.getElementById('download-selected-btn');
downloadBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const checkedBoxes = getAllCheckedBoxes(checkboxes);

  if (!checkedBoxesAreValid(checkedBoxes)) {
    return alert('You must select at least one box.');
  }

  const listOfFileNames = saveCheckedBoxesAsAListOfPaths(checkedBoxes);

  // sending fetch request to server
  const url = createUrl('/download');
  const data = { fileNames: listOfFileNames };
  const response = await sendFileNamesToServer(url, data, 'POST');
  const serverMessage = await response.text();

  if (response.status === 200) {
    window.location.href = `${window.location.origin}/downloadZip`;
    alert(serverMessage);
  }

  if (response.status === 400) {
    alert(serverMessage);
  }

  checkboxForm.reset();
});

const deleteBtn = document.getElementById('delete-btn');
deleteBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const checkedBoxes = getAllCheckedBoxes(checkboxes);

  if (!checkedBoxesAreValid(checkedBoxes)) {
    return alert('You must select at least one box.');
  }

  const listOfFileNames = saveCheckedBoxesAsAListOfPaths(checkedBoxes);

  // sending data to backend
  const url = createUrl('/deleteCheckmarked');
  const data = { fileNames: listOfFileNames };
  const response = await sendFileNamesToServer(url, data, 'DELETE');
  const serverMessage = await response.text();

  if (response.status === 200) {
    location.reload();
    return alert(serverMessage);
  }

  if (response.status === 400) {
    return alert(serverMessage);
  }

  checkboxForm.reset();
});

const selectAllBtn = document.getElementById('select-all-btn');
selectAllBtn.addEventListener('click', () => {
  const checkedBoxes = getAllCheckedBoxes(checkboxes);

  if (checkedBoxes.length > 0) {
    checkedBoxes.forEach((box) => box.checked = false);
    return;
  }

  checkboxes.forEach((box) => box.checked = true);
});

const uploadBtn = document.getElementById('upload-btn');
uploadBtn.addEventListener('click', () => {
  const path = window.location.pathname;
  window.location.href = createUrl(`/upload/?path=${path}`);
});

// sends GET request to '/createFolder' with dirName and path passed in the URL
const createFolderModalForm = document.getElementById('create-folder-form-modal');
createFolderModalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const dirName = document.getElementById('folder-name-modal').value.trim();

  if (!isValid(dirName)) {
    return alert(`'${dirName}' is not valid`);
  }

  const path = window.location.pathname;
  window.location.href = createUrl(`/createFolder/?path=${path}&dirName=${dirName}`);
});

const moveToBtn = document.getElementById('move-to-btn');
moveToBtn.addEventListener('click', () => {
  const checkedBoxes = getAllCheckedBoxes(checkboxes);

  if (!checkedBoxesAreValid(checkedBoxes)) {
    removeAttribute(moveToBtn, 'data-toggle');
    return alert('You must select at least one box.');
  }

  addAttribute(moveToBtn, 'data-toggle', 'modal');
  const listOfFiles = saveCheckedBoxesAsAListOfPaths(checkedBoxes);

  // the following event won't ever trigger if moveToBtn is never clicked,
  // hence why it's nested in the moveToBtn 'click' event listener
  const moveToModalForm = document.getElementById('move-to-form-modal');
  moveToModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let destinationDir = document.getElementById('directory-path-modal').value.trim();

    // make sure destinationDir is valid
    if (!isValid(destinationDir)) {
      return alert(`'${destinationDir}' is not valid`);
    }

    // make sure destinationDir starts with a '/'
    if (!destinationDir.startsWith('/')) {
      destinationDir = '/' + destinationDir;
    }

    // sending data to backend
    const url = createUrl('/moveTo');
    const data = { destinationDir, listOfFiles };
    const response = await sendFileNamesToServer(url, data, 'POST');
    const serverMessage = await response.text();

    if (response.status === 200) {
      location.reload();
      return alert(serverMessage);
    }

    if (response.status === 400) {
      return alert(`${serverMessage}`);
    }
  });
});

// when you click on the logout button, you get sent to the '/logout' url route
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.addEventListener('click', () => window.location.replace('/logout'));

// when you click on the update login credentials button, you get sent to the '/signup' url route
const updateCredentialsBtn = document.getElementById('update-creds-btn');
updateCredentialsBtn.addEventListener('click', () => window.location.replace('/signup'));
