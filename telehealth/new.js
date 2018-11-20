'use strict';
var appointStatus = {
    Created:   {code: 1, text: 'Appointment Created'  },
    Confirmed: {code: 2, text: 'Appointment Confirmed'},
    Completed: {code: 3, text: 'Appointment Completed'},
    Cancelled: {code: 4, text: 'Appointment Cancelled'}
};

console.log(JSON.stringify(appointStatus.Completed));