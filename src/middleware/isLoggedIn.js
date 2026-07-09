module.exports = (req, res, next) => {
    if (req.cookies.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};
