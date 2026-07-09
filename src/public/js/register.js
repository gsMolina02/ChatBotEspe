const params = new URLSearchParams(location.search);
const errorMsg = document.getElementById('error-msg');
if (params.get('error')) {
    errorMsg.textContent = decodeURIComponent(params.get('error'));
    errorMsg.style.display = 'block';
}

const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatar-preview');
avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => { avatarPreview.src = e.target.result; };
        reader.readAsDataURL(file);
    }
});

document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

document.getElementById('register-form').addEventListener('submit', e => {
    const pwd = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    if (pwd !== confirm) {
        e.preventDefault();
        errorMsg.textContent = 'Las contraseñas no coinciden.';
        errorMsg.style.display = 'block';
    }
});
