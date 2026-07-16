const params = new URLSearchParams(location.search);
const errorMsg = document.getElementById('error-msg');
if (params.get('error')) {
    errorMsg.textContent = decodeURIComponent(params.get('error'));
    errorMsg.style.display = 'block';
}

document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});
