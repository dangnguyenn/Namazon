const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema(
    {
        firstName: String,
        lastName: String,
        email: String,
        login: String,
        password: String,
        carts: [
            {
                type: mongoose.ObjectId,
                ref: 'Cart'
            }
        ]
    }))

module.exports = User;