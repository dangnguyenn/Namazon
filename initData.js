const mongoose = require('mongoose');
const axios = require('axios');

const User = require('./User');
const Cart = require('./Cart');
const StoreItem = require('./StoreItem');

const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.eozn2.mongodb.net/namazondb?retryWrites=true&w=majority';

const config = {
    headers: {
        "X-Api-Key": "c09f4f011e5e44e1903185affb8f585c"
    }
}

const initUsers = async (size) => {
    const users = [];
    const carts = await Cart.find({});

    const firstNamePromise = axios.get("https://randommer.io/api/Name?nameType=firstname&quantity="+size, config);
    const lastNamePromise = axios.get("https://randommer.io/api/Name?nameType=surname&quantity="+size, config);

    const results = await Promise.all([firstNamePromise, lastNamePromise]);

    results[0].data.forEach((firstName, index) => {
        users.push({
            firstName: firstName,
            lastName: results[1].data[index],
            email: firstName + "_" + results[1].data[index] + "@email.com",
            login: firstName + "." + results[1].data[index],
            password: "password123",
            carts: carts[index]
        });
    });

    await User.create(users);
}

const initCarts = async (size) => {
    const carts = [];
    const storeItems = await StoreItem.find({});

    for (let i = 0; i < size; i++) {
        const items = [];
        const numberOfItem = Math.floor(Math.random()*5 +1);
        for (let j = 0; j < numberOfItem; j++) {
            const assignedItem = storeItems[Math.floor(Math.random()*storeItems.length)];
            items.push({
                quantity: Math.floor(Math.random()*10 + 1),
                storeItemId: assignedItem._id
            });
        }
        const cart = {
            cartItems: items
        }
        carts.push(cart);
    }

    await Cart.create(carts);
}

const initStoreItems = async (size) => {
    const storeItems = [];

    for (let i = 0; i < size; i++) {
        storeItems.push({
            quantity: Math.floor(Math.random()*100 + 1),
            price: Math.floor(Math.random()*100 + 1)
        })
    }

    await StoreItem.create(storeItems);
}

const populateDB = async (storeSize, cartSize) => {
    
    await mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    
    //delete previous records
    await User.deleteMany({});
    await Cart.deleteMany({});
    await StoreItem.deleteMany({});

    //accept number of entities as parameters
    await initStoreItems(storeSize);
    await initCarts(cartSize);
    await initUsers(cartSize);
}

module.exports = populateDB;