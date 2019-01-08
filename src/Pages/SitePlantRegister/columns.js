import moment from 'moment'
export const plantRegister = [{
  title: 'Date',
  dataIndex: 'date',
  key: 'date',
  render: (date) => {
    if (date) {
      return moment(date, 'YYYY-MM-DD').format('DD-MM-YYYY')
    } else {
      return null
    }
  },
  sorter: (a, b) => {  
    let aDate = moment(a.date, 'YYYY-MM-DD').toDate()  
    let bDate = moment(b.date, 'YYYY-MM-DD').toDate()  
    if (aDate > bDate) { return -1; }
    if (aDate < bDate) { return 1; }    
    return 0;
  },
  defaultSortOrder: 'descending',
  width: 100
}, {
  title: 'Type of plant',
  dataIndex: 'type',
  key: 'plantType',
  width: 100
}, {
  title: 'Make / Model',
  dataIndex: 'make',
  key: 'makeModel',
  width: 200
}, {
  title: 'Owner / Company',
  dataIndex: 'owner',
  key: 'ownerCompany',
  width: 200
}, {
  title: 'Serial / ID number',
  dataIndex: 'serial',
  key: 'serialNumber',
  width: 100
}, {
  title: 'Verification Records',
  dataIndex: 'records',
  key: 'records',
  width: 100
}];