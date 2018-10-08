import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import SignInPage from '../Session/SignIn';
import PasswordForgetPage from '../Pages/Profile/PasswordForget';
import ClientPortal from './ClientPortal';
import withAuthentication from '../Session/withAuthentication';
import * as routes from '../constants/routes';

import './index.css';
import 'antd/dist/antd.css'; //This is the AntDesign css file
import { Layout } from 'antd';

class App extends React.Component {
  render(){
    return(
      <Router>
        <Layout>
          <Route exact path={routes.SIGN_IN} component={() => <SignInPage />} />
          <Route exact path={routes.PASSWORD_FORGET} component={() => <PasswordForgetPage />} />
          <Route path={routes.CLIENTPORTAL} component={() => <ClientPortal />} />
        </Layout>
      </Router>
    );
  }
}

export default withAuthentication(App);
