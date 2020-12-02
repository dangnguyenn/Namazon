import React from 'react';
import axios from 'axios';

import { AppBar, Toolbar, Typography, Button, IconButton, Grid, Paper, TextField } from '@material-ui/core';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import AccessTime from '@material-ui/icons/AccessTime';
import SortByAlphaIcon from '@material-ui/icons/SortByAlpha';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
import DeleteIcon from '@material-ui/icons/Delete';

export default class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showCart: true,
            showRecent: true,
            recentItems: [],
            storeItems: [],
            cartItems: [],
            search: '',
            refresh: false,       
            storeSortAsc: false,
        }       
    }

    componentDidMount = async () => {
        //setup axios
        axios.defaults.withCredentials = true;
        const headers = {
            'Authorization': `Bearer: ${this.props.token}`
        }

        //get recently viewed items
        const recentItemsResult = await axios.get('http://localhost:8080/StoreItem/Recent');
        const recentItems = recentItemsResult.data;  
        this.setState({
            recentItems: recentItems
        })

        //get store items
        let storeItemsResult = null;
        if (this.state.search === '') {
            storeItemsResult = await axios.get('http://localhost:8080/StoreItem');
        } else {
            storeItemsResult = await axios.get('http://localhost:8080/StoreItem', {params:{query: this.state.search}});
        }
        let storeItems = storeItemsResult.data;
        // //code to re-render store list by currently order - but too slow to render (may apply for search function also)
        // //this.state.storeSortAsc should be null by default
        // if (this.state.storeSortAsc === true) {
        //     const sorted = storeItems.sort(this.sortName);
        //     storeItems = sorted;
        // } else if (this.state.storeSortAsc === false) {
        //     const sorted = storeItems.sort(this.sortName);
        //     storeItems = sorted;
        //     this.setState({
        //         storeSortAsc: false
        //     })
        // }
        this.setState({
            storeItems: storeItems
        })
        
        //get cart items
        const cartItemsResult = await axios.get(`http://localhost:8080/user/${this.props.user._id}/cart`, {headers});
        const cartItems = cartItemsResult.data.cartItems;
        this.setState({
            cartItems: cartItems
        })
    }

    //event handler when click on store item
    clickItem = async (itemId) => {
        axios.defaults.withCredentials = true;
        await axios.get(`http://localhost:8080/StoreItem/${itemId}`);      
        this.componentDidMount();
    }

    //event handler when add item from store to cart
    addItem = async (storeItem) => {
        const headers = {
            'Authorization': `Bearer: ${this.props.token}`
        }
        axios.defaults.withCredentials = true;
        const body = {
            name: storeItem.name,
            quantity: 1,
            storeItemId: storeItem._id
        }
        await axios.post(`http://localhost:8080/cart/${this.props.user.carts}/cartItem`, body, {headers});
        this.componentDidMount();
    }

    //event handler when remove item from cart
    deleteItem = async (cartItemId) => {
        const headers = {
            'Authorization': `Bearer: ${this.props.token}`
        }
        axios.defaults.withCredentials = true;
        await axios.delete(`http://localhost:8080/cart/${this.props.user.carts}/cartItem/${cartItemId}`, {headers});
        this.componentDidMount();
    }

    //event handler when search item in store
    search = async () => {
        axios.defaults.withCredentials = true;
        const storeItemsResult = await axios.get('http://localhost:8080/StoreItem', {params:{query: this.state.search}});
        let storeItems = storeItemsResult.data;
        this.setState({
            storeItems: storeItems
        })
    }

    displayRecent = () => {
        const recentList = [];
        this.state.recentItems.forEach((recentItem, index) => {
            recentList.unshift(
                <div key={index}>
                    <IconButton> {recentItem.name} </IconButton>
                </div>)
        })
        return (<div>{recentList}</div>)
    }

    displayStore = () => {
        const storeList = [];
        this.state.storeItems.forEach((storeItem, index) => {
            storeList.push(
                <div key={index} style={{paddingLeft: 80, paddingRight: 80}}>
                    <span>
                        <IconButton onClick={() => {this.clickItem(storeItem._id)}}> {storeItem.name}: {storeItem.quantity} </IconButton>
                    </span>
                    <span style={{width: '30%', float:'right'}}>
                        <IconButton onClick={() => {this.addItem(storeItem)}}> <AddShoppingCartIcon /> </IconButton>
                    </span>
                </div>)
        })
        return (<div>{storeList}</div>)
    }

    displayCart = () => {
        const cartList = [];
        this.state.cartItems.forEach((cartItem, index) => {
            cartList.push(
                <div key={index} style={{paddingLeft: 60, paddingRight: 60}}>
                    <span>
                        <IconButton> {cartItem.name}: {cartItem.quantity} </IconButton>
                    </span>
                    <span style={{width: '10%', float:'right'}}>
                        <IconButton onClick={() => {this.deleteItem(cartItem._id)}}> <DeleteIcon /> </IconButton>
                    </span>
                </div>)
        })
        return (<div>{cartList}</div>)
    }

    //algorithm to sort alphabet ascending (work with array - call without arguments)
    sortName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        let comparison = 0;
        if (nameA > nameB) comparison = 1;
        else if (nameA < nameB) comparison = -1;

        this.setState({
            storeSortAsc: true
        })
        return comparison;
    }

    render() {
        return (
            <div>
                <div style={{flexGrow: 1}}>
                    <AppBar position="static">
                        <Toolbar>
                            <IconButton onClick={() => {this.setState({showRecent: !this.state.showRecent})}} color="inherit">
                                <AccessTime />
                            </IconButton>
                            <Typography variant="h6" style={{flexGrow: 1}}>
                                Welcome {this.props.username} !
                            </Typography>
                            <IconButton onClick={() => {this.setState({showCart: !this.state.showCart})}} color="inherit">
                                <ShoppingCartIcon />
                            </IconButton>
                            <Button onClick={() => {this.props.logout(false)}} color="inherit">Logout</Button>
                        </Toolbar>
                    </AppBar>
                </div>
                <div>
                    <Grid container spacing={0} style={{marginTop: 20}}>

                        {this.state.showRecent ? 
                            <Grid item xs={3}>                      
                                <Paper elevation={3} style={{height: 600, overflow: "auto", width: '95%', float: 'right', alignItems: 'left'}}><b>Recently Viewed: (Max 10)</b>
                                    <div>{this.displayRecent()}</div>
                                </Paper>                                             
                            </Grid>
                        :
                            <Grid item xs={3}></Grid>
                        }

                        <Grid item xs={5} style={{justifySelf: 'center'}}>  
                                <Paper elevation={3} style={{height: 600, width: '90%', marginLeft: '5%'}}><b>Store:     </b>
                                    <IconButton onClick={() => {
                                                            //if (this.state.storeSortAsc == null) {
                                                            if (this.state.storeSortAsc === false) {
                                                                const sorted = this.state.storeItems.sort(this.sortName);
                                                                this.setState({storeItems: sorted});
                                                            } else this.setState({
                                                                storeItems: this.state.storeItems.reverse(),
                                                                storeSortAsc: !this.state.storeSortAsc
                                                            })}} 
                                                color="inherit" aria-label="cart">
                                        <SortByAlphaIcon /> 
                                    </IconButton>
                                    <div style={{marginTop: -15}}>           
                                        <TextField id="outlined-standard-basic" margin="normal" size="small" variant="outlined" label="Filter item by name ..." 
                                                    onBlur={(event) => {this.setState({search: event.target.value})}} />
                                        <Button onClick={this.search} variant="contained" color="primary" size="small" style={{marginTop: 22, marginLeft: 10}}>Search</Button>
                                    </div>
                                    <div style={{height: 500, overflow: "auto", borderTop: 'none'}}>                                   
                                        <div>{this.displayStore()}</div>
                                    </div>
                                </Paper>                       
                        </Grid>
                        
                        {this.state.showCart &&
                            <Grid item xs={4}>
                                <Paper elevation={3} style={{height: 600, overflow: "auto", width: '95%', float: 'left'}}><b>Your Cart:</b>
                                    <div style={{height: 550, overflow: "auto", marginTop: 20, borderTop: 'none'}}>
                                        <div>{this.displayCart()}</div> 
                                    </div>                               
                                </Paper>                          
                            </Grid>
                        }
                    </Grid>
                </div>
            </div>
        )
    }
}