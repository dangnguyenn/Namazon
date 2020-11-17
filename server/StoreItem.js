const mongoose = require('mongoose');

const StoreItem = mongoose.model('StoreItem', new mongoose.Schema(
    {
        quantity: Number,
        price: Number
    }))

module.exports = StoreItem;