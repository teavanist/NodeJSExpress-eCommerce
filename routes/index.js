var express = require('express');
var router = express.Router();

/* Reference to the gig model to retrieve a default list of values for the homepage */

const db = require('../config/database');
const Gig = require('../models/Gig');


/* GET home page. */
router.get('/', function(req, res, next) {
  Gig.findAll()
  .then(gigs => res.render('index', {
      title: "Thin Air LTD homepage",
      gigs
    }))
  .catch(err=> console.log(err))
});

module.exports = router;
