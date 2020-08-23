const LocalStrategy = require('passport-local').Strategy;

const db = require('./database');
let User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = function(passport){
    // Local Strategy
    passport.use(new LocalStrategy(function(username, password, done){


        const queryCriteria = {
            where: {username:username} 
        };
      
        // Search for the given user
        User.findOne(queryCriteria)
            .then(function(userRecord){
                const AccountValues = userRecord

                //if empty return null 
                if (!userRecord){
                    return done (null,false,{message: 'Incorrect credentials'})
                } 

                //user email is not yet verfied 
                if (!AccountValues.enabled){
                    return done (null,false,{message: 'Your email has not been verified yet'})
                } 

                //check password- return failed if its wrong password 
                const correctPassword=  bcrypt.compareSync(password, userRecord.password);
                if (!correctPassword){
                    return done (null,false,{message: 'Incorrect credentials'})
                }


                 //everything is successful 
                return done (null,userRecord,{message: 'Successful login'})
            })
            
            
    }));

  
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
  
    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });
}