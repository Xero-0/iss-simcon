import React, { Component } from 'react';
import { Select, Table, DatePicker, Row, Col } from 'antd';
import * as column from './columns';
import moment from 'moment';
import { db } from '../../firebase';
import './index.css';

const Option = Select.Option;

export default class SQEStats extends Component {
  state = {
    selectedJob: [],
    selectedDate: [
      '1900-01-01',
      moment()
        .add(2, 'years')
        .format('YYYY-MM-DD')
    ],
    data: [],
    total: []
  };
  selectJob() {
    let sorted = this.props.jobFiles.sort((a, b) => {
      if (a.form_values['5f36']) {
        if (a.form_values['5f36'] < b.form_values['5f36']) return 1;
        if (a.form_values['5f36'] > b.form_values['5f36']) return -1;
        return 0;
      }
      return null;
    });
    return (
      <Select
        mode='multiple'
        placeholder='Select Job Number(s)'
        style={{ width: '100%', paddingBottom: 10 }}
        onChange={jobs => {
          this.setState({
            selectedJob: jobs.map(job => job.substring(0, job.indexOf('p.lSS#@')))
          });
        }}>
        {sorted.map(job => {
          if (job.project_id) {
            return <Option key={`${job.project_id}p.lSS#@${job.form_values['5b1c']}`}>{job.form_values['5b1c']}</Option>;
          }
          return null;
        })}
      </Select>
    );
  }
  selectDate() {
    return (
      <DatePicker.RangePicker
        style={{ width: '100%' }}
        format='DD-MM-YYYY'
        onChange={date => {
          if (date.length !== 0) {
            this.setState({
              selectedDate: [date[0].format('YYYY-MM-DD'), date[1].format('YYYY-MM-DD')]
            });
          } else {
            this.setState({
              selectedDate: [
                '1900-01-01',
                moment()
                  .add(2, 'years')
                  .format('YYYY-MM-DD')
              ]
            });
          }
        }}
        ranges={{
          'All Time': [moment('1900-01-01', 'YYYY-MM-DD'), moment().add(2, 'years')],
          'This Month': [moment().startOf('month'), moment().endOf('month')],
          'Last Month': [
            moment()
              .subtract(1, 'months')
              .startOf('month'),
            moment()
              .subtract(1, 'months')
              .endOf('month')
          ],
          'Last Year': [
            moment()
              .subtract(1, 'years')
              .startOf('year'),
            moment()
              .subtract(1, 'years')
              .endOf('year')
          ]
        }}
      />
    );
  }
  componentDidMount() {
    db.lastViewedPage(this.props.user.id, 'SQE Stats');

    this.buildTable();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.jobFiles !== this.props.jobFiles || prevState.selectedJob !== this.state.selectedJob || prevState.selectedDate !== this.state.selectedDate) {
      db.lastViewedPage(this.props.user.id, 'SQE Stats');

      this.setState(
        {
          data: null
        },
        () => this.buildTable()
      );
    }
  }
  calcTimeDiff(startTime, endTime, lunch) {
    if (!startTime || !endTime) {
      return null;
    }
    let breakTime = lunch === 'yes' || lunch === undefined ? true : false;

    var start = moment.utc(startTime, 'h.mm');
    var end = moment.utc(endTime, 'h.mm');
    if (end.isBefore(start)) end.add(1, 'day');
    var d = moment.duration(end.diff(start));
    if (d.asHours() > 5 && breakTime) {
      d.subtract(30, 'minutes');
    }
    return moment.utc(+d).format('HH:mm');
  }
  buildTable() {
    var data = [];
    if (this.state.selectedDate !== null) {
      var startOf = moment(this.state.selectedDate[0], 'YYYY-MM-DD').startOf('day');
      var endOf = moment(this.state.selectedDate[1], 'YYYY-MM-DD').endOf('day');
    } else {
      //this will work until year 2100
      startOf = moment('2000-01-01', 'YYYY-MM-DD').startOf('year');
      endOf = moment('2100-01-01', 'YYYY-MM-DD').endOf('year');
    }
    function dataCalc(job, dailyPrestarts, safetyWalk, siteInspections, taskObservation, toolboxMinutes, dailyDiarys, calcTimeDiff, hazards, incidentNonConf) {
      var obj = {
        id: job.id,
        job: job.form_values['5f36'],
        title: job.form_values['7af6'],
        manHours: moment.duration(0),
        manHoursSub: moment.duration(0),
        safetyWalks: 0,
        siteInspections: 0,
        taskObservations: 0,
        hazardsReported: 0,
        hazardsClosed: 0,
        toolbox: 0,
        incidents: 0,
        nonConformance: 0,
        diesel: 0,
        unleaded: 0,
        water: 0
      };
      //Man Hours
      dailyPrestarts.forEach(prestart => {
        if (job.project_id === prestart.project_id) {
          var prestartDate = moment(prestart.form_values['80e9'], 'YYYY-MM-DD');
          if ((prestartDate > startOf && prestartDate < endOf) || (prestartDate === startOf && prestartDate === endOf)) {
            if (prestart.form_values['86b7']) {
              prestart.form_values['86b7'].forEach(log => {
                var start = log.form_values['33d3'] ? log.form_values['33d3'].choice_values[1] : '';
                var end = log.form_values['2748'] ? log.form_values['2748'].choice_values[1] : '';
                var hoursWorked = calcTimeDiff(start, end, log.form_values['54aa']);
                var addHours = moment(hoursWorked, 'HH:mm').format('HH');
                var addMins = moment(hoursWorked, 'HH:mm').format('m');

                if (log.form_values['cc82'] === 'company_personnel') {
                  obj.manHours.add(parseInt(addHours, 0), 'hours').add(parseInt(addMins, 0), 'minutes');
                }
                if (log.form_values['cc82'] === 'sub_contractor') {
                  obj.manHoursSub.add(parseInt(addHours, 0), 'hours').add(parseInt(addMins, 0), 'minutes');
                }
              });
            }
          }
        }
      });

      //Safety Walks
      safetyWalk.forEach(inspection => {
        if (inspection.project_id === job.project_id) {
          var inspectionDate = moment(inspection.form_values['91dd'], 'YYYY-MM-DD');
          if ((inspectionDate > startOf && inspectionDate < endOf) || (inspectionDate === startOf && inspectionDate === endOf)) {
            obj.safetyWalks++;
          }
        }
      });
      //Site Inspections
      siteInspections.forEach(inspection => {
        if (inspection.project_id === job.project_id) {
          var inspectionDate = moment(inspection.form_values['91dd'], 'YYYY-MM-DD');
          if ((inspectionDate > startOf && inspectionDate < endOf) || (inspectionDate === startOf && inspectionDate === endOf)) {
            obj.siteInspections++;
          }
        }
      });
      //taskObservations
      taskObservation.forEach(inspection => {
        if (inspection.project_id === job.project_id) {
          var inspectionDate = moment(inspection.form_values['cc7d'], 'YYYY-MM-DD');
          if ((inspectionDate > startOf && inspectionDate < endOf) || (inspectionDate === startOf && inspectionDate === endOf)) {
            obj.taskObservation++;
          }
        }
      });
      //ToolBox Minutes
      toolboxMinutes.forEach(toolbox => {
        if (toolbox.project_id === job.project_id) {
          var toolBoxDate = moment(toolbox.form_values['2318'], 'YYYY-MM-DD');
          if ((toolBoxDate > startOf && toolBoxDate < endOf) || (toolBoxDate === startOf && toolBoxDate === endOf)) {
            obj.toolbox++;
          }
        }
      });
      //Hazards
      hazards.forEach(hazard => {
        if (hazard.project_id === job.project_id) {
          var hazardDate = moment(hazard.form_values['9ab6'], 'YYYY-MM-DD');
          if ((hazardDate > startOf && hazardDate < endOf) || (hazardDate === startOf && hazardDate === endOf)) {
            if (hazard.status === 'Closed Out') {
              obj.hazardsClosed++;
            } else if (hazard.status === 'Action Required') {
              obj.hazardsReported++;
            }
          }
        }
      });
      //Incidents and non Conformance
      incidentNonConf.forEach(incNon => {
        if (incNon.project_id === job.project_id) {
          var hazardDate = moment(incNon.form_values['a15a'], 'YYYY-MM-DD');
          if ((hazardDate > startOf && hazardDate < endOf) || (hazardDate === startOf && hazardDate === endOf)) {
            if (incNon.form_values['800c']) {
              if (incNon.form_values['800c'].choice_values[0] === 'Quality Non-Conformance') {
                obj.nonConformance++;
              } else {
                obj.incidents++;
              }
            }
          }
        }
      });

      //Materials
      dailyDiarys.forEach(diary => {
        if (diary.project_id === job.project_id) {
          var diaryDate = moment(diary.form_values['bea6'], 'YYYY-MM-DD');
          if ((diaryDate > startOf && diaryDate < endOf) || (diaryDate === startOf && diaryDate === endOf)) {
            var diesel = diary.form_values['da81'] ? parseInt(diary.form_values['da81'], 0) : 0;
            var unleaded = diary.form_values['1946'] ? parseInt(diary.form_values['1946'], 0) : 0;
            var water = diary.form_values['6872'] ? parseInt(diary.form_values['6872'], 0) : 0;
            obj.diesel += diesel;
            obj.unleaded += unleaded;
            obj.water += water;
          }
        }
      });
      return obj;
    }
    if (this.state.selectedJob.length !== 0) {
      this.state.selectedJob.forEach(selection => {
        this.props.jobFiles.forEach(job => {
          if (job.project_id === selection) {
            data.push(
              dataCalc(
                job,
                this.props.dailyPrestarts,
                this.props.safetyWalk,
                this.props.siteInspection,
                this.props.taskObservation,
                this.props.toolboxMinutes,
                this.props.dailyDiarys,
                this.calcTimeDiff,
                this.props.hazards,
                this.props.incidentNonConf
              )
            );
          }
        });
      });
    } else {
      this.props.jobFiles.forEach(job => {
        data.push(
          dataCalc(
            job,
            this.props.dailyPrestarts,
            this.props.safetyWalk,
            this.props.siteInspection,
            this.props.taskObservation,
            this.props.toolboxMinutes,
            this.props.dailyDiarys,
            this.calcTimeDiff,
            this.props.hazards,
            this.props.incidentNonConf
          )
        );
      });
    }
    this.setState(
      {
        data
      },
      () => this.calcTotal()
    );
  }
  calcTotal() {
    var total = [
      {
        id: 1,
        job: 'Total',
        title: '',
        employees: moment.duration(0),
        contractors: moment.duration(0),
        safetyWalks: 0,
        siteInspections: 0,
        taskObservations: 0,
        hazards: 0,
        toolboxs: 0,
        incidents: 0,
        nonConformance: 0,
        diesel: 0,
        unleaded: 0,
        water: 0
      }
    ];

    this.state.data.forEach(job => {
      total[0].employees.add(job.manHours);
      total[0].contractors.add(job.manHoursSub);
      total[0].safetyWalks += job.safetyWalks;
      total[0].siteInspections += job.siteInspections;
      total[0].taskObservations += job.taskObservations;
      total[0].hazards += job.hazardsClosed;
      total[0].toolboxs += job.toolbox;
      total[0].incidents += job.incidents;
      total[0].nonConformance += job.nonConformance;
      total[0].diesel += job.diesel;
      total[0].unleaded += job.unleaded;
      total[0].water += job.water;
    });
    this.setState({
      total
    });
  }
  render() {
    return (
      <div>
        <Row gutter={10}>
          <Col xs={24} sm={24} md={12} lg={16} xl={16}>
            {this.selectJob()}
          </Col>
          <Col xs={24} sm={24} md={12} lg={8} xl={8} style={{ marginBottom: '10px' }}>
            {this.selectDate()}
          </Col>
        </Row>
        <Table
          pagination={false}
          bordered
          id='boresTableOne'
          className='boreTables tableResizer'
          columns={column.plantRegister()}
          dataSource={this.state.data}
          rowKey='id'
          size='middle'
        />
        <Table
          pagination={false}
          bordered
          id='sqeStatsTotal'
          className='boreTables tableResizer'
          columns={column.sqeTotals()}
          dataSource={this.state.total}
          rowKey='id'
          rowClassName='sqeTotal'
          size='middle'
        />
      </div>
    );
  }
}
