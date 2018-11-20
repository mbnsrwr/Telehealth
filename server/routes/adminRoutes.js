const express = require('express');
const network = require('../network/network');
const admin = require('../network/admin');
/* ** Admin routes **
* patients
* Doctors
*/
const authCheck = (req, res, next) => {
  if (!req.user) {
    res.redirect('/admin/login');
  } else {
    next();
  }
};

const adminRouter = express.Router();

adminRouter.route('/revoke')
  .post(  async (req, res) => {
    if(!req.session.card){
      res.redirect('/admin/login')
    }
    else{
      card = req.session.card;
      let id = req.body.doctor;
      console.log(card);
      console.log(id);
      let message = `The identity ${id} was revoked and can no longer be used to connect to the business network.`;
      admin.revokeId(card, id)
              //else return success
              res.json({
                success: message
              });
    }
});

adminRouter.route('/login')
  .get((req, res) => {
    res.render('admin/login');
});

adminRouter.route('/logout')
  .get((req, res) => {
    req.session.destroy(function(err){
      if(err){
         console.log(err);
      }else{
          res.redirect('/admin/login');
      }
   });
   
});



//check-cred
adminRouter.post('/login', async (req, res ) => {
  const card = req.body.CardId;
  let asset = await admin.identityList(card, "Patient");
    if(isEmpty(asset)){
       return res.render('admin/login');
    }
    else {
    req.session.card = card;
    console.log(req.session.num);
      res.redirect('./All-Patients');
    }
});

adminRouter.route('/All-Patients')
  .get(async (req, res) => {
    if(!req.session.card) {
      res.redirect('/admin/login')
    }
    else{ 
      card = req.session.card;
      let assets = await admin.identityList(card, "Patient");
      let patients = [];
      for(var i = 0; i < assets.length; i++) {
        idd = assets[i].participant.$identifier;
        patients.push(await network.patDetail(card, idd, idd));
      };
      res.render('admin/patient',{
        cred: assets,
        pat: patients
      });
    }
});

adminRouter.route('/All-Doctors')
  .get(async (req, res) => {
    if(!req.session.card) {
      res.redirect('/admin/login')
    }
    else{ 
      card = req.session.card;
      let assets = await admin.identityList(card, "Doctor");
      let docs = [];
      for(var i = 0; i < assets.length; i++) {
        idd = assets[i].participant.$identifier;
        docs.push(await network.docDetail(card, idd, idd));
      };
      res.render('admin/doctor',{
        cred: assets,
        docs: docs
      });
    }
});

adminRouter.route('/RequestAppoint-Transactions')
  .get(async (req, res) => {
    if(!req.session.card) {
      res.redirect('/admin/login')
    }
    else{ 
      card = req.session.card;
      let assets = await admin.RequestAppointTransInfo(card);
      console.log(assets[1]);
      res.render('admin/reqTrans',{
        reqTrans: assets
      });
    }
});



function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false;
  }
  return true;
}
module.exports = adminRouter;
