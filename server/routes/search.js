const express = require('express');

const authCheck = (req, res, next) => {
  if (!req.user) {
    res.redirect('/patient//login');
  } else {
    next();
  }
};

const search = express.Router();

patientRouter.route('/search')
  .post((req, res) => {
    // const { id } = req.params;
    res.render('doctorsListView',
      {
        doctor: 1,
        user: req.user // doctors[id]
      });
  });

module.exports = patientRouter;