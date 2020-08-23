/* All requests will be pre-fixed with: 
GIGS
*/


var express = require('express');
var router = express.Router();
const db = require('../config/database');
const Gig = require('../models/Gig');

/* Gigs home page. */
router.get('/', function(req, res, next) {
    Gig.findAll()
    .then(gigs => res.render('gigs', {
        gigs
      }))
    .catch(err=> console.log(err))

});
  

/* Add data to the database 
gigs/add
*/
router.get('/add', function(req, res, next) {

    const data = {
        title: 'Sample 2',
        description: 'A second nice sample',
        contact_email: 'test@test2.com'
    }

    let {title, description, contact_email} = data; 

    Gig.create({
        title,
        description,
        contact_email
    })
    .then(gig => res.redirect('/gigs'))
    .catch(err=> console.log(err));


});
  


module.exports = router;
