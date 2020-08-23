/* All requests will be pre-fixed with: 
ACCOUNTS

*/


var express = require('express');
var router = express.Router();
const db = require('../config/database');
let User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');


/* All users */
router.get('/allusers', function(req, res, next) {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;


  var currentTimeStamp = fullUrl

  User.findAll()
  .then(users => res.render('allusers', {
      users, currentTimeStamp
    }))
  .catch(err=> console.log(err))

});

/* 
GET accounts/login page 
*/
router.get('/login', function(req, res, next) {
  res.render('login',{title: 'You are in the accounts/login Page '})
});


/* 
GET accounts/logout page 
*/
router.get('/logout', function(req, res, next) {
  req.logOut();
  req.session.user = ""
  req.flash('Success','You are logged out');
  res.redirect('/accounts/login');

 
});



/* 
POST - accounts/login page submissions  
*/

router.post('/login', 
  passport.authenticate('local', { 
    failureRedirect: '/accounts/login',
    failWithError: '/accounts/login',
    failureFlash: true  

  }) , function(req, res) {
        console.log(req.user);
        req.session.user = req.user;
        res.redirect('/');
  }
);





/* 
accounts/registration page 
*/
router.get('/registration', function(req, res, next) {
  res.render('registration',{title: 'Welcome to the registration page'})
});

/* 
POST from accounts/registration page 
handles the user registration
*/

const { body, validationResult } = require('express-validator');


router.post('/registration', [
  //This part contains the validation section 
  //Ref: https://express-validator.github.io/docs/
  
  body('first_name').notEmpty().withMessage('First name cannot be empty'),
  body('last_name').notEmpty().withMessage('Last name cannot be empty'),
  body('username').notEmpty().withMessage('username cannot be empty'),
  body('username').isEmail().withMessage('username must be a valid email'),
  body('password').isLength({ min: 5 }).withMessage('password must be at least 5 characters long'),
  

],function(req, res, next) {
    const errors = validationResult(req);
    
    //check if the email address already exists 
    const queryCriteria = {
      where: {username:req.body.username} 
    };
  
    User.findOne(queryCriteria)
    .then(function(userRecord){
      //atleast one record exists 
      const AccountValues = userRecord
      if (AccountValues.username){
        
        req.flash('Message','This email address is already registered')
        res.render('login')

      }


    })

    //check if there are any errors in the submission 
    if (!errors.isEmpty()) {

      res.render('registration',{errors:errors.array()});
    }
    else{
      var userdata = {
        username: req.body.username,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        datetime_joined: Date.now(), 
        enabled:false,
        activation_token: 'unknown'
      }


      //generate the email verification token 
      var simple_salt = bcrypt.genSaltSync(5);
      var crypto = require("crypto");
      var id = req.body.username + Date.now().toString();
      const emailVerificationToken =  bcrypt.hashSync(id, simple_salt);
      userdata.activation_token = emailVerificationToken.split('/').join('1');

      //salt and hash the password using bcrypt 
      var salt = bcrypt.genSaltSync(10);
      userdata.password = bcrypt.hashSync(req.body.password, salt);

      //Create the new user in the database 

      let {username, password, first_name,last_name,datetime_joined,enabled,activation_token} = userdata; 
      User.create({
        username, password, first_name,last_name,datetime_joined,enabled,activation_token
      }).then(function(user){
        var fullUrl = req.protocol + '://' + req.get('host') + '/accounts/' + user.username + '/verify/' + user.activation_token;
        console.log("\n\n\n\n");
        console.log(fullUrl);
        console.log("\n\n\n\n");

        req.flash('Message','You have been successfuly registered.Please check your email for the verification link')
        res.render('login')
      })

    }

});

/* 
GET accounts/activation/id page 
/accounts/:email/verify/:activation_token 
*/

router.get('/:email/verify/:activation_token', function(req, res, next) {

  const queryCriteria = {
    where: {activation_token:req.params.activation_token} 
  };

  User.findOne(queryCriteria)
  .then(function(userRecord){

      //if empty return null 
      if (!userRecord){
        req.flash('Message','Record  not found')
        res.redirect('/accounts/allusers')
      } 
      else {

        userRecord.update({
          activation_token: '',
          enabled: true
        }).then(function(result){
          req.flash('Message','Record is updated for: ' + result.username)
          res.redirect('/accounts/allusers')

        })

      }

  })


});


module.exports = router;
