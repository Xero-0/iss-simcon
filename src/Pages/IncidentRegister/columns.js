import moment from 'moment'
// import React from 'react'

export function columns(action, data) {
  let type_filters =
    data &&
    [...new Set(data.map(item => item.form_values['800c'] && item.form_values['800c'].choice_values[0]))].filter(
      Boolean
    )

  return [
    {
      title: 'Date',
      dataIndex: 'form_values[a15a]',
      key: 'date',
      render: date => {
        if (date) {
          return moment(date, 'YYYY-MM-DD').format('DD-MM-YYYY')
        } else {
          return null
        }
      },
      sorter: (a, b) => {
        if (a || b) {
          let aDate = moment(a.date, 'YYYY-MM-DD')
          let bDate = moment(b.date, 'YYYY-MM-DD')
          if (aDate.isBefore(bDate)) {
            return 1
          }
          if (aDate.isAfter(bDate)) {
            return -1
          }
          return 0
        }
      },
      defaultSortOrder: 'ascending',
      width: 110
    },
    {
      title: 'Job',
      dataIndex: 'job',
      key: 'job'
    },
    {
      title: 'Reported By',
      dataIndex: 'form_values[91cc].choice_values[0]',
      key: 'reported_by'
    },
    {
      title: 'Description',
      // dataIndex: "form_values[3c19]",
      // dataIndex: "form_values[ebcb]",
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Incident Type',
      dataIndex: 'form_values[800c].choice_values[0]',
      key: 'type',
      filters:
        type_filters &&
        type_filters.map(item => {
          return { text: item, value: item }
        }),
      onFilter: (value, record) => record.form_values['800c'].choice_values[0].indexOf(value) === 0
    },
    {
      title: 'Worksafe Notified?',
      dataIndex: 'form_values[5e8b]',
      render: val => (val === 'yes' ? 'Yes' : 'no'),
      key: 'worksafe'
      // className: 'hideThis'
    },
    {
      title: 'Injury Data',
      className: 'injuryData',
      children: [
        {
          title: 'Location',
          dataIndex: 'form_values[9d98].choice_values[0]',
          key: 'location',
          className: 'subHeader',
          width: 100
        },
        {
          title: 'FAI',
          dataIndex: 'form_values[ce3e].choice_values[0]',
          key: 'fai',
          render: val => (val === 'First Aid Injury' ? '✔' : null),
          className: 'subHeader',
          width: 100
        },
        {
          title: 'MTI',
          dataIndex: 'form_values[ce3e].choice_values[0]',
          key: 'mti',
          render: val => (val === 'Medical Treatment Injury' ? '✔' : null),
          className: 'subHeader',
          width: 100
        },
        {
          title: 'LTI',
          dataIndex: 'form_values[ce3e].choice_values[0]',
          key: 'lti',
          render: val => (val === 'Lost Time Injury' ? '✔' : null),
          className: 'subHeader',
          width: 100
        },
        {
          title: 'Underground service strike',
          dataIndex: 'form_values[5c60]',
          key: 'uss',
          render: val => (val === 'yes' ? '✔' : null),
          className: 'subHeader',
          width: 100
        }
      ]
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100
    }
  ]
}
