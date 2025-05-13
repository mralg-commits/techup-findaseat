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
  const res = await fetch(`${API_BASE}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
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

async function createRide() {
  const pickup = document.getElementById('pickup').value;
  const dest = document.getElementById('dest').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/rides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: 1, // Replace with real user_id from token (optional backend logic)
      pickup_point: pickup,
      destination: dest,
      date,
      time
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
