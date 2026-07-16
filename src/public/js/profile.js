const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');
const avatarPreview = document.getElementById('avatar-preview');

async function loadProfile() {
    const res = await fetch('/api/me');
    if (!res.ok) return;
    const user = await res.json();
    document.getElementById('username-display').value = user.username;
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    if (user.avatar) {
        avatarPreview.src = user.avatar;
        avatarPreview.onerror = () => {
            avatarPreview.onerror = null;
            avatarPreview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=006633&color=fff&size=100&bold=true`;
        };
    } else {
        avatarPreview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=006633&color=fff&size=100&bold=true`;
    }
}
loadProfile();

document.getElementById('avatar').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => { avatarPreview.src = ev.target.result; };
        reader.readAsDataURL(file);
    }
});

document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    if (newPass && newPass !== confirmPass) {
        errorMsg.textContent = 'Las nuevas contraseñas no coinciden.';
        errorMsg.style.display = 'block';
        return;
    }

    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const formData = new FormData(e.target);
    try {
        const res = await fetch('/profile', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.error) {
            errorMsg.textContent = data.error;
            errorMsg.style.display = 'block';
        } else {
            window.location.href = '/rooms';
        }
    } catch {
        errorMsg.textContent = 'Error al guardar. Intenta de nuevo.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';
    }
});
