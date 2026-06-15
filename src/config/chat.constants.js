const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const MAX_MESSAGE_LENGTH = 500;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const SOCKET_EVENTS = {
    CONNECT: 'connection',
    USER_JOINED: 'userJoined',
    USER_LEFT: 'userLeft',
    MESSAGE: 'message',
    TYPING: 'typing',
    STOP_TYPING: 'stopTyping'
};

module.exports = {
    DEFAULT_AVATAR,
    MAX_MESSAGE_LENGTH,
    MAX_AVATAR_SIZE,
    SOCKET_EVENTS
};