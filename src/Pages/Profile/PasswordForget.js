import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Form, message} from 'antd';
import { auth } from '../../firebase';
import * as routes from '../../constants/routes';
import './index.css';

const PasswordForgetPage = () =>

  <div style={{background: '#fff', margin: '20px auto', padding: 20}}>
    <div >
      <h1>Reset Password</h1>
      <PasswordForgetForm />
    </div>
  </div>

const updateByPropertyName = (propertyName, value) => () => ({
  [propertyName]: value,
});

const INITIAL_STATE = {
  email: '',
  error: null,
};

class PasswordForgetForm extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = (event) => {
    const { email } = this.state;
    console.log(email);
    
    auth.doPasswordReset(email)
      .then(() => {
        this.setState(() => ({ ...INITIAL_STATE }));
        message.info('Check your email for a password reset link.',10)
      })
      .catch(error => {
        this.setState(updateByPropertyName('error', error));
      });

    event.preventDefault();
  }

  render() {
    const {
      email,
      error,
    } = this.state;

    const isInvalid = email === '';

    return (
      <Form onSubmit={this.onSubmit} id="passwordForgetForm">
        <Input
          id="passwordForgetEmail"
          value={this.state.email}
          onChange={event => this.setState(updateByPropertyName('email', event.target.value))}
          type="text"
          placeholder="Email Address"
        />
        <Button disabled={isInvalid} htmlType="submit" id="passwordForgetButton">
          Reset My Password
        </Button>

        {error && <p id="passwordForgetError">{error.message}</p>}
      </Form>
    );
  }
}

const PasswordForgetLink = () =>
  <p>
    <Link to={routes.PASSWORD_FORGET}>Forgot Password?</Link>
  </p>

export default PasswordForgetPage;

export {
  PasswordForgetForm,
  PasswordForgetLink,
};



// WEBPACK FOOTER //
// ./src/components/PasswordForget/index.js
