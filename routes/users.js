/* All requests will be pre-fixed with: 
ACCOUNTS

*/


var express = require('express');
var router = express.Router();
const db = require('../config/database');
let User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');


/* All users page displaying 
- all the usernames 
- their activation tokens and 
- joining date 
To be uncommented only for troubleshooting along with the navigation link in layout.pug

router.get('/allusers', function(req, res, next) {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;


  var currentTimeStamp = fullUrl

  User.findAll()
  .then(users => res.render('allusers', {
      users, currentTimeStamp
    }))
  .catch(err=> console.log(err))

});

*/


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
  body('password').custom((value,{req, loc, path}) => {
            if (value !== req.body.password2) {
                throw new Error("Passwords don't match");
            } else {
                return value;
            }
  })],
  function(req, res, next) {
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
        res.redirect('/accounts/login')
      } 
      else {

        userRecord.update({
          activation_token: '',
          enabled: true
        }).then(function(result){
          req.flash('Message','Record is updated for: ' + result.username)
          res.redirect('/accounts/login')

        })

      }

  })
});

/*
GET accounts/password-reset page
/accounts/password-reset
*/

router.get('/password-reset', function(req, res, next) {
  res.render('reset');
});

/*
POST accounts/password-reset page
/accounts/password-reset
*/

router.post('/password-reset', function(req, res, next) {
    //check if the email address already exists 
	console.log(req.body.email);
    const queryCriteria = {
      where: {username:req.body.email} 
    };
  
    User.findOne(queryCriteria)
    .then(function(userRecord){
      //atleast one record exists 
      const AccountValues = userRecord
      if (AccountValues.username){
      //generate the email verification token 
      var simple_salt = bcrypt.genSaltSync(5);
      var crypto = require("crypto");
      var id = req.body.username + Date.now().toString();
      const emailVerificationToken =  bcrypt.hashSync(id, simple_salt);
      const activation_token = emailVerificationToken.split('/').join('1');
      userRecord.update({
	activation_token: activation_token
      }).then(() => {console.log('Token Generated')});
      const resetURL = req.protocol + '://' + req.get('host') + '/accounts/password-reset/' + activation_token
      
      console.log('\n\n' + resetURL + '\n\n');


        req.flash('Message', 'A reset link has been generated in the console. Click the link to reset your password')
	}})
   .catch((err) => {
      req.flash('Message', 'A reset link has been generated in the console. Click the link to reset your password');})
   .finally(() => {
	res.render('reset')
  });
});

/*
GET accounts/password-reset/:reset_token
/accounts/password-reset/<reset_token>
*/

router.get('/password-reset/:reset_token' , function(req, res, next) {
	console.log(req.params.reset_token);

	res.render('updatepassword', {token: req.params.reset_token});
});

/*
POST accounts/password-reset/:reset_token
/accounts/password-reset/<reset_token>
*/

router.post('/password-reset/:reset_token', [
	body('password').isLength({ min: 5 }).withMessage('password must be at least 5 characters long'),
	body('password').custom((value,{req, loc, path}) => {
            if (value !== req.body.passwordconfirm) {
                throw new Error("Passwords don't match");
            } else {
                return value;
            }
        })], function(req, res, next) {
	const errors = validationResult(req);

	if (!errors.isEmpty()){
		res.render('updatepassword', {token: req.params.reset_token,
					      errors: errors.array()});
	}

	console.log(req.params.reset_token);

	const queryCriteria = {
		where: {activation_token: req.params.reset_token}
	};

	User.findOne(queryCriteria)
		.then(function(userRecord) {
			if (userRecord.username) {
				console.log(userRecord.username);
				const salt = bcrypt.genSaltSync(10);
				const password = bcrypt.hashSync(req.body.password, salt);
				userRecord.update({
					password: password,
					activation_token: 'unknown' 
				      }).then(() => {console.log('Password updated')});
				req.flash('Message', 'Password updated');
		}})
		.catch((err) => {console.log(err);});
	res.render('login');
});


module.exports = router;
