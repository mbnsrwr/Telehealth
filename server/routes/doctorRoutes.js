const express = require('express');
const flash    = require('connect-flash');
const passport = require('passport');
const network = require('../network/network');
/* ** Doctor routes
* Login
* Sign up
* View Confirmed Appintments
* View Appointment Requests
* Ehr Access list of patient
* Ehr View List
*/

const docRouter = express.Router();

docRouter.route('/login')
  .get((req, res ) => {
    res.render('doctor/login',
    {
      doctor: 1,
      user: req.user,
      message : '' // doctors[id]
    });
});

docRouter.get('/index',async (req, res, next) => {
  if(!req.session.card && !req.session.num){
    res.redirect('/doctor/login')
  }
  else{
    card = req.session.card;
    num = req.session.num;
    let data = await network.docDetail(card, num, num);;
    console.log(data);
    res.render('doctor/index', {
      data : data
    });
  }
});

docRouter.route('/logout')
  .get((req, res) => {
    req.session.destroy(function(err){
      if(err){
         console.log(err);
      }else{
          res.redirect('/doctor/login');
      }
   });
});

 docRouter.route('/appointments-requests')
  .get( async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/doctor/login');
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let data = await network.docAppointments(card, num);
      var patDetail = [];
      for(var i = 0; i < data.length; i++) {
        var id = data[i].patient.split("#");
        console.log(data[i]);
        var a = await network.patDetail(card, num, id[1]);
        patDetail.push(a);
      }
      res.render('doctor/requests',{
        data: data,
         pat: patDetail
      });
    }
});

docRouter.route('/confirmed-appointmets')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/doctor/login');
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let asset = await network.appointStatusDoc( card, num, 'Appointment Confirmed');
      var patDetail = [];
      for(var i = 0; i < asset.length; i++) {
        var id = asset[i].patient.split("#");
        console.log(asset[i]);
        var a = await network.patDetail(card, num, id[1]);
        patDetail.push(a);
      }
    res.render('doctor/confirmed', 
    {
      pat: patDetail,
      asset: asset
    });
    }
});
docRouter.route('/confirmed-appointmets')
  .post(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/doctor/login');
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let check = req.body.check;
      let appointId = req.body.appointId; 
      console.log(check );
      console.log(typeof(check ));
      network.confirmAppointTrans( card, num, check, appointId)
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
    }
});

docRouter.route('/cancel-appointment')
  .post(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/doctor/login');
    }
    else{
      card = req.session.card;
      num = req.session.num;
      let check = req.body.check;
      let appointId = req.body.appointId; 
      console.log(appointId);
       network.cancelAppointTrans( card, num, appointId)
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
    }
});

docRouter.route('/patient-list')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
    res.redirect('/doctor/login');
  }
  else{
    card = req.session.card;
    num = req.session.num;
    let data = await network.queryRecord(card);
    res.render('doctor/list',
    {
      data: data
    });
  }
});

docRouter.route('/ehr-view')
  .get(async (req, res) => {
    if(!req.session.card && !req.session.num){
      res.redirect('/doctor/login');
    }
    else{
      card = req.session.card;
      num = req.session.num;
      recordId = req.body.recordId;
      let data = await network.getPatientRecord(card, recordId);
      res.render('doctor/view',
      {
        data: data
      });
    }
});



docRouter.route('/register')
  .get((req, res) => {
    res.render('doctor/register',
    {
      doctor: 1,
      user: req.user,
      message : '' // doctors[id]
    });
});


docRouter.post('/addMedication', async (req, res ) => {
  if(!req.session.card && !req.session.num){
    res.redirect('/doctor/login')
  }
  else{
    const card = req.session.card;
    const num = req.session.num;
    const symp = req.body.symptoms;
    const check = req.body.check;
    const appointId = req.body.appointId;
    const medosnot = JSON.parse(req.body.inputData);
    const desc = req.body.description;

    console.log(symp + appointId + desc);

     network.addMedicationTrans( card, num, appointId, symp, desc, medosnot)
      .then(async (response) => {
        //return error if error in response
        if (response.error != null) {
          res.json({
            error: "Sorry, you can't add transaction at this time"
          });
        } else {
          //else return success
          if(check){
            await network.CompleteTrans(card, num, appointId);
          }
          res.json({
            success: response
          });
        }
    });
  }
});


//check-cred
docRouter.post('/login', async (req, res ) => {
  const card = req.body.CardId;
  const num = req.body.AccountNum;
  let asset = await network.doctorData(card, num);
    if(isEmpty(asset)){
       return res.status(404).send();
    }
    else{
    req.session.card = card;
    req.session.num = num;
    console.log(req.session.num);
    console.log(req.session.card);
    res.redirect('./index')
    }
});
 /*.post((req, res) => {
     //declare variables to retrieve from request
  var accountNumber = req.body.accountnumber;
  var cardId = req.body.cardid;

  //declare return object
  var returnData = {};

  //get member data from network
  network.memberData(cardId, accountNumber)
    .then((member) => {
      //return error if error in response
      if (member.error != null) {
        res.json({
          error: member.error
        });
      } else {
        //else add member data to return object
        returnData.accountNumber = member.accountNumber;
        returnData.firstName = member.firstName;
        returnData.lastName = member.lastName;
        returnData.phoneNumber = member.phoneNumber;
        returnData.email = member.email;
        returnData.points = member.points;
      }

    });
 });
*/
//post call to register member on the network
docRouter.route('/registerDoctor')
  .post((req, res) =>  {
  //declare variables to retrieve from request
  const accountNumber = req.body.accountnumber;
  const cardId = req.body.cardid;
  const fName = req.body.firstname;
  const lName = req.body.lastname;
  const gender = req.body.gender;
  const dob = req.body.dob;
  const specl = req.body.specl;
  const exp = req.body.exp;
  

  //print variables
  console.log('Using param - firstname: ' + fName + ' lastname: ' + lName +' gender: ' + gender +' specl: ' + specl +' exp: ' + exp +' dob: ' + dob + ' accountNumber: ' + accountNumber + ' cardId: ' + cardId);
  //validate member registration fields
        //else register member on the network
        network.registerDoctor(cardId, accountNumber, fName, lName, gender, exp, specl,dob)
          .then((response) => {
            //return error if error in response
            if (response.error != null) {
              console.log('error');
              res.json({
                error: response.error
              });
            } else {
              console.log('Success');
             res.json({
               message: "SignUp Successful!!"
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
module.exports = docRouter;