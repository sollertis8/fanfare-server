'use strict';
require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const d3 = require("d3");
const multer = require('multer');
// const formidable = require('express-formidable'); const innersvg =
// require("innersvg-polyfill"); require('./public/js/index'); const
// passportConfig = require('./config/passport') passportConfig(app, passport)

const {router: usersRouter} = require('./users');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();

// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
    next();
});

app.use(fileUpload());
// app.use(formidable({     encoding: 'utf-8', uploadDir: './uploads',
// multiples: false, // req.files to be arrays of files }));
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', {session: false});

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', jwtAuth, (req, res) => {
    return res.json({data: 'rosebud'});
});

const home = require('./routes/index');
// const project = require('./projects/router');
app.use('/', home);

// app.use('/project', project)

app.use(express.static('public'));

// multer
app.use(multer({dest: './public/uploads/'}).single('file'));

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {

        mongoose.connect(databaseUrl, {
            useMongoClient: true
        }, err => {
            if (err) {
                return reject(err);
            }

            server = app.listen(port, () => {
                console.log(`Fanfare is listening on port ${port}`);
                resolve();
            }).on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose
        .disconnect()
        .then(() => {
            return new Promise((resolve, reject) => {
                console.log('Closing Server');
                server.close(err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = {
    app,
    runServer,
    closeServer
};