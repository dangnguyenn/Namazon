const mongoose = require('mongoose');

const StoreItem = mongoose.model('StoreItem', new mongoose.Schema(
    {
        name: String,
        quantity: Number,
        price: Number
    }))

module.exports = StoreItem;