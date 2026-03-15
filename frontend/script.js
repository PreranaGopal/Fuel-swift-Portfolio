// script.js - frontend logic for FuelSwift
console.log("✅ script.js loaded");

let selectedFuel = null;
let selectedFuelType = null;
let selectedStationId = null;
let deliveryLocation = null;
let usedGPS = false;
let slotMap = null;
let deliveryMap = null;
let slotMarkers = [];
let deliveryMarker = null;

// Screen switching
function showScreen(screenId) {
   document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
if (target) target.classList.add('active');

if (screenId === "slotScreen") setTimeout(() => initMapSlot(), 300);
if (screenId === "locationScreen") setTimeout(() => initMapDelivery(), 300);
}

function goHome() { showScreen('choiceScreen'); }

// Login / Signup
document.addEventListener('DOMContentLoaded', () => {
 document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
 showScreen("choiceScreen");
 });

 document.getElementById("signupForm").addEventListener("submit", e => {
  e.preventDefault();
 const pass = document.getElementById("signupPass").value;
  const confirm = document.getElementById("signupConfirmPass").value;
   if (pass !== confirm) { alert("Passwords do not match"); return; }
    alert("✅ Signup successful!");
 showScreen("loginScreen");
 });

  document.getElementById("locationForm").addEventListener("submit", e => {
    e.preventDefault();
    deliveryLocation = {
      street: document.getElementById("deliveryStreet").value,
      city: document.getElementById("deliveryCity").value,
      pincode: document.getElementById("deliveryPincode").value
    };
    usedGPS = false;
    showScreen("paymentScreen");
  });
});

// Fuel types
function showFuelTypes(mainFuel) {
  selectedFuel = mainFuel;
  document.getElementById("fuelTypesTitle").innerText = `${mainFuel} Types`;
  const container = document.getElementById("fuelOptions");
  container.innerHTML = "";

  const types = {
    Petrol: ["Regular Petrol", "Premium Petrol", "XP100 Petrol"],
    Diesel: ["Regular Diesel", "Premium Diesel"],
    Gas: ["CNG", "LPG"]
  }[mainFuel] || [];

  types.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "btn btn-theme";
    btn.innerText = t;
    btn.onclick = () => {
      selectedFuelType = t;
      showStations(); // go to stations list instead of location directly
    };
    container.appendChild(btn);
  });

  showScreen("fuelTypesScreen");
}

// Stations list
function showStations() {
  // Example user location (replace with GPS if available)
  const userLat = 28.61, userLng = 77.23;

  const stations = [
    { id: 1, name: "Ugrasen Petrol Pump (Indian Oil)", rating: 4.0, reviews: 5, address: "Grand Trunk Rd, Phase 4, Banglore", lat: 28.62, lng: 77.24 },
    { id: 2, name: "Hindustan Petroleum Co. Ltd.", rating: 4.0, reviews: 5, address: "Grand Trunk Rd, Phase 4, Banglore", lat: 28.63, lng: 77.25 },
    { id: 3, name: "Shakti Petrol Pump", rating: 3.8, reviews: 3, address: "Banglore", lat: 28.64, lng: 77.22 }
  ];

  const list = document.getElementById("stationsList");
  list.innerHTML = "";

  stations.forEach(st => {
    const dist = haversine(userLat, userLng, st.lat, st.lng).toFixed(2);
    const item = document.createElement("div");
    item.className = "list-group-item list-group-item-action mb-2";
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5>${st.name}</h5>
          <p class="mb-1">${st.address}</p>
          <small>⭐ ${st.rating} (${st.reviews} reviews) • ${dist} km away</small>
        </div>
        <button class="btn btn-theme btn-sm">Select</button>
      </div>
    `;
    item.querySelector("button").onclick = () => {
      selectedStationId = st.id;
      window.selectedStation = st;
      showScreen("locationScreen");
    };
    list.appendChild(item);
  });

  showScreen("stationsScreen");
}

// Haversine formula for distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Maps
// Slot Booking Map: show user + nearby stations
function initMapSlot() {
  const mapDiv = document.getElementById("mapSlot");
  if (!mapDiv) return;
  if (slotMap) { slotMap.remove(); slotMap = null; }

  const defaultLat = 12.97, defaultLng = 77.59;
  slotMap = L.map('mapSlot').setView([defaultLat, defaultLng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(slotMap);

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    slotMap.setView([lat, lng], 13);
    L.marker([lat, lng]).addTo(slotMap).bindPopup("📍 You are here").openPopup();

    // Example nearby stations (replace with real data or backend fetch)
    const stations = [
      { id: 1, name: "Ugrasen Petrol Pump", lat: lat + 0.01, lng: lng + 0.01 },
      { id: 2, name: "Hindustan Petroleum", lat: lat - 0.01, lng: lng - 0.01 }
    ];

    stations.forEach(st => {
      const marker = L.marker([st.lat, st.lng]).addTo(slotMap);
      marker.bindPopup(`
        ⛽ ${st.name}<br>
        <button onclick="selectStation(${st.id})">Select</button>
      `);
    });

  }, err => {
    L.marker([defaultLat, defaultLng]).addTo(slotMap).bindPopup("📍 Default location").openPopup();
  });
}

// Delivery Map: show only user location (no stations)
function initMapDelivery(lat = 12.97, lng = 77.59) {
  const mapDiv = document.getElementById("mapDelivery");
  if (!mapDiv) return;
  if (deliveryMap) { deliveryMap.remove(); deliveryMap = null; }

  deliveryMap = L.map('mapDelivery').setView([lat, lng], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(deliveryMap);

  if (deliveryMarker) { deliveryMap.removeLayer(deliveryMarker); deliveryMarker = null; }
  deliveryMarker = L.marker([lat, lng]).addTo(deliveryMap).bindPopup("📍 You are here").openPopup();
}

 // 👉 Add this right after initMapDelivery
function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Save delivery location as GPS coordinates
    deliveryLocation = { lat, lng };
    usedGPS = true;

    // Show map with marker
    initMapDelivery(lat, lng);

    // Move to payment screen
    showScreen("paymentScreen");
  }, err => {
    alert("Unable to fetch location: " + err.message);
  });
}

// Helper for station selection
function selectStation(id) {
  selectedStationId = id;
  alert("Station selected: " + id);
}

// Slot booking
async function bookSlot() {
  const fuel = document.getElementById("slotFuel").value;
  const time = document.getElementById("slotTime").value;
  if (!fuel || !time) { alert("Select fuel and time"); return; }
  if (!selectedStationId) { alert("Select a station"); return; }

  const payload = {
    fuel_type: fuel,
    time,
    station_id: selectedStationId,
    user_email: document.getElementById("loginEmail").value || "demo@example.com"
  };

  try {
    const res = await fetch('http://127.0.0.1:5000/api/book_slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("slotResult").innerText =
        `✅ Slot booked successfully\nFuel: ${fuel}\nTime: ${time}\nStation: ${data.station_name}`;
      document.getElementById("confirmDetails").innerHTML =
        `Fuel: ${fuel}<br>Time: ${time}<br>Station: ${data.station_name}`;
      showScreen("confirmScreen");
    } else {
      alert("Booking failed: " + (data.error || "server error"));
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// Payment
function selectPayment(mode) {
  const container = document.getElementById("paymentDetails");
  container.innerHTML = "";
  if (mode === "UPI") {
    container.innerHTML = `
      <input id="upiId" class="form-control mb-2" placeholder="example@upi">
      <button class="btn btn-theme w-100" onclick="processUPI()">Pay (UPI)</button>
    `;
  } else if (mode === "Card") {
    container.innerHTML = `
      <input id="cardNumber" class="form-control mb-2" placeholder="Card Number">
      <input id="cardExpiry" class="form-control mb-2" placeholder="MM/YY">
      <input id="cardCVV" class="form-control mb-2" placeholder="CVV">
      <button class="btn btn-theme w-100" onclick="processCard()">Pay (Card)</button>
    `;
  } else if (mode === "Cash") {
    container.innerHTML = `
      <p>💵 Cash will be collected at delivery.</p>
      <button class="btn btn-theme w-100" onclick="finishDelivery('Cash')">Confirm (Cash)</button>
    `;
  }
}

function processUPI() {
  const upi = document.getElementById("upiId").value.trim();
  if (!upi) { alert("Enter UPI ID"); return; }
  // show dummy payment screen
  document.getElementById("dummyPaymentText").innerText = `Processing UPI payment for ${upi} (dummy)`;
  showScreen("dummyPaymentScreen");
}

function processCard() {
  const card = document.getElementById("cardNumber").value.trim();
  if (!card) { alert("Enter card number"); return; }
  document.getElementById("dummyPaymentText").innerText = `Processing Card payment (dummy)`;
  showScreen("dummyPaymentScreen");
}
async function finishDelivery(paymentMode) {
  // Build order payload
  const payload = {
    fuel_main: selectedFuel,
    fuel_type: selectedFuelType,
    payment: paymentMode,
    usedGPS,
    location: deliveryLocation,
    user_email: document.getElementById("loginEmail").value || "demo@example.com"
  };

  try {
    const res = await fetch("http://127.0.0.1:5000/api/order_delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      // Build confirmation details for UI
      let details = "";
      if (usedGPS) {
        details = `Fuel: ${selectedFuelType}<br>
                   Location: Lat:${deliveryLocation.lat}, Lng:${deliveryLocation.lng}<br>
                   Payment: ${paymentMode}`;
      } else {
        details = `Fuel: ${selectedFuelType}<br>
Location: ${deliveryLocation.street}, ${deliveryLocation.city}, ${deliveryLocation.pincode}<br>
Payment: ${paymentMode}`;
 }

 document.getElementById("confirmDetails").innerHTML = details;
 showScreen("confirmScreen");
 } else {
 alert("Delivery failed: " + (data.error || "server error"));
 }
 } catch (err) {
   alert("Network error: " + err.message);
 }
} 

