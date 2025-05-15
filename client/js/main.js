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


const filterButton = document.getElementById("Filter");
if (filterButton) {
  document.getElementById("Filter").addEventListener("click", async function () {
    const pickup_region = document.getElementById("filter_from").value;
    const destination = document.getElementById("filter_to").value;
    const date = document.getElementById("filter_date").value;
    const res = await fetch(`${API_BASE}/api/rides?pickup_point=${pickup_region}&destination=${destination}&date=${date}`);
    const rides = await res.json();
    displayRides(rides);
  });
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

function displayRides(rides) {
  const ridesList = document.getElementById("rides_list");
  ridesList.innerHTML = '';

  if (rides.length === 0) {
    ridesList.innerHTML = `<tr><td colspan="7" style="text-align: center;">No rides available.</td></tr>`;
    return;
  }

  rides.forEach((ride, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ride.pickup_point}</td>
      <td>${ride.exact_address || "N/A"}</td>
      <td>${ride.destination}</td>
      <td>${ride.date || "N/A"}</td>
      <td>${ride.time || "N/A"}</td>
      <td>${ride.seats_available || "N/A"}</td>
      <td><button onclick="joinRide(${ride.id})">Join</button></td>
      <td><button onclick="cancelRide(${ride.id})">Cancel</button></td>
    `;
    ridesList.appendChild(row);
  });
}

async function joinRide(rideId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/api/rides/${rideId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to join ride: ${err}`);
    }

    const data = await res.json();
    alert(data.message || 'Successfully joined the ride');
  } catch (err) {
    console.error('Error joining ride:', err);
    alert('Failed to join ride');
  }
}

async function fetchJoinedRides() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/rides/joined`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    console.error('Failed to load joined rides');
    return;
  }

  const rides = await res.json();
  const tbody = document.getElementById('joined_rides_body');
  tbody.innerHTML = '';

  rides.forEach((ride, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ride.pickup_point}</td>
      <td>${ride.exact_address}</td>
      <td>${ride.destination}</td>
      <td>${ride.date}</td>
      <td>${ride.time}</td>
      <td>${ride.host_name}</td>
      <td>${ride.host_contact}</td>
      <td><button onclick="cancelRide(${ride.id})">Cancel</button></td>
    `;
    tbody.appendChild(row);
  });
}


async function cancelRide(rideId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/rides/${rideId}/cancel`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  if (res.ok) {
    alert('Canceled ride participation!');
    document.getElementById("Filter").click(); // refresh list
  } else {
    alert(data.error || 'Failed to cancel');
  }
}

async function loadCreatedRides() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const res = await fetch(`${API_BASE}/api/rides/created`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const rides = await res.json();
  const container = document.getElementById("created_rides_container");
  container.innerHTML = '';

  rides.forEach(ride => {
  const div = document.createElement('div');
  div.innerHTML = `
    <h4>${ride.pickup_point} to ${ride.destination} on ${ride.date} at ${ride.time}</h4>
    <p>Seats left: ${ride.seats_available}</p>
    <table border="1">
      <tr><th>Name</th><th>Phone</th><th>Action</th></tr>
      ${ride.participants.map(p => p.name ? `
        <tr>
          <td>${p.name}</td>
          <td>${p.phone}</td>
          <td><button onclick="removeParticipant(${ride.ride_id}, ${p.user_id})">Remove</button></td>
        </tr>` : '').join('')}
    </table>
    <button onclick="cancelRide(${ride.ride_id})">Cancel Ride</button>
    <hr>
  `;
  container.appendChild(div);
});

}

async function removeParticipant(rideId, userId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/rides/${rideId}/participants/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) {
    alert('Participant removed.');
    loadCreatedRides(); // Refresh list
  } else {
    alert('Failed to remove participant.');
  }
}

async function cancelEntireRide(rideId) {
  if (!confirm("Are you sure you want to cancel this ride?")) return;

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/rides/${rideId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) {
    alert('Ride cancelled.');
    loadCreatedRides();
  } else {
    alert('Failed to cancel ride.');
  }
}


if (window.location.pathname.endsWith('created.html')) {
  document.addEventListener('DOMContentLoaded', loadCreatedRides);
  document.addEventListener('DOMContentLoaded', fetchJoinedRides);
}



