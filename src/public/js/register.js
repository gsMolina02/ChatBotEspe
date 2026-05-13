const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatar-preview');

avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { avatarPreview.src = e.target.result; };
        reader.readAsDataURL(file);
    }
});
