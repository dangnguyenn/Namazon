// click on item to see item detail -> will show up on recently viewed
// click cart with plus to add to your cart
// click delete icon to delete item from cart
// sometimes has delay -> please wait
// username: first.lastname
// password: password123 (for all users)

import React from 'react';
import axios from 'axios';
import { Button, TextField } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import Home from './home';
//import Cookies from 'js-cookie';

export default class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            loginSuccess: false,
            welcome: true,
            token: '',
            user: null
        }       
    }

    login = async () => {
        const loginBody = {
            login: this.state.username,
            password: this.state.password
        }
        //Cookies.set('Set-Cookie', response.headers['Set-Cookie']);
        axios.defaults.withCredentials = true;
        const access = await axios.post("http://localhost:8080/user/login", loginBody);

        if(access) {
            this.setState({
                loginSuccess: true,
                token: access.data.token,
                user: access.data.user
            });
        }       
    }

    //TODO: message login success
    loginSuccess = () => {
        return (
            <div>
                <Alert color="info" severity="success">
                    <AlertTitle>Login Successful!</AlertTitle>
                    Welcome {this.state.user.firstName} {this.state.user.lastName}.
                </Alert>
            </div>
        )
    }

    logout = (status) => {
        this.setState({
            loginSuccess: status,
            token: '',
            user: null
        });
    }

    render() {
        return (
            <div>
                { !this.state.loginSuccess ?
                    <form noValidate autoComplete="off">                      
                        <div>
                            <TextField id="outlined-standard-basic" margin="normal" variant="outlined" label="User Name" 
                                        onChange={(event) => {this.setState({username: event.target.value})}} />
                        </div>
                        <div>
                            <TextField id="outlined-password-input" margin="normal" variant="outlined" type="password" label="Password" 
                                        onChange={(event) => {this.setState({password: event.target.value})}} />
                        </div>
                        <div>
                            <Button onClick={this.login} variant="contained" color="primary" size="large">Login</Button>
                        </div>              
                    </form>
                :
                    <div>
                        {/* {this.loginSuccess()} */}
                        <Home token={this.state.token} user={this.state.user} logout={this.logout} username={this.state.username}/>                     
                    </div>
                }
            </div>           
        )
    }
}