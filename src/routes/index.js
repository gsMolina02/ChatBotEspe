const express = require('express');
const router = express.Router();
const path = require('path');
const views = path.join(__dirname, '../views');

router.get('/', (req, res) => {

    res.sendFile(views + '/index.html');
});

router.get('/register', (req, res) => {
    res.sendFile(views + '/register.html');
}); 

//reenvio a la pagina principal
router.post('/register', (req, res) => {
    res.sendFile(views + '/index.html')
});

module.exports = router;