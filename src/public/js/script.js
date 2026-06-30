const params = new URLSearchParams(window.location.search);
const room = params.get('room');
const roomName = params.get('roomName') || room;

if (!room) {
    window.location.href = '/rooms';
}

const socket = io({ query: { room } });

document.getElementById('room-name').textContent = roomName;

const send = document.querySelector('#send-message');
const allMessages = document.querySelector('#all-messages');
const messageInput = document.querySelector('#message-input');
const typingIndicator = document.querySelector('#typing-indicator');
const emojiBtn = document.querySelector('#emoji-btn');
const emojiPickerContainer = document.querySelector('#emoji-picker-container');
const emojiPicker = document.querySelector('emoji-picker');

emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPickerContainer.classList.toggle('hidden');
});

emojiPicker.addEventListener('emoji-click', (e) => {
    messageInput.value += e.detail.unicode;
    messageInput.focus();
});

document.addEventListener('click', (e) => {
    if (!emojiPickerContainer.contains(e.target) && e.target !== emojiBtn) {
        emojiPickerContainer.classList.add('hidden');
    }
});

let typingTimeout;

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== '') {
        socket.emit('message', messageInput.value);
        socket.emit('stopTyping');
        clearTimeout(typingTimeout);
        messageInput.value = '';
    }
});

messageInput.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stopTyping');
    }, 2000);
});

send.addEventListener('click', () => {
    if (!messageInput.value.trim()) return;
    socket.emit('message', messageInput.value);
    socket.emit('stopTyping');
    clearTimeout(typingTimeout);
    messageInput.value = '';
});

const showNotification = (text) => {
    const div = document.createElement('div');
    div.classList.add('notification');
    div.textContent = text;
    allMessages.append(div);
};

socket.on('userJoined', ({ user }) => {
    showNotification(`${user} se unió al chat`);
});

socket.on('userLeft', ({ user }) => {
    showNotification(`${user} abandonó el chat`);
});

socket.on('typing', ({ user }) => {
    typingIndicator.textContent = `${user} está escribiendo...`;
});

socket.on('stopTyping', () => {
    typingIndicator.textContent = '';
});

socket.on('message', ({ user, avatar, message, timestamp }) => {
    typingIndicator.textContent = '';

    const img = document.createElement('img');
    img.src = avatar;
    img.alt = user;

    const imgContainer = document.createElement('div');
    imgContainer.classList.add('image-container');
    imgContainer.append(img);

    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = user;

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('times');
    timeSpan.textContent = timestamp;

    const userInfo = document.createElement('div');
    userInfo.classList.add('user-info');
    userInfo.append(usernameSpan, timeSpan);

    const p = document.createElement('p');
    p.textContent = message;

    const body = document.createElement('div');
    body.classList.add('message-body');
    body.append(userInfo, p);

    const div = document.createElement('div');
    div.classList.add('message');
    div.append(imgContainer, body);

    allMessages.append(div);
});