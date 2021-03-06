import moment from 'moment'
// import React from 'react'

export function columns(action) {
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
      width: 100
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
      dataIndex: 'form_values[d8a6]',
      key: 'description'
    },
    {
      title: 'Type of Non Conformance',
      className: 'typeOf',
      children: [
        {
          title: 'Product',
          dataIndex: 'form_values[5a4f].choice_values[0]',
          key: 'product',
          className: 'subHeader',
          render: val => (val === 'Product non-conformance requiring re-work' ? '✔' : null)
        },
        {
          title: 'System',
          dataIndex: 'form_values[5a4f].choice_values[0]',
          key: 'system',
          className: 'subHeader',
          render: val => (val === 'System Non-Compliance (SCC)' ? '✔' : null)
          // className: 'hideThis'
        },
        {
          title: 'Client',
          dataIndex: 'form_values[5a4f].choice_values[0]',
          key: 'client',
          className: 'subHeader',
          render: val => (val === 'Client issued system non-compliance' ? '✔' : null)
        },
        {
          title: 'Cost',
          className: 'subHeader',
          dataIndex: 'form_values[7dc5]',
          render: val => (val ? `$${val}` : null),
          key: 'cost'
        }
      ]
    },

    {
      title: 'Status',
      // className: 'status',
      width: 100,
      key: 'status',
      dataIndex: 'status'
    }
  ]
}
