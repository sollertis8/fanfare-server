const express = require('express');
const bodyParser = require('body-parser');

const {User} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: true});

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
    const requiredFields = ['username', 'email', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res
            .status(422)
            .json({code: 422, reason: 'ValidationError', message: 'Missing field', location: missingField});
    }

    const stringFields = ['username', 'email', 'password'];
    const nonStringField = stringFields.find(field => field in req.body && typeof req.body[field] !== 'string');

    if (nonStringField) {
        return res
            .status(422)
            .json({code: 422, reason: 'ValidationError', message: 'Incorrect field type: expected string', location: nonStringField});
    }

    // If the username and password aren't trimmed we give an error.  Users might
    // expect that these will work without trimming (i.e. they want the password
    // "foobar ", including the space at the end).  We need to reject such values
    // explicitly so the users know what's happening, rather than silently trimming
    // them and expecting the user to understand. We'll silently trim the other
    // fields, because they aren't credentials used to log in, so it's less of a
    // problem.
    const explicitlyTrimmedFields = ['username', 'email', 'password'];
    const nonTrimmedField = explicitlyTrimmedFields.find(field => req.body[field].trim() !== req.body[field]);

    if (nonTrimmedField) {
        return res
            .status(422)
            .json({code: 422, reason: 'ValidationError', message: 'Cannot start or end with whitespace', location: nonTrimmedField});
    }

    const sizedFields = {
        username: {
            min: 1
        },
        email: {
            min: 1
        },
        password: {
            min: 8,
            // bcrypt truncates after 72 characters, so let's not give the illusion of
            // security by storing extra (unused) info
            max: 72
        }
    };
    const tooSmallField = Object
        .keys(sizedFields)
        .find(field => 'min' in sizedFields[field] && req.body[field].trim().length < sizedFields[field].min);
    const tooLargeField = Object
        .keys(sizedFields)
        .find(field => 'max' in sizedFields[field] && req.body[field].trim().length > sizedFields[field].max);

    if (tooSmallField || tooLargeField) {
        return res
            .status(422)
            .json({
                code: 422,
                reason: 'ValidationError',
                message: tooSmallField
                    ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
                    : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
                location: tooSmallField || tooLargeField
            });
    }

    let {username, email, password} = req.body;
    // Username, email and password come in pre-trimmed, otherwise we throw an error
    // before this

    return User
        .find({username})
        .count()
        .then(count => {
            if (count > 0) {
                // There is an existing user with the same email
                return Promise.reject({code: 422, reason: 'ValidationError', message: 'Username already taken', location: 'username'});
            }
            // If there is no existing user, hash the password
            return User.hashPassword(password);
        })
        .then(hash => {
            return User.create({username, email, password: hash});
        })
        .then(user => {
            return res
                .status(201)
                .json(user.serialize());
        })
        .catch(err => {
            // Forward validation errors on to the client, otherwise give a 500 error
            // because something unexpected has happened
            if (err.reason === 'ValidationError') {
                return res
                    .status(err.code)
                    .json(err);
            }
            res
                .status(500)
                .json({code: 500, message: 'Internal server error'});
        });
});

// Never expose all your users like below in a prod application we're just doing
// this so we have a quick way to see if we're creating users. keep in mind,
// you can also verify this in the Mongo shell.
router.get('/', (req, res) => {
    return User
        .find()
        .then(users => res.json(users.map(user => user.serialize())))
        .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// change user password
router.put('/account/:id', jsonParser, (req, res) => {
    const requiredFields = ['old_password', 'new_password', 'id'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `${field}\` is required`
            console.error(message);
            return res
                .status(400)
                .send(message);
        }
    }
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        console.error(message);
        return res
            .status(400)
            .send(message);
    }
    if (req.params.password !== req.body.old_password) {
        const message = `Old password (${req.body.old_password}) does not match our records`;
        console.error(message);
        return res
            .status(400)
            .send(message);
    }
    console.log(`updating password for user\` ${req.params.id}\``);
    Project.update({id: req.params.id, password: req.params.password});
    res
        .status(204)
        .end();
});

router.put('/user/:id', jsonParser, (req, res) => {
    const requiredFields = ['id'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body[0])) {
            const message = `${field}\` is required`
            console.error(message);
            return res
                .status(400)
                .send(message);
        }
    }
    if (req.params.id !== req.body[0].id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body[0].id}) must match`;
        console.error(message);
        return res
            .status(400)
            .send(message);
    }

    const toUpdate = {};
    const updateableFields = ['username', 'password', 'account_type'];
    console.log("REQ", req.body)
    updateableFields.forEach(field => {
        if (field in req.body[1]) {
            toUpdate[field] = req.body[1][field];
        }
    });
    console.log(req.params.id)
    User
        .findByIdAndUpdate(req.params.id, {$set: toUpdate})
        .then(user => res.status(204))
        .catch(err => res.status(500).json({message: err}));
    res
        .status(204)
        .end();

});

// delete user
router.delete('/account/:id', (req, res) => {
    Users.delete(req.params.id);
    console.log(`Deleted User \`${req.params.id}\``);
    res
        .status(204)
        .end();
});

// get User Account dashboard
router.get('/account/:id', (req, res) => {
    res.sendFile(__dirname + '/account.html');
});

module.exports = {
    router
};