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
    // Zatrzymaj kamerę
    stream.getTracks().forEach(track => track.stop());
    videoPreview.style.display = 'none';
    takePhotoBtn.style.display = 'none';
    openCameraBtn.style.display = 'inline-block';
});