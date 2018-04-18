const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();
const jwtAuth = passport.authenticate('jwt', {session: false});
const {User} = require('../users/models');

router.get('/', function (req, res) {
    res.sendFile('/index1.html', {root: ('./views')});
});

router.get('/signup', function (req, res) {
    res.sendStatus(200);
});

router.get('/login', (req, res) => {
    res.sendFile('/login.html', {root: ('./views')});
});

module.exports = router;