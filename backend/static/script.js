// script.js
const api = {
  init: '/api/init',
  signup: '/api/signup',
  login: '/api/login',
  logout: '/api/logout',
  current_user: '/api/current_user',
  stations_nearby: '/api/stations_nearby',
  book_slot: '/api/book_slot',
  place_delivery: '/api/place_delivery'
};

document.addEventListener('DOMContentLoaded', () => {
  // init DB (server-side)
  fetch(api.init, {method:'POST'});

  // Auth elements
  const authTitle = document.getElementById('auth-title');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const toLogin = document.getElementById('to-login');
  const toSignup = document.getElementById('to-signup');
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const authMsg = document.getElementById('auth-msg');

  const dashboard = document.getElementById('dashboard');
  const userNameSpan = document.getElementById('user-name');
  const slotBookingBtn = document.getElementById('slot-booking-btn');
  const fuelDeliveryBtn = document.getElementById('fuel-delivery-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // Slot elements
  const slotScreen = document.getElementById('slot-screen');
  const slotFuelType = document.getElementById('slot-fuel-type');
  const slotDatetime = document.getElementById('slot-datetime');
  const slotMapEl = document.getElementById('slot-map');
  const stationListEl = document.getElementById('station-list');
  const bookSlotBtn = document.getElementById('book-slot-btn');
  const slotMsg = document.getElementById('slot-msg');
  const slotBack = document.getElementById('slot-back');
  const slotConfirm = document.getElementById('slot-confirm');
  const slotSummary = document.getElementById('slot-summary');
  const slotDone = document.getElementById('slot-done');

  // Delivery elements
  const deliveryScreen = document.getElementById('delivery-screen');
  const deliveryFuel = document.getElementById('delivery-fuel');
  const subtypesArea = document.getElementById('subtypes-area');
  const deliveryNext = document.getElementById('delivery-next');
  const deliveryBack = document.getElementById('delivery-back');
  const deliveryMsg = document.getElementById('delivery-msg');

  // Location
  const locationScreen = document.getElementById('location-screen');
  const useCurrentBtn = document.getElementById('use-current');
  const manualLocation = document.getElementById('manual-location');
  const locationContinue = document.getElementById('location-continue');
  const locationMapEl = document.getElementById('location-map');
  const locationMsg = document.getElementById('location-msg');
  const locationBack = document.getElementById('location-back');

  // Payment
  const paymentScreen = document.getElementById('payment-screen');
  const paymentMethod = document.getElementById('payment-method');
  const paymentDetailsArea = document.getElementById('payment-details-area');
  const payBtn = document.getElementById('pay-btn');
  const paymentMsg = document.getElementById('payment-msg');
  const paymentBack = document.getElementById('payment-back');

  // Dummy payment and confirmations
  const dummyPayment = document.getElementById('dummy-payment');
  const dummyText = document.getElementById('dummy-text');
  const dummyDone = document.getElementById('dummy-done');
  const deliveryConfirm = document.getElementById('delivery-confirm');
  const deliverySummary = document.getElementById('delivery-summary');
  const deliveryDone = document.getElementById('delivery-done');

  // Auth toggles
  toLogin.addEventListener('click', (e)=>{ e.preventDefault(); signupForm.style.display='none'; loginForm.style.display='block'; authTitle.textContent='Login'; authMsg.textContent='';});
  toSignup.addEventListener('click', (e)=>{ e.preventDefault(); signupForm.style.display='block'; loginForm.style.display='none'; authTitle.textContent='Signup'; authMsg.textContent='';});

  // Signup
  signupBtn.addEventListener('click', async () => {
    const first = document.getElementById('first_name').value.trim();
    const last = document.getElementById('last_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const country_code = document.getElementById('country_code').value;
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm_password').value;
    if (!first || !email || !phone || !password) { authMsg.textContent='Please fill required fields'; return; }
    if (password !== confirm) { authMsg.textContent='Passwords do not match'; return; }
    const payload = { first_name:first, last_name:last, email, phone: country_code + phone, password };
    const res = await fetch(api.signup, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const data = await res.json();
    if (res.ok) {
      authMsg.textContent='Signup successful. Please login.';
      signupForm.style.display='none'; loginForm.style.display='block'; authTitle.textContent='Login';
    } else {
      authMsg.textContent = data.error || 'Signup failed';
    }
  });

  // Login
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value;
    if (!email || !password) { authMsg.textContent='Enter email and password'; return; }
    const res = await fetch(api.login, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password})});
    const data = await res.json();
    if (res.ok) {
      authMsg.textContent='';
      showDashboard(data.user);
    } else {
      authMsg.textContent = data.error || 'Login failed';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch(api.logout, {method:'POST'});
    location.reload();
  });

  async function showDashboard(user) {
    document.getElementById('auth-screen').style.display='none';
    dashboard.style.display='block';
    userNameSpan.textContent = user.first_name || 'User';
  }

  // Check session
  (async ()=>{
    const r = await fetch(api.current_user);
    const d = await r.json();
    if (d.user) showDashboard(d.user);
  })();

  // ---------- Slot Booking ----------
  let slotMap, slotMarkers = [], selectedStation = null, userLocation = null;

  slotBookingBtn.addEventListener('click', async () => {
    dashboard.style.display='none';
    slotScreen.style.display='block';
    slotMsg.textContent='';
    // init map
    setTimeout(initSlotMap, 200);
  });

  slotBack.addEventListener('click', ()=>{ slotScreen.style.display='none'; dashboard.style.display='block'; if (slotMap) slotMap.remove(); });

  function initSlotMap(){
    slotMapEl.innerHTML = '';
    slotMap = L.map('slot-map').setView([12.93,77.62], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(slotMap);
    // get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        userLocation = {lat,lng};
        L.marker([lat,lng]).addTo(slotMap).bindPopup('You are here').openPopup();
        slotMap.setView([lat,lng],14);
        // fetch nearby stations
        const res = await fetch(api.stations_nearby, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({lat,lng})});
        const data = await res.json();
        renderStationsOnMap(data.stations);
      }, (err)=>{
        slotMsg.textContent = 'Could not get location. Please allow location or enter manually.';
      });
    } else {
      slotMsg.textContent = 'Geolocation not supported';
    }
  }

  function renderStationsOnMap(stations){
    stationListEl.innerHTML = '';
    slotMarkers.forEach(m=>slotMap.removeLayer(m));
    slotMarkers = [];
    stations.forEach((s, idx)=>{
      const marker = L.marker([s.lat,s.lng]).addTo(slotMap).bindPopup(`${s.name} (${s.distance_km} km)`);
      marker.on('click', ()=> {
        selectedStation = s;
        highlightStationInList(idx);
      });
      slotMarkers.push(marker);
      const div = document.createElement('div');
      div.className = 'station-item';
      div.textContent = `${s.name} — ${s.distance_km} km`;
      div.addEventListener('click', ()=> {
        selectedStation = s;
        slotMap.setView([s.lat,s.lng],15);
        marker.openPopup();
        highlightStationInList(idx);
      });
      stationListEl.appendChild(div);
    });
  }

  function highlightStationInList(idx){
    const items = stationListEl.querySelectorAll('.station-item');
    items.forEach((it,i)=> it.style.background = (i===idx)?'#eef':'transparent');
  }

  bookSlotBtn.addEventListener('click', async ()=>{
    if (!selectedStation) { slotMsg.textContent='Select a station from the map'; return; }
    const fuel_type = slotFuelType.value;
    const dt = slotDatetime.value;
    if (!dt) { slotMsg.textContent='Select date and time'; return; }
    const payload = {
      fuel_type,
      datetime: dt,
      station: selectedStation.name,
      station_lat: selectedStation.lat,
      station_lng: selectedStation.lng
    };
    const res = await fetch(api.book_slot, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const data = await res.json();
    if (res.ok) {
      slotScreen.style.display='none';
      slotConfirm.style.display='block';
      slotSummary.innerHTML = `<p><strong>Type:</strong> ${fuel_type}</p>
        <p><strong>Date/Time:</strong> ${dt}</p>
        <p><strong>Station:</strong> ${selectedStation.name}</p>`;
    } else {
      slotMsg.textContent = data.error || 'Booking failed';
    }
  });

  slotDone.addEventListener('click', ()=>{
    slotConfirm.style.display='none';
    dashboard.style.display='block';
    if (slotMap) slotMap.remove();
  });

  // ---------- Fuel Delivery ----------
  let selectedFuel = null;
  let selectedSubtype = null;
  let deliveryLocation = {text:'', lat:null, lng:null};
  let deliveryPayment = {method:'', details:''};

  function renderSubtypes(fuel){
    subtypesArea.innerHTML = '';
    let arr = [];
    if (fuel === 'Petrol') arr = ['Regular','Premium','Super'];
    if (fuel === 'Diesel') arr = ['Standard','High Cetane'];
    if (fuel === 'Gas') arr = ['LPG','CNG'];
    const label = document.createElement('label'); label.textContent = 'Select subtype';
    const sel = document.createElement('select'); sel.id = 'subtype-select';
    arr.forEach(a=> {
      const o = document.createElement('option'); o.value = a; o.textContent = a; sel.appendChild(o);
    });
    subtypesArea.appendChild(label);
    subtypesArea.appendChild(sel);
  }

  deliveryFuel.addEventListener('change', ()=> renderSubtypes(deliveryFuel.value));
  // initial render
  renderSubtypes(deliveryFuel.value);

  deliveryNext.addEventListener('click', ()=>{
    selectedFuel = deliveryFuel.value;
    const sel = document.getElementById('subtype-select');
    selectedSubtype = sel ? sel.value : '';
    if (!selectedFuel || !selectedSubtype) { deliveryMsg.textContent='Select fuel and subtype'; return; }
    deliveryScreen.style.display='none';
    locationScreen.style.display='block';
    locationMsg.textContent='';
  });

  deliveryBack.addEventListener('click', ()=>{ deliveryScreen.style.display='none'; dashboard.style.display='block'; });

  // Location selection
  let locationMap, locationMarker;
  useCurrentBtn.addEventListener('click', ()=>{
    locationMsg.textContent='Getting current location...';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos)=>{
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        deliveryLocation = {text:'Current location', lat, lng};
        locationMapEl.style.display='block';
        if (!locationMap) {
          locationMap = L.map('location-map').setView([lat,lng],14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(locationMap);
        } else {
          locationMap.setView([lat,lng],14);
        }
        if (locationMarker) locationMap.removeLayer(locationMarker);
        locationMarker = L.marker([lat,lng]).addTo(locationMap).bindPopup('Delivery location').openPopup();
        locationMsg.textContent='Location set. Click Continue.';
      }, (err)=>{
        locationMsg.textContent='Could not get location. Allow location access.';
      });
    } else {
      locationMsg.textContent='Geolocation not supported';
    }
  });

  locationContinue.addEventListener('click', ()=>{
    const manual = manualLocation.value.trim();
    if (!deliveryLocation.lat && !manual) { locationMsg.textContent='Choose current location or enter manually'; return; }
    if (manual) {
      deliveryLocation = {text: manual, lat: null, lng: null};
    }
    locationScreen.style.display='none';
    paymentScreen.style.display='block';
    renderPaymentDetails();
  });

  locationBack.addEventListener('click', ()=>{ locationScreen.style.display='none'; deliveryScreen.style.display='block'; if (locationMap) locationMap.remove(); });

  // Payment
  function renderPaymentDetails(){
    paymentDetailsArea.innerHTML = '';
    const method = paymentMethod.value;
    if (method === 'UPI') {
      const inp = document.createElement('input'); inp.id='upi-id'; inp.placeholder='Enter UPI ID (e.g., name@bank)';
      paymentDetailsArea.appendChild(inp);
    } else if (method === 'Card') {
      const num = document.createElement('input'); num.id='card-number'; num.placeholder='Card number';
      const exp = document.createElement('input'); exp.id='card-expiry'; exp.placeholder='MM/YY';
      const cvv = document.createElement('input'); cvv.id='card-cvv'; cvv.placeholder='CVV';
      paymentDetailsArea.appendChild(num); paymentDetailsArea.appendChild(exp); paymentDetailsArea.appendChild(cvv);
    } else if (method === 'Cash') {
      const p = document.createElement('p'); p.textContent = 'Cash will be received on delivery time.';
      paymentDetailsArea.appendChild(p);
    }
  }

  paymentMethod.addEventListener('change', renderPaymentDetails);

  paymentBack.addEventListener('click', ()=>{ paymentScreen.style.display='none'; locationScreen.style.display='block'; });

  payBtn.addEventListener('click', async ()=>{
    const method = paymentMethod.value;
    let details = '';
    if (method === 'UPI') {
      const upi = document.getElementById('upi-id').value.trim();
      if (!upi) { paymentMsg.textContent='Enter UPI ID'; return; }
      details = upi;
      // show dummy payment
      paymentScreen.style.display='none';
      dummyPayment.style.display='block';
      dummyText.textContent = `Simulating UPI payment for ${upi}`;
    } else if (method === 'Card') {
      const num = document.getElementById('card-number').value.trim();
      const exp = document.getElementById('card-expiry').value.trim();
      if (!num || !exp) { paymentMsg.textContent='Enter card details'; return; }
      details = `Card ${num.slice(-4)} exp ${exp}`;
      paymentScreen.style.display='none';
      dummyPayment.style.display='block';
      dummyText.textContent = `Simulating card payment for card ending ${num.slice(-4)}`;
    } else {
      details = 'Cash on delivery';
      // no dummy payment, directly place order
      await placeDeliveryOnServer(method, details);
      return;
    }
  });

  dummyDone.addEventListener('click', async ()=>{
    // after dummy payment, place order
    const method = paymentMethod.value;
    let details = '';
    if (method === 'UPI') details = document.getElementById('upi-id').value.trim();
    if (method === 'Card') details = `Card ${document.getElementById('card-number').value.trim().slice(-4)}`;
    dummyPayment.style.display='none';
    await placeDeliveryOnServer(method, details);
  });

  async function placeDeliveryOnServer(method, details){
    const payload = {
      fuel_type: selectedFuel,
      fuel_subtype: selectedSubtype,
      location_text: deliveryLocation.text || manualLocation.value.trim(),
      lat: deliveryLocation.lat,
      lng: deliveryLocation.lng,
      payment_method: method,
      payment_details: details
    };
    const res = await fetch(api.place_delivery, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const data = await res.json();
    if (res.ok) {
      paymentScreen.style.display='none';
      deliveryConfirm.style.display='block';
      deliverySummary.innerHTML = `<p><strong>Fuel:</strong> ${selectedFuel} - ${selectedSubtype}</p>
        <p><strong>Location:</strong> ${payload.location_text}</p>
        <p><strong>Payment:</strong> ${method} ${details?(' - '+details):''}</p>
        <p>Order confirmed. Thank you!</p>`;
    } else {
      paymentMsg.textContent = data.error || 'Order failed';
    }
  }

  deliveryDone.addEventListener('click', ()=>{
    deliveryConfirm.style.display='none';
    dashboard.style.display='block';
    // reset forms
    manualLocation.value = '';
    if (locationMap) locationMap.remove();
  });

});