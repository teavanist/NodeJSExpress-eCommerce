const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const db = require('./database');
let User = require('../models/User');
const bcrypt = require('bcryptjs');

GOOGLE_CLIENT_ID = "849638933500-212stmmsjq68sd8mq17kj2dvq8psbpra.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "8ukSIetm9fO-xQs9-QtMYQY2";
AUTH_URL = "http://localhost:3000/accounts/";

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

    passport.use(new GoogleStrategy({
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: AUTH_URL + 'google_auth'
        },
        function(accessToken, refreshToken, profile, done) {
            const username = profile.emails[0].value;
            const first_name = profile.name.givenName;
            const last_name = profile.name.familyName;

            console.log(profile);

            User.findOne({ where: { username: username }}).then( (currentUser) => {
                if(currentUser){
                    return done(null, currentUser, {message: 'Successful login'});
                }
                else{
                    new User({
                        username:  username,
                        first_name: first_name,
                        last_name: last_name,
                        datetime_joined: Date.now(),
                        enabled: true
                        }).save()
                        .then( (newUser) => {
                            return done(null, newUser)})
                        .catch((err)=>{console.log(err);});
                }
            })
            .catch((err) => {console.log(err);});
            
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
