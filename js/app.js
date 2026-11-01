// ===== 1. MOBILE MENU (Week 02) =====
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', function () {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}


// ===== 5b. API: WEATHER (Open-Meteo) =====
function describeWeather(code) {
  if(code===0) return '☀️ Clear sky';
  if(code<=3) return '⛅ Partly cloudy';
  if(code===45||code===48) return '🌫️ Foggy';
  if(code>=51&&code<=57) return '🌦️ Drizzle';
  if(code>=61&&code<=67) return '🌧️ Rain';
  if(code>=80&&code<=82) return '🌧️ Rain showers';
  if(code>=95) return '⛈️ Thunderstorm';
  return '🌤️ Mixed conditions';
}
async function showWeather(place) {
  const box = document.querySelector('#weather');
  if(!box) return;
  showLoading(box,'Loading live weather...');
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${place.lat}&longitude=${place.lng}`
    + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + '&timezone=Asia%2FColombo&forecast_days=3';
  try {
    const response = await fetch(url);
    if(!response.ok) throw new Error('Weather API error: '+response.status);
    const data = await response.json();
    if(!data.current || !data.daily) throw new Error('Unexpected weather response');
    const current=data.current,daily=data.daily;
    let forecastHtml='';
    for(let i=0;i<daily.time.length;i++) {
      const name=new Date(daily.time[i]+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
      forecastHtml+=`<div class="forecast-day"><strong>${name}</strong><p>${describeWeather(daily.weather_code[i])}</p>
       <p>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°C</p>
       <p>Rain: ${daily.precipitation_probability_max[i]??'—'}%</p></div>`;
    }
    box.innerHTML=`<div class="weather-now"><p class="temp">${Math.round(current.temperature_2m)}°C</p>
      <p>${describeWeather(current.weather_code)}</p><p>Humidity ${current.relative_humidity_2m}% · Wind ${current.wind_speed_10m} km/h</p>
      </div><div class="forecast">${forecastHtml}</div>`;
  } catch(error) {showError(box,'Weather is unavailable right now. Try again later.');console.error(error);}
}
// ===== 5c. CURRENCY (Frankfurter) =====
let usdToLkrPromise = null;
async function getUsdToLkrRate() {
  if(!usdToLkrPromise) {
    usdToLkrPromise = fetch('https://api.frankfurter.dev/v2/rate/usd/lkr')
      .then(resp=>{if(!resp.ok)throw new Error('Currency API error: '+resp.status);return resp.json();})
      .then(data=>{if(!Number.isFinite(Number(data.rate)))throw new Error('Invalid currency rate');return Number(data.rate);})
      .catch(err=>{usdToLkrPromise=null;throw err;});
  }
  return usdToLkrPromise;
}
function formatLkr(amount) {return 'Rs. '+amount.toLocaleString('en-LK',{maximumFractionDigits:0});}
async function showFeeInLkr(place) {
  const span=document.querySelector('#fee-lkr');if(!span)return;
  if(place.entryFeeUSD===0) {span.textContent='';return;}
  span.textContent='(Converting...)';
  try {const rate=await getUsdToLkrRate();span.textContent=`(approx. ${formatLkr(place.entryFeeUSD*rate)})`;}
  catch(error){span.textContent='(LKR rate unavailable)';console.error(error);}
}
// ===== 5d. INTERACTIVE MAPS (Leaflet + OpenStreetMap; Week 05 improvements) =====
const SRI_LANKA_CENTER = [7.8731, 80.7718];

function createLeafletMap(container, center, zoom) {
  // CRITICAL FIX: map-placeholder used CSS Grid, which rearranged Leaflet's
  // absolute-positioned panes and left most of the map blank.
  container.classList.remove('map-placeholder');
  container.replaceChildren();
  if (typeof L === 'undefined') {
    container.classList.add('map-unavailable');
    container.textContent = 'Map could not load. Please check your internet connection.';
    return null;
  }

  const map = L.map(container, {
    center: center,
    zoom: zoom,
    zoomControl: false,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    dragging: true,
    touchZoom: true,
    zoomSnap: 0.5
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

  // If a screen layout changes (mobile width, fullscreen, fonts), redraw tiles.
  map.whenReady(() => {
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    setTimeout(() => map.invalidateSize({ pan: false }), 250);
  });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);
  }
  return map;
}

function attachMapControls(map, wrapper, resetView) {
  if (!map || !wrapper) return;
  const resetButton = wrapper.querySelector('[data-map-action="reset"]');
  const expandButton = wrapper.querySelector('[data-map-action="expand"]');
  if (resetButton) resetButton.addEventListener('click', resetView);

  function updateExpanded(open) {
    wrapper.classList.toggle('map-expanded', open);
    document.body.classList.toggle('map-fullscreen-open', open);
    if (expandButton) {
      expandButton.textContent = open ? '✕ Close map' : '⛶ Fullscreen';
      expandButton.setAttribute('aria-expanded', String(open));
    }
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    setTimeout(() => map.invalidateSize({ pan: false }), 180);
  }
  if (expandButton) expandButton.addEventListener('click', () => {
    updateExpanded(!wrapper.classList.contains('map-expanded'));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && wrapper.classList.contains('map-expanded')) updateExpanded(false);
  });
}

function showMap(place) {
  const element = document.querySelector('#map');
  if (!element) return;
  const googleLink = document.querySelector('#map-google-link');
  if (googleLink) googleLink.href = `https://www.google.com/maps/search/?api=1&query=${place.lat}%2C${place.lng}`;

  const center = [place.lat, place.lng];
  const map = createLeafletMap(element, center, 12);
  if (!map) return;
  const marker = L.circleMarker(center, {
    radius: 10, color: '#ffffff', weight: 3, fillColor: '#0b6e6e', fillOpacity: 1
  }).addTo(map);
  const title = document.createElement('strong');
  title.textContent = place.name;
  const info = document.createElement('div');
  info.append(title, document.createElement('br'));
  info.append(document.createTextNode(`${place.district} District`));
  marker.bindPopup(info);

  const frame = element.closest('.map-frame');
  attachMapControls(map, frame, () => {
    map.setView(center, 12, { animate: true });
    marker.openPopup();
  });
}

function showAllDestinationsMap(places) {
  const element = document.querySelector('#all-map');
  if (!element) return;
  const map = createLeafletMap(element, SRI_LANKA_CENTER, 7);
  if (!map) return;

  const markerById = new Map();
  const selector = document.querySelector('#map-place-picker');
  const colorByCategory = {
    Heritage: '#bf7624', Beach: '#1985c5', Nature: '#228459', Wildlife: '#d16a27'
  };

  if (selector) {
    selector.replaceChildren(new Option('All destinations (10 places)', 'all'));
    places.slice().sort((a, b) => a.name.localeCompare(b.name))
      .forEach(place => selector.add(new Option(place.name, String(place.id))));
    selector.options[0].textContent = `All destinations (${places.length} places)`;
  }

  for (const place of places) {
    const marker = L.circleMarker([place.lat, place.lng], {
      radius: 8, weight: 3, color: '#ffffff', fillOpacity: 1,
      fillColor: colorByCategory[place.category] || '#0b6e6e'
    }).addTo(map);
    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = place.name;
    const category = document.createElement('p');
    category.textContent = `${place.category} · ${place.district} District`;
    category.style.margin = '4px 0';
    const link = document.createElement('a');
    link.href = `details.html?id=${place.id}`;
    link.textContent = 'Explore destination →';
    popup.append(title, category, link);
    marker.bindPopup(popup);
    marker.on('click', () => { if (selector) selector.value = String(place.id); });
    markerById.set(place.id, marker);
  }

  const coordinates = places.map(p => [p.lat, p.lng]);
  function reset() {
    if (selector) selector.value = 'all';
    if (coordinates.length) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [38, 38], maxZoom: 8 });
    } else {
      map.setView(SRI_LANKA_CENTER, 7);
    }
  }
  // Show all Sri Lankan destinations in view, rather than hiding some offscreen.
  map.whenReady(() => {
    reset();
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  });
  if (selector) selector.addEventListener('change', () => {
    if (selector.value === 'all') { reset(); return; }
    const place = places.find(p => String(p.id) === selector.value);
    if (!place) return;
    map.flyTo([place.lat, place.lng], 12, { duration: 0.7 });
    map.once('moveend', () => markerById.get(place.id)?.openPopup());
  });
  attachMapControls(map, element.closest('.map-frame'), reset);
}


// ===== 5e. MY TRIP STORAGE (localStorage) =====
const TRIP_KEY='lankaExplorerTrip';
const TRAVELLERS_KEY='lankaExplorerTravellers';
function getTrip() {try {const saved=JSON.parse(localStorage.getItem(TRIP_KEY)||'[]');return Array.isArray(saved)?saved:[];} catch {return [];} }
function saveTrip(ids) {localStorage.setItem(TRIP_KEY,JSON.stringify(ids));updateTripCount();}
function isInTrip(id) {return getTrip().includes(id);}
function addToTrip(id) {const trip=getTrip();if(!trip.includes(id)){trip.push(id);saveTrip(trip);}}
function removeFromTrip(id) {saveTrip(getTrip().filter(item=>item!==id));}
function updateTripCount() {
 const link=document.querySelector('nav a[href="trip.html"]');if(!link)return;
 const count=getTrip().length;link.textContent=count?`My Trip (${count})`:'My Trip';
}
function setupTripButton(place) {
  const button=document.querySelector('#add-to-trip');if(!button)return;
  function refreshButton() {
    const added=isInTrip(place.id);
    button.textContent=added?'✓ In My Trip (click to remove)':'Add to My Trip';
    button.classList.toggle('added',added);
  }
  button.addEventListener('click',()=>{
    if(isInTrip(place.id))removeFromTrip(place.id);else addToTrip(place.id);
    refreshButton();
  });
  refreshButton();
}
// ===== 6b. MY TRIP PAGE =====
async function initTripPage() {
  const body=document.querySelector('#trip-table tbody');if(!body)return;
  const summary=document.querySelector('#trip-summary'), travellersInput=document.querySelector('#travellers');
  const usdCell=document.querySelector('#total-usd'),lkrCell=document.querySelector('#total-lkr');
  const clear=document.querySelector('#clear-trip');
  showLoading(summary,'Loading your trip...');
  let places=[];
  try {places=await loadDestinations();}
  catch(error){showError(summary,'Your trip could not load. Check Live Server.');console.error(error);return;}
  let rate=null;
  try{rate=await getUsdToLkrRate();}
  catch(error){console.error('Currency conversion unavailable:',error);}
  travellersInput.value=localStorage.getItem(TRAVELLERS_KEY)||1;
  function renderTrip() {
    const selected=places.filter(p=>getTrip().includes(p.id));
    const travellers=Math.min(20,Math.max(1,parseInt(travellersInput.value,10)||1));
    travellersInput.value=travellers;
    body.innerHTML='';
    if(!selected.length)body.innerHTML='<tr><td colspan="5">Your trip is empty. <a href="destinations.html">Explore destinations</a>.</td></tr>';
    for(const place of selected) {
      const row=document.createElement('tr');
      row.innerHTML=`<td>${place.name}</td><td>${place.category}</td><td>${formatFee(place.entryFeeUSD)}</td>
       <td>${rate!==null?formatLkr(place.entryFeeUSD*rate):'Rate unavailable'}</td>
       <td><button class="remove-btn" data-id="${place.id}" type="button">Remove</button></td>`;
      body.appendChild(row);
    }
    const total=selected.reduce((sum,p)=>sum+p.entryFeeUSD,0)*travellers;
    usdCell.textContent='USD '+total.toFixed(2);
    lkrCell.textContent=rate!==null?formatLkr(total*rate):'Rate unavailable';
    summary.innerHTML=`<span class="summary-pill"><strong>${selected.length}</strong> destinations</span>
      <span class="summary-pill"><strong>${travellers}</strong> traveller${travellers===1?'':'s'}</span>
      <span class="summary-pill"><strong>USD ${total.toFixed(2)}</strong> estimated entry fees</span>`;
    updateTripCount();
  }
  body.addEventListener('click',event=>{
    const button=event.target.closest('button[data-id]');if(!button)return;
    removeFromTrip(Number(button.dataset.id));renderTrip();
  });
  travellersInput.addEventListener('change',()=>{
    const num=Math.min(20,Math.max(1,parseInt(travellersInput.value,10)||1));
    localStorage.setItem(TRAVELLERS_KEY,num);renderTrip();
  });
  clear.addEventListener('click',()=>{saveTrip([]);renderTrip();});
  renderTrip();
}
// ===== DARK MODE (Week 05) =====
function initThemeToggle() {
 const button=document.querySelector('#theme-toggle');if(!button)return;
 const theme=localStorage.getItem('lankaExplorerTheme');
 if(theme==='dark')document.body.classList.add('dark-mode');
 function update(){button.textContent=document.body.classList.contains('dark-mode')?'☀️ Light mode':'🌙 Dark mode';}
 button.addEventListener('click',()=>{
   document.body.classList.toggle('dark-mode');
   localStorage.setItem('lankaExplorerTheme',document.body.classList.contains('dark-mode')?'dark':'light');
   update();
 });
 update();
}


// ===== 2. LOAD DATA =====
async function loadDestinations() {
  const response = await fetch('data/destinations.json');
  if (!response.ok) throw new Error('Could not load destinations (status ' + response.status + ')');
  return await response.json();
}
// ===== 3. HELPERS =====
function formatFee(fee) { return fee === 0 ? 'Free' : 'USD ' + fee; }
function getPriceLabel(fee) {
  if (fee === 0) return 'Free';
  else if (fee <= 15) return 'Budget';
  else if (fee <= 30) return 'Mid-range';
  else return 'Premium';
}
function getCategoryClass(category) {
  switch (category) {
    case 'Heritage': return 'badge-heritage';
    case 'Beach': return 'badge-beach';
    case 'Nature': return 'badge-nature';
    case 'Wildlife': return 'badge-wildlife';
    default: return 'badge-other';
  }
}
function showLoading(element, text) { if(element) element.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + text; }
function showError(element, text) { if(element) {element.textContent = text; element.classList.add('error');} }
function createCard(place) {
  const card = document.createElement('article');
  card.className = 'card';
  // These values are from our own local JSON file.
  card.innerHTML = `
    <img src="${place.image}" alt="${place.name}" loading="lazy">
    <div class="card-content"><span class="eyebrow"><span class="badge ${getCategoryClass(place.category)}">${place.category}</span>${place.district} District</span>
    <h3>${place.name}</h3><p>${place.description}</p>
    <p class="fee">Entry: ${place.entryFeeUSD === 0 ? 'Free' : formatFee(place.entryFeeUSD) + ' · ' + getPriceLabel(place.entryFeeUSD)}</p>
    <a class="card-link" href="details.html?id=${place.id}">View details →</a></div>`;
  return card;
}
// ===== 4. HOME PAGE =====
async function initHomePage() {
  const list = document.querySelector('#featured-list');
  if (!list) return;
  try {
    const places = await loadDestinations();
    list.innerHTML = '';
    for(const place of places.filter(p => p.featured === true)) list.appendChild(createCard(place));
  } catch(error) { showError(list, 'Featured destinations could not be loaded.'); console.error(error); }
}
// ===== 5. DESTINATIONS PAGE =====
async function initDestinationsPage() {
  const list = document.querySelector('#destination-list');
  if(!list) return;
  const searchInput = document.querySelector('#search');
  const categorySelect = document.querySelector('#category');
  const sortSelect = document.querySelector('#sort');
  const resultCount = document.querySelector('#result-count');
  let allDestinations = [];
  try { allDestinations = await loadDestinations(); }
  catch(error) { showError(list, 'Sorry, destinations could not be loaded. Run the site using Live Server.');console.error(error);return; }
  function updateList() {
    const text = searchInput.value.toLowerCase().trim();
    const category = categorySelect.value;
    const sort = sortSelect.value;
    let filtered = allDestinations.filter(place =>
      (category === 'all' || place.category === category) &&
      (place.name.toLowerCase().includes(text) || place.district.toLowerCase().includes(text) || place.description.toLowerCase().includes(text))
    );
    filtered = [...filtered];
    if (sort === 'fee-low') filtered.sort((a,b)=>a.entryFeeUSD-b.entryFeeUSD);
    else if (sort === 'fee-high') filtered.sort((a,b)=>b.entryFeeUSD-a.entryFeeUSD);
    else filtered.sort((a,b)=>a.name.localeCompare(b.name));
    list.innerHTML = '';
    if (filtered.length===0) list.innerHTML = '<p class="no-results">No destinations found. Try another search.</p>';
    for (const place of filtered) list.appendChild(createCard(place));
    resultCount.textContent = `Showing ${filtered.length} of ${allDestinations.length} destinations`;
  }
  searchInput.addEventListener('input',updateList);
  categorySelect.addEventListener('change',updateList);
  sortSelect.addEventListener('change',updateList);
  updateList();
  // Map is added in Week 04.
  showAllDestinationsMap(allDestinations);
}
// ===== 6. DETAILS PAGE =====
async function initDetailsPage() {
  const container = document.querySelector('#destination');
  if(!container) return;
  const id = Number(new URLSearchParams(window.location.search).get('id')) || 1;
  try {
    const places = await loadDestinations();
    const place = places.find(p => p.id===id);
    if(!place) { showError(container,'Destination not found. Return to All Destinations.');document.querySelector('#add-to-trip').hidden=true;return; }
    document.title = `Lanka Explorer | ${place.name}`;
    container.innerHTML = `<img src="${place.image}" alt="${place.name}">
      <div class="detail-body"><span class="eyebrow">${place.category} · ${place.district} District</span>
      <h1>${place.name}</h1><p>${place.description}</p><h2>Quick Facts</h2>
      <ul><li><strong>Best time to visit:</strong> ${place.bestTime}</li>
      <li><strong>Entry fee:</strong> ${formatFee(place.entryFeeUSD)} <span id="fee-lkr"></span></li>
      <li><strong>Category:</strong> ${place.category}</li></ul><p class="tip">Prices are sample educational data, not confirmed current admission rates.</p></div>`;
    showWeather(place);
    showFeeInLkr(place);
    showMap(place);
    setupTripButton(place);
  } catch(error) {showError(container,'Sorry, this destination could not be loaded.');console.error(error);}
}
// ===== 7. ENQUIRY FORM =====
function initEnquiryForm() {
  const form = document.querySelector('#enquiry-form');
  if (!form) return;

  const feedback = document.querySelector('#form-message');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const date = form.querySelector('#date').value;
    const peopleText = form.querySelector('#people').value.trim();
    const people = Number(peopleText);
    const interests = form.querySelectorAll('input[name="interest"]:checked');
    const message = form.querySelector('#message').value.trim();
    const errors = [];

    if (name.length < 3) {
      errors.push('Please enter your full name (at least 3 characters).');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
    }
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(date + 'T00:00:00') < today) {
        errors.push('The travel date cannot be in the past.');
      }
    }
    if (!peopleText || !Number.isInteger(people) || people < 1 || people > 20) {
      errors.push('Number of travellers must be between 1 and 20.');
    }
    if (interests.length === 0) {
      errors.push('Please choose at least one interest.');
    }
    if (message.length > 500) {
      errors.push('Your message must be no longer than 500 characters.');
    }

    if (errors.length > 0) {
      feedback.className = 'form-error';
      feedback.innerHTML = '<ul>' + errors.map(error => `<li>${error}</li>`).join('') + '</ul>';
    } else {
      feedback.className = 'form-success';
      feedback.textContent = `Thank you, ${name}! Your form passed validation. (Demo only — nothing was sent.)`;
      form.reset();
    }
  });
}

// ===== 8. START THE APP =====
initHomePage();
initDestinationsPage();
initDetailsPage();
initEnquiryForm();
updateTripCount();
initTripPage();
initThemeToggle();
