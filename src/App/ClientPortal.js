import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import * as routes from '../constants/routes';
import { Client } from 'fulcrum-app';
import { firebase, db } from '../firebase';
import moment from 'moment';
import { Offline, Online } from 'react-detect-offline';

import withAuthorization from '../Session/withAuthorization';
import { Navigation, NavigationSmaller } from '../Navigation';

import DailyReportSheet from '../Pages/DailyReportSheet';
import Timesheets from '../Pages/Timesheets';
import SitePlantRegister from '../Pages/SitePlantRegister';
import SQEStats from '../Pages/SQEStats';
import HazardRegister from '../Pages/HazardRegister';
import IncidentRegister from '../Pages/IncidentRegister';
import NonConformanceRegister from '../Pages/NonConformanceRegister';
import Profile from '../Pages/Profile';
import Job from '../Pages/Job';
import Loader from '../Pages/Loader';
import PageNotes from './PageNotes';
import PrintPage from './PrintPage.js';

import './index.css';
import { Layout, message, Tooltip, Modal, Button, notification } from 'antd';

const client = new Client(process.env.REACT_APP_SECRET_KEY);
const listFormIds = [
  { form_id: '4e07314d-e9e4-4efb-9b9b-3f3b9492f345' }, // Job file
  { form_id: '2f101ab8-a62b-427c-96af-09fd9b5b26bb' }, // Daily prestart
  { form_id: 'c4307607-a450-4673-8602-fa5bcb36f366' }, // Plant verification
  { form_id: '572fccd2-4500-4e59-8fac-fd3f428a4094' }, // Site inspection
  { form_id: '15f5e75d-a3d3-4856-881c-326e5e02ac54' }, // Toolbox minutes
  { form_id: '48ca5050-04ce-4939-9928-6b4509a330e7' }, // Daily Diary
  { form_id: '3e7888a5-26fa-449d-a183-b5a228c6e59a' }, // Hazard Register
  { form_id: '774f7f47-0b0f-40cd-9bd0-80e17e7bf256' }, // Incident / Non-Conformance Report
  { form_id: '89121ee5-6563-4032-99c6-44f04771637d' }, // Site Inspection
  { form_id: 'f9be86f7-bc32-401c-9ac3-18643e04ae2b' } // Task Observation
];

const { Content, Footer } = Layout;

class ClientPortal extends Component {
  constructor() {
    super();
    this.state = {
      user: {
        id: '',
        username: '',
        role: '',
        email: ''
      },
      jobFiles: [],
      dailyPrestarts: [],
      plantVerifications: [],
      safetyWalk: [],
      toolboxMinutes: [],
      dailyDiarys: [],
      hazards: [],
      incidentNonConf: [],
      siteInspection: [],
      taskObservation: [],
      loadingScreen: false,
      width: '',
      lastLoaded: null,
      devicesLastSynced: []
    };
  }
  componentDidMount() {
    if (firebase.auth.currentUser) {
      db.getCurrentUsername(firebase.auth.currentUser.uid)
        .then(snapshot => {
          var idFound = snapshot.key;
          var usernameFound = snapshot.child('username').val();
          var roleFound = snapshot.child('role').val();
          var emailFound = snapshot.child('email').val();
          var colorFound = snapshot.child('color').val();
          this.setState({
            user: {
              id: idFound,
              username: usernameFound,
              role: roleFound,
              email: emailFound,
              color: colorFound
            }
          });
        })
        .catch(err => message.error('There has been an error loading user data. Please be patient. Error: ' + err, 10));
    }
    if (
      localStorage.getItem('jobFiles') !== null &&
      localStorage.getItem('dailyPrestarts') !== null &&
      localStorage.getItem('plantVerifications') !== null &&
      localStorage.getItem('safetyWalk') !== null &&
      localStorage.getItem('toolboxMinutes') !== null &&
      localStorage.getItem('dailyDiarys') !== null &&
      localStorage.getItem('hazards') !== null &&
      localStorage.getItem('incidentNonConf') !== null &&
      localStorage.getItem('siteInspection') !== null &&
      localStorage.getItem('taskObservation') !== null &&
      localStorage.getItem('user') !== null
    ) {
      this.setState({
        jobFiles: JSON.parse(localStorage.getItem('jobFiles')),
        dailyPrestarts: JSON.parse(localStorage.getItem('dailyPrestarts')),
        plantVerifications: JSON.parse(localStorage.getItem('plantVerifications')),
        safetyWalk: JSON.parse(localStorage.getItem('safetyWalk')),
        toolboxMinutes: JSON.parse(localStorage.getItem('toolboxMinutes')),
        dailyDiarys: JSON.parse(localStorage.getItem('dailyDiarys')),
        hazards: JSON.parse(localStorage.getItem('hazards')),
        incidentNonConf: JSON.parse(localStorage.getItem('incidentNonConf')),
        siteInspection: JSON.parse(localStorage.getItem('siteInspection')),
        taskObservation: JSON.parse(localStorage.getItem('taskObservation')),
        user: JSON.parse(localStorage.getItem('user'))
      });
      this.loadFulcrumData();
      this.interval = setInterval(() => this.loadFulcrumData(), 600000);
    } else {
      this.setState({ loadingScreen: true });
      this.loadFulcrumData();
      this.interval = setInterval(() => this.loadFulcrumData(), 600000);
    }
    window.addEventListener('newContentAvailable', () => {
      notification.info({
        message: 'Please refresh the page.',
        description: 'A new version of this site has been released.',
        duration: 0,
        placement: 'bottomRight',
        style: {
          borderTop: '2px solid #3ea08e',
          background: '#1c3538',
          color: '#fff'
        }
      });
    });

    window.addEventListener('resize', this.updateDimensions);
    // client.forms.all({ schema: false })
    //   .then((page) => {
    //     console.log(page.objects);
    //   })
    //   .catch((error) => {
    //     console.log('Error getting your forms.', error.message);
    //   });
    client
      .query(
        `SELECT memberships.name,
      (SELECT FCM_FormatTimestamp(MAX(closed_at), 'America/New_York')
        FROM changesets WHERE closed_by_id=memberships.user_id) AS last_sync
        FROM memberships
      ORDER BY name;`
      )
      .then(result => {
        this.setState({
          devicesLastSynced: result.rows
        });
      })
      .catch(error => console.log(error));
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  updateDimensions = () => {
    this.setState({ width: window.innerWidth });
  };
  componentWillMount() {
    this.updateDimensions();
  }

  loadFulcrumData(evt) {
    if (evt === 'Button Refresh') {
      message.loading('Loading Fulcrum data..', 0);
    }
    var promises = listFormIds.map(form_id => client.records.all(form_id));
    Promise.all(promises)
      .then(dataReceived => {
        this.setState({
          jobFiles: dataReceived[0].objects,
          dailyPrestarts: dataReceived[1].objects,
          plantVerifications: dataReceived[2].objects,
          safetyWalk: dataReceived[3].objects,
          toolboxMinutes: dataReceived[4].objects,
          dailyDiarys: dataReceived[5].objects,
          hazards: dataReceived[6].objects,
          incidentNonConf: dataReceived[7].objects,
          siteInspection: dataReceived[8].objects,
          taskObservation: dataReceived[9].objects
        });
        // console.log("Data loaded");
      })
      .then(() => {
        this.setState({
          lastLoaded: moment().format('LT'),
          loadingScreen: false
        });

        //console.log('%c Data has been loaded successfuly.', 'color: green; font-size: 12px');
        function saveRecentData(data, num) {
          var returned = [];
          data = data.reverse();
          for (let i = 0; i < num; i++) {
            if (data[i]) {
              returned.push(data[i]);
            }
          }
          return returned;
        }
        localStorage.setItem('jobFiles', JSON.stringify(saveRecentData(this.state.jobFiles, 10)));
        localStorage.setItem('dailyPrestarts', JSON.stringify(saveRecentData(this.state.dailyPrestarts, 150)));
        localStorage.setItem('plantVerifications', JSON.stringify(saveRecentData(this.state.plantVerifications, 20)));
        localStorage.setItem('safetyWalk', JSON.stringify(saveRecentData(this.state.safetyWalk, 20)));
        localStorage.setItem('toolboxMinutes', JSON.stringify(saveRecentData(this.state.toolboxMinutes, 10)));
        localStorage.setItem('dailyDiarys', JSON.stringify(saveRecentData(this.state.dailyDiarys, 50)));
        localStorage.setItem('hazards', JSON.stringify(saveRecentData(this.state.hazards, 100)));
        localStorage.setItem('incidentNonConf', JSON.stringify(saveRecentData(this.state.incidentNonConf, 100)));
        localStorage.setItem('siteInspection', JSON.stringify(saveRecentData(this.state.siteInspection, 100)));
        localStorage.setItem('taskObservation', JSON.stringify(saveRecentData(this.state.taskObservation, 100)));
        localStorage.setItem('user', JSON.stringify(this.state.user));
        // console.log("Recent Data Saved Locally");

        db.lastLoadedData(this.state.user.id, moment().format('Do MMMM YYYY, h:mm:ss a'));
        message.destroy();
        if (evt === 'Button Refresh') {
          message.success('Data is up to date.');
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  PageNotes() {
    Modal.info({
      title: 'Page Notes',
      content: <PageNotes currentPage={window.location.pathname} />,
      onOk() {}
    });
  }

  render() {
    function navigationBased(width, user) {
      if (width >= 992) {
        return <Navigation user={user} />;
      } else if (width <= 991) {
        return <NavigationSmaller user={user} />;
      }
    }
    if (this.state.loadingScreen === true) {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <Content
            style={{
              margin: '24px 16px 0',
              minHeight: '89vh',
              background: '#f3f3f3'
            }}>
            <div style={{ padding: 24, background: '#fff', height: '100%' }}>
              <Loader />
            </div>
          </Content>
          <Footer style={{ textAlign: 'center', background: '#f3f3f3' }}>Info Sync Solutions ©2018 Created by Jim Alexander</Footer>
        </Layout>
      );
    }
    return (
      <Layout>
        {navigationBased(this.state.width, this.state.user)}
        <Layout className='layoutContent'>
          <Online>
            <Tooltip title='Data loads automatically after 10 minutes.' mouseEnterDelay={2} placement='bottom'>
              <div id='lastLoaded' onClick={() => this.loadFulcrumData('Button Refresh')} className='printHide'>
                <span id='lastLoadedDefault'>Data Last Loaded {this.state.lastLoaded}</span>
                <span id='lastLoadedRefreash'>Click to Refresh Data</span>
              </div>
            </Tooltip>
          </Online>
          <Offline>
            <div id='lastLoaded'>
              <span style={{ color: '#e74c3c', fontWeight: 600 }}>No Internet Connection</span>
            </div>
          </Offline>
          <Content style={{ margin: '24px 16px 0', minHeight: '89vh' }}>
            <div style={{ padding: 24, background: '#fff', height: '100%' }}>
              <PrintPage />
              <Route
                exact
                path={routes.CLIENTPORTAL}
                render={props => (
                  <DailyReportSheet
                    {...props}
                    user={this.state.user}
                    dailyPrestarts={this.state.dailyPrestarts}
                    jobFiles={this.state.jobFiles}
                    dailyDiarys={this.state.dailyDiarys}
                  />
                )}
              />
              <Route
                path={routes.TIMESHEETS}
                render={props => <Timesheets {...props} jobFiles={this.state.jobFiles} dailyPrestarts={this.state.dailyPrestarts} user={this.state.user} />}
              />
              <Route
                path={routes.SITEPLANTREGISTER}
                render={props => (
                  <SitePlantRegister {...props} user={this.state.user} jobFiles={this.state.jobFiles} plantVerifications={this.state.plantVerifications} />
                )}
              />
              <Route
                path={routes.SQESTATS}
                render={props => (
                  <SQEStats
                    {...props}
                    user={this.state.user}
                    dailyPrestarts={this.state.dailyPrestarts}
                    jobFiles={this.state.jobFiles}
                    dailyDiarys={this.state.dailyDiarys}
                    safetyWalk={this.state.safetyWalk}
                    toolboxMinutes={this.state.toolboxMinutes}
                    hazards={this.state.hazards}
                    incidentNonConf={this.state.incidentNonConf}
                    siteInspection={this.state.siteInspection}
                    taskObservation={this.state.taskObservation}
                  />
                )}
              />
              <Route
                path={routes.HAZARDREGISTER}
                render={props => (
                  <HazardRegister
                    {...props}
                    user={this.state.user}
                    jobFiles={this.state.jobFiles}
                    hazards={this.state.hazards}
                    toolboxMinutes={this.state.toolboxMinutes}
                    safetyWalk={this.state.safetyWalk}
                    siteInspection={this.state.siteInspection}
                    taskObservation={this.state.taskObservation}
                    dailyDiarys={this.state.dailyDiarys}
                  />
                )}
              />
              <Route
                path={routes.INCIDENTREGISTER}
                render={props => (
                  <IncidentRegister {...props} user={this.state.user} jobFiles={this.state.jobFiles} incidentNonConf={this.state.incidentNonConf} />
                )}
              />
              <Route
                path={routes.NONCONFORMANCE}
                render={props => (
                  <NonConformanceRegister {...props} user={this.state.user} jobFiles={this.state.jobFiles} incidentNonConf={this.state.incidentNonConf} />
                )}
              />
              <Route path={routes.PROFILE} render={props => <Profile {...props} user={this.state.user} />} />
              <Route path={routes.JOB} render={props => <Job {...props} user={this.state.user} devicesLastSynced={this.state.devicesLastSynced} />} />
            </div>
            <Button block onClick={this.PageNotes} style={{ maxWidth: 200, margin: '15px auto' }} className='printHide'>
              Page Notes
            </Button>
          </Content>
          <Footer style={{ textAlign: 'center', background: '#f3f3f3' }} className='printHide'>
            Info Sync Solutions ©2018 Created by Jim Alexander
          </Footer>
        </Layout>
      </Layout>
    );
  }
}
const authCondition = authUser => !!authUser;

export default withAuthorization(authCondition)(ClientPortal);
