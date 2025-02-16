const mongoose = require('mongoose');

const Cart = mongoose.model('Cart', new mongoose.Schema(
    {
        cartItems: [
            {
                name: String,
                quantity: Number,
                storeItemId: {
                    type: mongoose.ObjectId,
                    ref: 'StoreItem'
                }
            }
        ]
    }))

module.exports = Cart;