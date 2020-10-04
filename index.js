//Assumptions:
//- Each user has at least one cart.
//- Each cart belongs to only one user, and each cart has to belong to someone (no abandoned cart).
//- Each id (user, cart, cartItem, storeItem) is unique in its group/category.

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

let users = [];
let userNextId = 0;

let carts = [];
let cartNextId = 0;

let cartItems = [];
let cartItemNextId = 0;

let storeItems = [];
let storeItemNextId = 0;

const config = {
    headers: {
        "X-Api-Key": "c09f4f011e5e44e1903185affb8f585c"
    }
}

const initializeData = async (userSize, cartSize) => {

    if(userSize > cartSize) {
        console.log("Number of carts needs to be greater or equal number of users (to ensure each user has at least 1 cart).");
        console.log("Initialization fails.");
        return;
    }

    const firstNamePromise = axios.get("https://randommer.io/api/Name?nameType=firstname&quantity="+userSize, config);
    const lastNamePromise = axios.get("https://randommer.io/api/Name?nameType=surname&quantity="+userSize, config);

    const results = await Promise.all([firstNamePromise, lastNamePromise]);

    results[0].data.forEach((firstName, index) => {
        users.push({
            userId: ++userNextId,
            firstName: firstName,
            lastName: results[1].data[index],
            email: firstName + results[1].data[index] + userNextId + "@gmail.com",
            carts: []
        });
    });

    for (let i=0; i<cartSize; i++) {
        let userIndex = null;
        //ensure each user has at least 1 cart
        if (i < userSize) {
            userIndex = i;
        }
        else {
            userIndex = Math.floor(Math.random() * userSize);
        }       
        const cart = {
            cartId: ++cartNextId,
            userId: users[userIndex].userId,
            cartItems: []
        };
        carts.push(cart);
        users[userIndex].carts.push(cart);
    }
    
    const storeItem1 = {
        storeItemId: ++storeItemNextId,
        storeItemName: "phone",
        price: 500
    }
    
    const storeItem2 = {
        storeItemId: ++storeItemNextId,
        storeItemName: "cell phone",
        price: 800
    }
    
    const storeItem3 = {
        storeItemId: ++storeItemNextId,
        storeItemName: "laptop",
        price: 1000
    }
     
    storeItems.push(storeItem1);
    storeItems.push(storeItem2);
    storeItems.push(storeItem3);

}

initializeData(10, 10);


//get all users - Additional
app.get('/user', (req, res) => {
    res.send(users);
})

//get the user with given id
app.get('/user/:userId', (req, res) => {
    const foundUser = users.find((user) => {
        return user.userId == req.params.userId;
    })
    //return the user if it's found, otherwise return 404
    res.send(foundUser || 404);
})

//create a new user, return the new user
app.post('/user', (req, res) => {
    //check if the request body is lack of properties
    if (!(req.body.firstName && req.body.lastName && req.body.email)) {
        res.send(422);
        return;
    }
    let newUser = req.body;
    newUser.userId = ++userNextId;
    //create new cart for new user. (Old carts already belong to old users)
    const newCart = {
        cartId: ++cartNextId,
        userId: userNextId,
        cartItems: []
    };
    newUser.carts = [newCart];
    users.push(newUser);
    res.send(newUser);
})

//get the user's cart
app.get('/user/:userId/cart', (req, res) => {
    const foundUser = users.find((user) => {
        return user.userId == req.params.userId;
    });
    //response 404 if the user is not found
    if (!foundUser) {
        res.send(404);
        return;
    }
    //if request has query param, find cart that matches query
    if (req.query.cartId) {
        const foundCart = foundUser.carts.find((cart) => {
            return cart.cartId == req.query.cartId;
        });
        res.send(foundCart || 404);
        return;
    }
    //return the first cart of foundUser
    res.send(foundUser.carts[0]);
})

//get a specific user's cart - Additional
app.get('/user/:userId/cart/:cartId', (req, res) => {
    let foundCart = null;
    const foundUser = users.find((user) => {
        //return only the user has userId AND cartId match the path param
        return user.userId == req.params.userId && user.carts.find((cart) => {
            return foundCart = (cart.cartId == req.params.cartId) ? cart : null;
        });
    });
    res.send(foundUser ? foundCart : 404);
})

//empty the user's cart, return removed item(s)
app.delete('/user/:userId/cart', (req, res) => {
    const foundUser = users.find((user) => {
        return user.userId == req.params.userId;
    });
    //response 404 if the user is not found
    if (!foundUser) {
        res.send(404);
        return;
    }
    let removedItems = [];
    //if request has query parameters, find and empty cart that matches query
    if (req.query.cartId) {
        const foundCart = foundUser.carts.find((cart) => {
            return cart.cartId == req.query.cartId;
        });
        res.send(foundCart ? foundCart.cartItems.splice(0, foundCart.cartItems.length) : 404);
        return;
    }
    //empty the first cart of foundUser
    let firstCartItems = foundUser.carts[0].cartItems; 
    res.send(firstCartItems.splice(0, firstCartItems.length));
})

//get all items in specific user's cart - Additional
app.get('/user/:userId/cart/:cartId/cartItem', (req, res) => {
    const foundUser = users.find((user) => {
        return user.userId == req.params.userId;
    });
    if (!foundUser) {
        res.send(404);
        return;
    }
    const foundCart = foundUser.carts.find((cart) => {
        return cart.cartId == req.params.cartId;
    });
    res.send(foundCart ? foundCart.cartItems : 404);
})

//create a new item in specific user's cart, return new item
app.post('/cart/:cartId/cartItem', (req, res) => {
    //check if the request body is lack of properties
    if (!(req.body.storeItemId && req.body.quantity)) {
        res.send(422);
        return;
    }
    let foundStoreItem = storeItems.find((storeItem) => {
        return storeItem.storeItemId == req.body.storeItemId;
    })
    //response 404 if the item is not on the store
    if (!foundStoreItem) {
        res.send(404);
        return;
    }
    const foundCart = carts.find((cart) => {
        return cart.cartId == req.params.cartId;
    });
    //response 404 if the cart is not found
    if (!foundCart) {
        res.send(404);
        return;
    }
    const newItem = {
        cartItemId: ++cartItemNextId,
        storeItemId: req.body.storeItemId,
        cartId: foundCart.cartId,
        quantity: req.body.quantity
    }
    foundCart.cartItems.push(newItem);
    res.send(newItem);
})

//remove an item from cart, return removed item
app.delete('/cart/:cartId/cartItem/:cartItemId', (req, res) => {
    const foundCart = carts.find((cart) => {
        return cart.cartId == req.params.cartId;
    });
    //response 404 if the cart is not found.
    if (!foundCart) {
        res.send(404);
        return;
    }
    const foundItemIndex = foundCart.cartItems.findIndex((cartItem) => {
        return cartItem.cartItemId == req.params.cartItemId;
    })
    //response 404 if the item is not found.
    if (foundItemIndex < 0) {
        res.send(404);
        return;
    }
    const foundItem = foundCart.cartItems.splice(foundItemIndex, 1);
    res.send(foundItem || 404);
})

//get one store item
app.get('/storeItem/:storeItemId', (req, res) => {
    const foundStoreItem = storeItems.find((storeItem) => {
        return storeItem.storeItemId == req.params.storeItemId;
    })
    res.send(foundStoreItem || 404);
})

//get all store items, or with filter query param
app.get('/storeItem', (req, res) => {
    let foundItems = storeItems;
    //if filter has name, return all items match that name
    if (req.query.storeItemName) {
        foundItems = storeItems.filter((storeItem) => {
            return storeItem.storeItemName.includes(req.query.storeItemName);
        });
    }
    //if filter has price, return all items cheaper or same price
    if (req.query.price) {
        foundItems = storeItems.filter((storeItem) => {
            return storeItem.price <= req.query.price;
        });
    }
    res.send(foundItems);
})

app.listen(8080);