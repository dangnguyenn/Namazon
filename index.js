/* 
    Uncomment to re-create new data for database!
    - first argument: number of items in store
    - second argument: number of users/carts
*/
//require('./initData')(50, 30);    

const User = require('./User');
const Cart = require('./Cart');
const StoreItem = require('./StoreItem');

const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();

const {body, validationResult} = require('express-validator');
const userValidator = [
    body('firstName').isAlpha(),
    body('lastName').isAlpha(),
    body('email').isEmail()
];
const cartValidator = [
    body('storeItemId').isMongoId(),
    body('quantity').isNumeric()
];

const url = 'mongodb+srv://dbUser:dbUserPassword@cluster0.eozn2.mongodb.net/namazondb?retryWrites=true&w=majority';

const initDataBase = async () => {
    let database = await mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
    if (database) {
        app.use(session({
            secret: 'SecretKey',
            store: new MongoStore({mongooseConnection: mongoose.connection}),
            resave: true,
            saveUninitialized: true
        }));
        app.use(router);
        console.log('*Successfully connected to DB.*');  
    }
    else {
        console.log('*Error connecting to DB.*');
    }
}
initDataBase();

const jwt = require('jsonwebtoken');
const accessTokenSecret = "jwtSecret";

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
    
        if (authHeader) {
            const jwtToken = authHeader.split(' ')[1];
            const user = jwt.verify(jwtToken, accessTokenSecret);
            req.jwtInfo = user;
            next();
        }
        else {
            //TODO redirect (302) to login
            res.send(401);
        }
    }
    catch (e) {
        console.log(e);
        res.send(403);
    }
};

const port = process.env.PORT || 8080;
app.listen(port);


/////////////////////////////////////////////////////////////////
// user routes

//JWT - get information of logined user
router.get('/user/myinfo', authenticate, async (req, res) => {
    res.send(req.jwtInfo.user);
});

//get all users - Additional
router.get('/user', authenticate, async (req, res) => {
    let users = null;
    
    //optional find user by Id using query param
    if (req.query.userId) {
        users = await User.findById(req.query.userId).populate('carts');
    }
    else {
        users = await User.find({});
    }

    //return users if found, else return 404
    res.send(users ? users : 404);
});

//get the user with given id
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId).populate('carts');

        //return the user if found, otherwise return 404
        res.send(foundUser ? foundUser : 404);
    }
    catch(e) {
        console.log(e);
        res.send(404);
    }   
});

//create a new user, return the new user
router.post('/user', userValidator, authenticate, async (req, res) => {
    //validate request body
    if (!validationResult(req).isEmpty()) {
        
    }

    const userLogin = await User.findOne({login: req.body.login});
    if (!userLogin) {
        const newUser = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            login: req.body.login,
            password: req.body.password,
            carts: [await Cart.create({ cartItems: [] })]
        });
        res.send(newUser);
    }
    else {
        res.status(400).send("user login is already existed.");
    }
});

//get the user's cart
router.get('/user/:userId/cart', authenticate, async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId).populate('carts');

        //if the user is not found, response 404
        if (!foundUser) {
            return res.send(404);
        }

        let foundCart = null;

        //if request has query param, find cart that matches query
        if (req.query.cartId) {
            foundUser.carts.map((cart) => {
                if (cart._id.equals(req.query.cartId)) {
                    foundCart = cart;
                }
            });
        }
        //else, find user's first cart
        else {
            foundCart = foundUser.carts[0];
        }

        res.send(foundCart ? foundCart : 404);
    }
    catch(e) {
        console.log(e);
        res.send(404);
    } 
});

//empty the user's cart, return removed item(s)
router.delete('/user/:userId/cart', authenticate, async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.userId).populate('carts');

        //if the user is not found, response 404
        if (!foundUser) {
            return res.send(404);
        }
    
        //if request has query parameters, find and empty cart that matches query
        if (req.query.cartId) {
            const foundCart = foundUser.carts.find((cart) => {
                return cart._id.equals(req.query.cartId);
            });
            if (foundCart) {
                const foundCartItems = foundCart.cartItems;
                await Cart.updateOne({_id: foundCart._id}, {cartItems:[]});
                return res.send(foundCartItems);
            }
            return res.send(404);
        }
    
        //get the first cart, return 404 if not found
        const foundCart = await foundUser.carts[0];
        if (!foundCart) {
            return res.send(404);
        }
    
        //get the items in first cart
        const firstCartItems = foundCart.cartItems;
    
        //update to database
        firstCartItems.map(async (item) => {
            await Cart.updateOne({_id: foundCart._id}, {cartItems:[]});
        });
    
        //return removed items
        res.send(firstCartItems);
    }
    catch(e) {
        console.log(e);
        res.send(404);
    }
});


/////////////////////////////////////////////////////////////////
// cart routes

//add new item to cart
router.post('/cart/:cartId/cartItem', cartValidator, authenticate, async (req, res) => {
    //validate request body
    if (!validationResult(req).isEmpty()) {
        return res.status(400).send("Invalid request body.");
    }

    try {
        //find the cart, return 404 if not found
        const foundCart = await Cart.findById(req.params.cartId);
        if (!foundCart) {
            return res.send(404);
        }

        const newItem = {
            quantity: req.body.quantity,
            storeItemId: req.body.storeItemId
        }

        //find if new item is from store, return 404 if not
        const foundItemInStore = await StoreItem.findById(newItem.storeItemId);
        if (!foundItemInStore) {
            return res.send(404);
        }

        //find if item already in cart
        const itemAlreadyInCart = foundCart.cartItems.find((item) => {
            return item.storeItemId == newItem.storeItemId;
        });
        //if item already in cart, calculate quantity and update database. Else, create new item on database
        if (itemAlreadyInCart) {
            itemAlreadyInCart.quantity += newItem.quantity;
            await Cart.replaceOne({_id: foundCart._id}, {cartItems: foundCart.cartItems});
        }
        else {
            foundCart.cartItems.push(newItem);
            await Cart.updateOne({_id: foundCart._id}, {cartItems: foundCart.cartItems});
        }

        //return updated cart
        res.send(await Cart.findById(req.params.cartId));
    }
    catch(e) {
        console.log(e);
        res.send(404);
    }
});

//remove an item from cart
router.delete('/cart/:cartId/cartItem/:cartItemId', authenticate, async (req, res) => {
    try {
        //find the cart, return 404 if not found
        const foundCart = await Cart.findById(req.params.cartId);
        if (!foundCart) {
            return res.send(404);
        }

        //find index of matched item in the cart, return 404 if not found
        const foundItemIndex= foundCart.cartItems.findIndex((item) => {
            return item._id == req.params.cartItemId;
        })
        if (foundItemIndex < 0) {
            return res.send(404);
        }

        //remove the found item and update database
        foundCart.cartItems.splice(foundItemIndex, 1);
        await Cart.replaceOne({_id: foundCart._id}, {cartItems: foundCart.cartItems});

        //return updated cart
        res.send(await Cart.findById(req.params.cartId));
    }
    catch(e) {
        console.log(e);
        res.send(404);
    }
});


/////////////////////////////////////////////////////////////////
// StoreItem routes

//session - get the last retrieved storeItems
router.get('/StoreItem/Recent', async (req, res) => {
    let lastViewedItems = await req.session.lastViewedItems;

    //filter number of items to return if less then 10
    if (req.query.num && req.query.num < 10) {
        lastViewedItems = lastViewedItems.slice(Math.max(lastViewedItems.length - req.query.num, 0));
    }
    //return up to 10 items
    else {
        lastViewedItems = lastViewedItems.slice(Math.max(lastViewedItems.length - 10, 0));
    }

    res.send(lastViewedItems);
});

//get store item's details
router.get('/StoreItem/:storeItemId', async (req, res) => {
    try{
        const foundStoreItem = await StoreItem.findById(req.params.storeItemId);

        //create array with new item if not existing
        if (!req.session.lastViewedItems) {
            req.session.lastViewedItems = [foundStoreItem];
        }
        else {
            const foundItemIndex = req.session.lastViewedItems.findIndex((item) => {
                return item._id == foundStoreItem._id;
            })
            //if item is already in array, delete that item (to make recent viewed item up-to-date)
            if (foundItemIndex >= 0) {
                req.session.lastViewedItems.splice(foundItemIndex, 1);       
            }
            //push found item to the end of array
            req.session.lastViewedItems.push(foundStoreItem);
        }

        res.send(foundStoreItem || 404);
    }
    catch(e) {
        console.log(e);
        res.send(404);
    }
    
});

//get all items that satisfy the regular expression query
router.get('/StoreItem', async (req, res) => {
    let foundStoreItems = await StoreItem.find({});
    if (req.query.query) {
        const regex = /req.query.query/;
        foundStoreItems = foundStoreItems.filter((item) => {
            return regex.test(item.description) || regex.test(item.name);
        });
    }

    res.send(foundStoreItems);
});


/////////////////////////////////////////////////////////////////
// JWT route(s)

router.post('/user/login', async (req, res) => {
    const {login, password} = req.body;
    const foundUser = await User.findOne({login, password});

    if (foundUser) {
        //create token 
        const accessToken = jwt.sign({user: foundUser}, accessTokenSecret);

        res.send(accessToken);
    }
    else {
        res.send(403);
    }
});