const express = require('express');
const network = require('../network/network');
/* ** All PAtient routes **
* Sign-Up
* Login
* Search
* list of doctors
* Make appointment
* View EHR 
* view all Bookings
* View confirmed bookings
*/
const authCheck = (req, res, next) => {
  if (!req.user) {
    res.redirect('/patient/login');
  } else {
    next();
  }
};

const patientRouter = express.Router();

patientRouter.route('/submit')
  .post((req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/patient/login')
    }
    else{ 
      date = req.body.dat
    }
});

patientRouter.route('/logout')
  .get((req, res) => {
    req.session.destroy(function(err){
      if(err){
         console.log(err);
      }else{
          res.redirect('/patient/login');
      }
   });
   
});

patientRouter.route('/all-appointments')
  .get(async (req, res) => {
    const card = req.session.card;
    const num = req.session.num;
    console.log(num);
    if(!card && !num){
      res.redirect('/patient/login');
    }else{
      let asset = await network.patAppointments(card, num);
      console.log(asset);
      var docDetail = [];
      for(var i = 0; i < asset.length; i++) {
        var id = asset[i].doctor.split("#");
        console.log(id[1]);
        var a = await network.docDetail(card, num, id[1]);
        docDetail.push(a);
      }
      for(var i = 0; i < docDetail.length; i++) {
      console.log(docDetail[i]);
      }
      res.render('patient/booking', 
      {
        asset: asset,
        doc : docDetail
      });
    }  
});

patientRouter.route('/confirmed')
  .get(async(req, res) => {
    const card = req.session.card;
    const num = req.session.num;
    console.log(num);
    if(!card && !num){
      res.redirect('/patient/login');
    }else{
      let asset = await network.appointStatusPat(card, num,  'Appointment Confirmed');
      console.log(asset);
      var docDetail = [];
      for(var i = 0; i < asset.length; i++) {
        var id = asset[i].doctor.split("#");
        console.log(id[1]);
        var a = await network.docDetail(card, num, id[1]);
        docDetail.push(a);
      }
      let med = await network.getPatientRecords(card, num); 
      res.render('patient/confirmed', 
      {
        asset: asset,
        doc : docDetail,
        med: med
      });
    }
});

patientRouter.route('/index')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/patient/login')
    }
    else{ 
      card = req.session.card;
      num = req.session.num;
      let data = await network.patDetail(card,num, num);
      console.log(data);
      res.render('patient/index',{
        data: data
      });
    }
});

patientRouter.route('/Allowed-Doctors')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/patient/login')
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let doc = [];
      let med = await network.getPatientRecords(card, num);
      for(var i = 0; i < med.myDoctors.length; i++ ){
        doc.push(await network.docDetail(card,num,med.myDoctors[i].split("#")[1])); 
      }
    res.render('patient/allowed',
      {
        med: doc
      });
    }  
});

patientRouter.route('/login')
  .get((req, res) => {
    res.render('patient/login',
    {
      doctor: 1,
      message: false
    });
});

patientRouter.route('/register')
  .get((req, res) => {
    res.render('patient/register',
    {
      doctor: 1,
      user: req.user // doctors[id]
    });
});

patientRouter.route('/ehr')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/patient/login')
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let med = await network.getPatientRecords(card, num);
    res.render('patient/ehr',
      {
        med: med 
      });
    }
});

//check-cred
patientRouter.post('/login', async (req, res ) => {
  const card = req.body.CardId;
  const num = req.body.AccountNum;
  let asset = await network.patientData(card, num);
    if(isEmpty(asset)){
       return res.status(404).send();
    }
    else{
    req.session.card = card;
    req.session.num = num;
    console.log(req.session.num);
    console.log(req.session.card);
      res.redirect('./index');
    }
});

//post call to register member on the network
patientRouter.route('/registerPatient')
  .post( (req, res) =>  {
  //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;
  var fName = req.body.firstname;
  var lName = req.body.lastname;
  var gender = req.body.gender;
  var dob = req.body.dob;
  //print variables
  console.log('Using param - firstname: ' + fName + ' lastname: ' + lName + ' gender: ' + gender +' dob: ' + dob + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId);
  //validate member registration fields
        //else register member on the network
        network.registerPatient(cardId, accountNumber, fName, lName, gender,dob)
          .then( async (response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              await network.CreatePatientRecordTrans(cardId,accountNumber);
              //else return success
              
              res.json({
                message: "SignUp Successful!!"
              });
            }
    });
});

//post call to register member on the network
patientRouter.route('/createAppointment')
  .post((req, res) =>  {
  //declare variables to retrieve from request
  var docId = req.body.docId;
  var time = req.body.time;
  var date = req.body.date;
  console.log(req.session.num);
  var pId = req.session.num;
  var cardId = req.session.card;
  var status = "created";
  //print variables
  //validate member registration fields
        network.requestAppointTransaction(cardId, pId, date, time, docId)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
              });
            }
    });
});

//post call to register member on the network
patientRouter.route('/AddDoctor')
  .post((req, res) =>  {
    var card = req.session.card;
    var num = req.session.num;
    var doctor = req.body.doctor;
    console.log(num);
    network.addDoctorTrans(card, num, doctor)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              res.json({
                error: response.error
              });
            } else {
              //else return success
              res.json({
                success: response
              });
            }
    });
  });


//post call to register member on the network
patientRouter.route('/rmDoctor')
.post((req, res) =>  {
  var card = req.session.card;
  var num = req.session.num;
  var doctor = req.body.doctor;
  console.log(num);
  network.rmDoctorTrans(card, num, doctor)
        .then((response) => {
          //return error if error in response
          if (response.error != null) {
            res.json({
              error: response.error
            });
          } else {
            //else return success
            res.json({
              success: response
            });
          }
  });
});

function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}
module.exports = patientRouter;
