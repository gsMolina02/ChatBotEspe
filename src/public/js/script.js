const socket = io();

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

socket.on('message', ({user, avatar, message, timestamp}) => {
    typingIndicator.textContent = '';
    const msg = document.createRange().createContextualFragment(`
        <div class="message">
        <div class="image-container">
        <img src="${avatar}" alt="${user}">
        </div>
        <div class="message-body">
        <div class="user-info">
        <span class="username">${user}</span>
        <span class="times">${timestamp}</span>
        </div>
        <p>${message}</p>
        </div>
    </div>
    `);
        allMessages.append(msg);
});