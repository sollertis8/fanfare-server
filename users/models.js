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
    },
    profile_image: {
        type: String,
        required: false
    },
    stage_name: {
        type: String,
        required: false,
        unique: true
    },
    genre: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    fans: {
        type: String,
        required: false
    },
    fan_of: {
        type: Array,
        required: false
    },
    applause: {
        type: String,
        required: false
    },
    shows: {
        type: String,
        required: false
    },
    tips: {
        type: String,
        required: false
    }
});

UserSchema.methods.serialize = function () {
    return {
        username: this.username || "",
        email: this.email || "",
        account_type: this.account_type || "",
        corner_type: this.corner_type || "",
        profile_image: this.profile_image || "",
        stage_name: this.stage_name || "",
        genre: this.genre || "",
        city: this.city || "",
        state: this.state || "",
        fans: this.fans || "0",
        fan_of: this.fan_of || [],
        applause: this.applause || "0",
        shows: this.shows || "0",
        tips: this.tips || "0"
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