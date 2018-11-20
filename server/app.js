'use strict';
//get libraries
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path   = require('path');
const morgan = require('morgan');
var cookieParser = require('cookie-parser');
var flash    = require('connect-flash');
var session  = require('express-session');
var passport = require('passport');

const network = require('./network/network');
//create web-server
const app = express();
const port = process.env.PORT || 3000;

require('./config/passport')(passport); // pass passport for configuration 

// set up our express application
//app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public/')));
app.set('views', './views');
app.set('view engine', 'ejs');

// routes ======================================================================
//require('./routes/doctorRoutes.js')(app, passport); // load our routes and pass in our app and fully configured passport


// required for passport
app.use(session({ secret: "none",
resave: false,
saveUninitialized: true
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session 

const patientRouter = require('./routes/patientRoutes');
const docRouter = require('./routes/doctorRoutes');
const adminRouter = require('./routes/adminRoutes');
app.use('/patient', patientRouter);
app.use('/doctor', docRouter);
app.use('/admin', adminRouter);
app.post('/search',async (req, res)=> {
  let term = req.body.search
    let arr = await network.queryDoctor(term);
      res.render(
          'doctorsListView',
          {
            text: term,
            data: arr,
            user: 'user'
          }
      );
});

app.get('/doctor/:id',async (req, res)=> {
  if(req.session.num){
  const id = req.params.id;
  console.log(id.toString());
  let data = await network.doctorData(id,id);
    console.log(req.session.card);
    console.log(req.session.num);
    res.render(
        'doctorView',
        {
          title: 'welcome',
          text: req.body.search,
          user: req.user,
          data: data
        }
  );} else{
    res.redirect('/patient/login');
  }
});

app.get('/', async (req, res) => {
  let data = await network.allDoctorsList();
  console.log(data);
    return res.render(
      'index',
      {
        title: 'welcome',
        user: req.user,
        data: data
      }
    );  
});


  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
  