var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var network = require('../network/network.js');
// expose this function to our app using module.exports
module.exports = function (passport) {

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        network.doctorData(cardId, accountNumber), function (err, doctor) {
            done(error, doctor);
        }
    });
    
    // LOCAL SIGNUP
    /*passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'cardId',
        passwordField: 'accountNumber',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, cardId, accountNumber, done) {
            process.nextTick(function () {
                // we are checking to see if the user trying to login already exists
                network.doctorData(cardId, accountNumber), function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'The credentials are already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user

                        // save the user

                    }

                };

            });
        }));*/

    // LOCAL LOGIN
    passport.use('signin', new LocalStrategy({
        // by default, local strategy uses username and password, we will override
        usernameField: 'cardId',
        passwordField: 'accountNumber',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        async function ( cardId, accountNumber, done) {
            console.log('in STARTEGY');
            let asset = await network.doctorData(cardId, accountNumber);
            console.log(asset);
            // we are checking to see if the user trying to login already exists
            await network.doctorData(cardId, accountNumber), function (err, user) {
                // if there are any errors, return the error
                console.log('in strategy');
                if (err)
                    return done(err);
                // check to see if theres already a user with that email
                if (!user) {
                    return done(null, false, req.flash('LoginMessage', 'No user found.'));
                }
                return done(null, user);

            };
        }));

};    
