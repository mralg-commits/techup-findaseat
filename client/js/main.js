const API_BASE = 'https://techup-findaseat.onrender.com';

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } else {
    alert(data.error || 'Login failed');
  }
}

async function register() {
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const phone = document.getElementById('phone').value;
  const res = await fetch(`${API_BASE}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password,phone })
  });
  if (res.ok) {
    window.location.href = 'index.html';
  } else {
    const data = await res.json();
    alert(data.error || 'Registration failed');
  }
}

async function fetchRides() {
  const res = await fetch(`${API_BASE}/api/rides?pickup_point=HQ&destination=Event&date=2025-06-01`);
  const rides = await res.json();
  const list = document.getElementById('ride-list');
  list.innerHTML = '';
  rides.forEach(ride => {
    const li = document.createElement('li');
    li.textContent = `${ride.pickup_point} to ${ride.destination} at ${ride.time}`;
    list.appendChild(li);
  });
}

function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    // Base64 padding fix
    const padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    return parsed.userId;
  } catch (err) {
    console.error('Error decoding token:', err);
    return null;
  }
}

async function createRide() {
  const user_id = getUserIdFromToken();
  if (!user_id) {
    alert('User not logged in');
  return;
  }

  const pickup_point = document.getElementById('pickup_region').value;
  const exact_address = document.getElementById('pickup_address').value;
  const destination = document.getElementById('destination').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const token = localStorage.getItem('token');
  const seats = parseInt(document.getElementById('seats').value);
    if (isNaN(seats) || seats < 1 || seats > 4) {
      alert('Please enter a valid number of seats (1 to 4).');
    return;
  }
  console.log({
  user_id,
  pickup_point,
  destination,
  date,
  time,
  seats_available: seats
  });
  const res = await fetch(`${API_BASE}/api/rides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id, // Replace with real user_id from token (optional backend logic)
      pickup_point,
      exact_address,
      destination,
      date,
      time,
      seats_available: seats
    })
  });

  if (res.ok) {
    window.location.href = 'dashboard.html';
  } else {
    const data = await res.json();
    alert(data.error || 'Failed to create ride');
  }
}

function logout() {
  localStorage.removeItem('token');
}
if (window.location.pathname.endsWith('dashboard.html')) {
  fetchRides();
}

document.getElementById("Filter").addEventListener("click", async function () {
  const pickup_region = document.getElementById("filter_from").value;
  const destination = document.getElementById("filter_to").value;
  const date = document.getElementById("filter_date").value;

  const res = await fetch(`${API_BASE}/api/rides?pickup_point=${pickup_region}&destination=${destination}&date=${date}`);
  
  const rides = await res.json();
  displayRides(rides);
});

function displayRides(rides) {
  const ridesList = document.getElementById("rides_list");
  ridesList.innerHTML = '';  // Clear any existing rides
  rides.forEach(ride => {
    const rideItem = document.createElement("li");
    rideItem.textContent = `${ride.pickup_point} to ${ride.destination} at ${ride.time}`;
    ridesList.appendChild(rideItem);
  });
}


