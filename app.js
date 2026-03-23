const openCameraBtn = document.getElementById('openCameraBtn');
const videoPreview = document.getElementById('videoPreview');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const photoPreview = document.getElementById('photoPreview');
let stream;

openCameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoPreview.srcObject = stream;
        videoPreview.style.display = 'block';
        takePhotoBtn.style.display = 'inline-block';
        openCameraBtn.style.display = 'none';
    } catch (err) {
        alert('Nie udało się uzyskać dostępu do aparatu.');
    }
});

takePhotoBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
    stream.getTracks().forEach(track => track.stop());
    videoPreview.style.display = 'none';
    takePhotoBtn.style.display = 'none';
    openCameraBtn.style.display = 'inline-block';
        requestLocation();
});

// ===== Geolocation API =====
const coordsDisplay = document.getElementById('coords-display');

let lastCoords = null; // { latitude, longitude, accuracy }

function requestLocation() {
    if (!('geolocation' in navigator)) {
        coordsDisplay.textContent = 'Współrzędne: Przeglądarka nie wspiera Geolocation API';
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(showCoords, handleGeoError, options);
}

function showCoords(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const acc = position.coords.accuracy;
    lastCoords = { latitude: lat, longitude: lon, accuracy: acc };
    coordsDisplay.textContent = `Współrzędne: ${lat.toFixed(6)}, ${lon.toFixed(6)} (dokładność ~${Math.round(acc)} m)`;
    map.setView([lat, lon], 15); 
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon]).addTo(map)
            .bindPopup('Oto Twoje znalezisko!').openPopup();
    }
}

function handleGeoError(err) {
    console.warn('Geolocation error', err);
    let msg = 'Współrzędne: Błąd lokalizacji';
    switch (err.code) {
        case err.PERMISSION_DENIED:
            msg = 'Współrzędne: Odmowa dostępu do lokalizacji';
            break;
        case err.POSITION_UNAVAILABLE:
            msg = 'Współrzędne: Pozycja niedostępna';
            break;
        case err.TIMEOUT:
            msg = 'Współrzędne: Przekroczono czas oczekiwania';
            break;
    }
    coordsDisplay.textContent = msg;
}


window.GeoFinder = window.GeoFinder || {};
window.GeoFinder.getLastCoords = () => lastCoords;

// ---  Mapa (Leaflet.js,OpenStreetMap) ---
const map = L.map('map').setView([52.0693, 19.4803], 6); //środek Polski
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let userMarker;