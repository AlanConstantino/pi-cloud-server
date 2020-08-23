async function sendDataToServer(url, data, method) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return await fetch(url, options);
};

function isValid(input) {
  return (
    (input !== undefined) &&
    (input !== null) &&
    (input !== '')
  );
}

function passwordsMatch(password, password2) {
  return (password === password2) ? true : false;
}

// When button is clicked, will redirect to "/home" url route
const goBackButton = document.getElementById('go-back-btn');
goBackButton.addEventListener('click', () => window.location.replace('/home'));

// Upon form submission, will validate username and password before sending to server and overwriting it
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('password-confirmation').value.trim();

  // make sure user input is valid (i.e. username, password, and confirmPassword)
  if (!isValid(username)) {
    alert('Username is not valid! Try again.');
    return location.reload();
  }

  if (!isValid(password)) {
    alert('Password is not valid! Try again.');
    return location.reload();
  }

  if (!isValid(confirmPassword)) {
    alert('Password confirmation is not valid! Try again.');
    return location.reload();
  }

  // make sure the passwords match
  if (passwordsMatch(password, confirmPassword)) {
    const url = window.location.origin + '/signupAuth';
    const data = { username, password };
    const response = await sendDataToServer(url, data, 'POST');
    const serverMessage = await response.text();

    if (response.status === 200) {
      alert(serverMessage);
      return window.location.href = `${window.location.origin}/home`;
    } else {
      alert(serverMessage);
      return location.reload();
    }
  } else {
    alert('Passwords don\'t match! Try again.');
    return location.reload();
  }
});
