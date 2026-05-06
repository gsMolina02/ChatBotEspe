const login = document.getElementById('login');
login.addEventListener('click', () => {
    const user = document.getElementById('username').value;
    if(user !== ''){
        document.cookie = `username=${user}`;
        window.location.href = '/';
    }else{
        alert('Ingrese un nombre de usuario');
    }
});

const registrochat = document.getElementById('chat-bot');
registrochat.addEventListener('click', () => {
    window.location.href = '/register';
});