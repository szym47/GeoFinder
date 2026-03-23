const openCameraBtn = document.getElementById('openCameraBtn');
const videoPreview = document.getElementById('videoPreview');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const photoPreview = document.getElementById('photoPreview');
const shareBtn = document.getElementById('shareBtn');
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
    if (shareBtn) shareBtn.style.display = 'inline-block';
    requestLocation();
});

// ===== Geolocation API =====
const coordsDisplay = document.getElementById('coords-display');

let lastCoords = null; // { latitude, longitude, accuracy }

function requestLocation(tryHighAccuracy = true) {
    if (!('geolocation' in navigator)) {
        coordsDisplay.textContent = 'Współrzędne: Przeglądarka nie wspiera Geolocation API';
        return;
    }

    const options = {
        enableHighAccuracy: tryHighAccuracy,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        showCoords, 
        (err) => handleGeoError(err, tryHighAccuracy), 
        options
    );
}

function showCoords(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const acc = position.coords.accuracy;
    lastCoords = { latitude: lat, longitude: lon, accuracy: acc };
    coordsDisplay.textContent = `Współrzędne: ${lat.toFixed(6)}, ${lon.toFixed(6)} (dokładność ~${Math.round(acc)} m)`;

    // Aktualizacja mapy
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon]).addTo(map);
    }
    map.setView([lat, lon], 16);
}

function handleGeoError(err, triedHighAccuracy) {
    console.warn('Geolocation error', err);
    
    // Jeśli błąd to timeout przy wysokiej dokładności, spróbuj niskiej
    if (err.code === err.TIMEOUT && triedHighAccuracy) {
        console.log('Timeout przy wysokiej dokładności, próba z niską...');
        requestLocation(false);
        return;
    }

    let msg = 'Współrzędne: Błąd lokalizacji';
    switch (err.code) {
        case err.PERMISSION_DENIED:
            msg = 'Współrzędne: Odmowa dostępu do lokalizacji (sprawdź ustawienia przeglądarki).';
            break;
        case err.POSITION_UNAVAILABLE:
            msg = 'Współrzędne: Pozycja niedostępna (sprawdź GPS).';
            break;
        case err.TIMEOUT:
            msg = 'Współrzędne: Przekroczono czas oczekiwania na GPS.';
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

// Helper to convert dataURL to File
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

shareBtn.addEventListener('click', async () => {
    if (!lastCoords) {
        alert("Najpierw musisz uzyskać lokalizację GPS.");
        requestLocation();
        return;
    }

    if (!photoPreview.src || photoPreview.src === "") {
        alert("Najpierw zrób zdjęcie.");
        return;
    }

    const shareData = { 
        title: 'Moje znalezisko GeoFinder',
        text: `Zobacz to miejsce! Współrzędne: ${lastCoords.latitude}, ${lastCoords.longitude}\nhttps://www.google.com/maps?q=${lastCoords.latitude},${lastCoords.longitude}`
    };

    let file = null;
    try {
        file = dataURLtoFile(photoPreview.src, 'znalezisko.png');
    } catch (e) {
        console.error("Błąd tworzenia pliku", e);
    }

    try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
            await navigator.share(shareData);
            console.log('Udostępniono pomyślnie z plikiem');
        } else {
            // Fallback: udostępnianie bez pliku (tylko tekst i lokalizacja)
            console.log('Udostępnianie pliku niemożliwe, udostępniam tylko tekst.');
            await navigator.share(shareData);
            console.log('Udostępniono pomyślnie (tylko tekst)');
        }
    } catch (err) {
        console.error('Błąd udostępniania:', err);
        alert("Wystąpił błąd podczas udostępniania: " + err.message);
    }
});

// Spróbuj pobrać lokalizację od razu po załadowaniu strony
requestLocation();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('[App] Service Worker zarejestrowany:', registration);
        })
        .catch((err) => {
            console.warn('[App] Błąd rejestracji Service Workera:', err);
        });
}