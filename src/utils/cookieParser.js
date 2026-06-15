function parseCookies(cookieHeader = '') {
    return cookieHeader
        .split(';')
        .map(pair => pair.trim())
        .filter(Boolean)
        .reduce((acc, pair) => {
            const [key, ...val] = pair.split('=');

            if (!key) {
                return acc;
            }

            const value = val.join('=');
            acc[key] = value ? decodeURIComponent(value) : '';
            return acc;
        }, {});
}

module.exports = { parseCookies };