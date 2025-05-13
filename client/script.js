async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('https://YOUR-BACKEND.onrender.com/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token);
  loadRides();
}

async function loadRides() {
  const res = await fetch('https://YOUR-BACKEND.onrender.com/api/rides?pickup_point=HQ&destination=Event&date=2025-06-01');
  const rides = await res.json();
  const list = document.getElementById('ridesList');
  list.innerHTML = rides.map(ride =>
    `<li>${ride.pickup_point} → ${ride.destination} at ${ride.time}</li>`
  ).join('');
}
