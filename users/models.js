'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    account_type: {
        type: String,
        required: false
    },
    corner_type: {
        type: String,
        required: false
    }
});

UserSchema.methods.serialize = function () {
    return {
        username: this.username || "",
        // projects: this.projects || ""
        email: this.email || "",
        account_type: this.account_type || ""
    };
};

UserSchema.methods.validatePassword = function (password) {
    return bcrypt.compare(password, this.password);
};
UserSchema.statics.hashPassword = function (password) {
    return bcrypt.hash(password, 10);
};
const collection = "users";
const User = mongoose.model('User', UserSchema, collection);

module.exports = {
    User
};