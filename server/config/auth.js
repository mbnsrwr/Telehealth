const network = require('../network/network');
module.exports.isLoggedIn  = function(req, res, next) {

    // route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    if (error) {
        return next(error);
    } else {      
        if (user === null) {     
            var err = new Error('Not authorized! Go back!');
            err.status = 400;
            return next(err);
        } else {
            return next();
        }
    }
  
}