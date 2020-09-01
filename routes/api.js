/* All requests will be pre-fixed with: 
API

*/

ACCESS_TOKEN_SECRET = '5c6fcdb0bf83a937d0a5d20e3e27a26d6d21ec02238e8e60673f7b9ff54a036b7b37345bfc48bd687d6f9ad571d2cc9eddf051c2c2305c4e49ea7d1adda1a03f'


var express = require('express');
var router = express.Router();
const db = require('../config/database');
let Partner = require('../models/Partner');
let Product = require('../models/Product');

const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');

var slugify = require('slugify'); 





/* 
handles POST api/partnerlogin page to add partners 
*/
router.post('/partnerlogin', function (req, res, next) {
    //get partner data from incoming JSON

    var partnerdata = {
        name: req.body.partnername,
        web_site: req.body.web_site,
        token:''
    }
    
    //check if the partner is already registered 
    // not - registered then update DB and then issue access token 
    // registered - send a message that he is already registered 


    //check if the partner already exists 
    const queryCriteria = {
    where: { name: partnerdata.name }
    };

    Partner.findOne(queryCriteria)
    .then(function (partnerRecord) {
        //atleast one record exists 
        const queryResult = partnerRecord
        if (queryResult) {

            //return with an error message             
            res.status(403).send('Partner is already registered with the system')

        }
        else {
                //Partner does not exists - Calculate the token before Creating the new partner in the database 
                const partnerJSON = {
                    partnername: partnerdata.name
                }

                const accessToken = jwt.sign(partnerJSON,ACCESS_TOKEN_SECRET)

                partnerdata.token = accessToken

                //Now we can create the partner in the DB 
                let { name, web_site, token} = partnerdata;

                Partner.create({
                    name, web_site, token
                })
                .then(function (partner) {

                })
                .catch((err) => { console.log(err); });

                //return the access token 
                res.json({
                    accessToken: accessToken
                })

            }


    })
    .catch((err) => { console.log(err); });



});


/* 
handles POST api/products/create page 
*/
router.post('/products/create', authenticateToken, (req, res) => {

    var productDataFromRequest = {
        name: req.body.name,
        description: req.body.description,
        slug: slugify(req.body.name) + '-prod', 
        price:req.body.price,
        special_price: req.body.special_price,
        count: req.body.count,
        image:req.body.image,
        seller: ''
    }

  
    //check if the partner already exists 
    const queryCriteria = {
        where: { name: req.partner.partnername }
    };

    Partner.findOne(queryCriteria)
    .then(function (partnerRecord) {
        
        const queryResult = partnerRecord


        

        //atleast one record exists, update the DB 
        if (queryResult){
            productDataFromRequest.seller  = 'p-' + queryResult.id.toString();

            //Now we can create the Product in the DB 
            let { name, description,slug,price,special_price,count,image,seller} = productDataFromRequest;
            Product.create({
                name, 
                description,
                slug,
                price,
                special_price,
                count,
                image,
                seller
            })
            .then(function (product) {
                
                res.status(200).send('New product added successfully')

            })
            .catch((err) => { console.log(err); });
        }
        else { 
            res.status(403).send('No partner record exists, please contact support');       
        }
    })
    .catch((err) => { console.log(err); });
    
})


/* 
handles GET api/products/:productid page 
*/
router.get('/products/:productid', authenticateToken, function (req, res, next) {

    //check if Product exists in database 
    const queryCriteria = {
        where: { pk: req.params.productid }
    };

    Product.findOne(queryCriteria)
    .then(function (productRecord) {
        
        const queryResult = productRecord
        //atleast one record exists, update the DB 
        if (queryResult){
            
            //return the product details in a JSON
            return res.json({
                product: queryResult
            })

        }
        else {
            //return error 
            res.status(404).send('Unable to find product')
        }


	})
	.catch((err) => { console.log(err) })




})

/*
handles GET /api/products?page=X&pagination=Y
*/

router.get('/products', authenticateToken, function (req, res, next) {

    try {
        
        const page = parseInt(req.query.page)
        const pageSize = parseInt(req.query.pagination)

        const offset = (page - 1) * pageSize 
        const limit = pageSize

    
        async function getProductRecordsByPagination(offset,limit){
    
            //let recordOfProducts = await Product.findAndCountAll({ where: { createdByID: employeeID }, offset: 0, limit: 10 });
            let recordOfProducts = await Product.findAndCountAll(
                {  
                    offset: offset, 
                    limit: limit 
                });
            return recordOfProducts;
    
        }
    
        async function doTheShit(){
            let productData = await getProductRecordsByPagination(offset,limit);
                            
            if ( typeof productData == 'undefined' || productData == null){
                res.status(403).send('Potential error due to inputs provided. If you need further assistance, please contact support');
            }
            else {
                res.json({
                    products: productData
                })
            }
        }
    
        doTheShit();
        
        
    } catch (err) {
        console.log(err)
        
    }


})

/* 
handles DELETE api/products/:productid request
*/

router.delete('/products/:productid', authenticateToken, function (req, res, next) {

    var errorJSON = {
        title: '',
        description:''
    }


    async function getProductRecordbyID(productID){
        //check if Product exists in database 
        const queryCriteria = {
            where: { 
                pk: productID
            }
        };
        let result = await Product.findOne(queryCriteria);
        return result

    }

    async function getPartnerRecordsByUsername(criteria){
        //check if Partner exists in database 
        const queryCriteria = {
            where: { 
                name: criteria 
            }
        };
        let result = await Partner.findOne(queryCriteria);
        return result

    }

    async function deleteProductByID(productid){
        //check if Partner exists in database 
        const queryCriteria = {
            where: { 
                pk: productid 
            }
        };
        await Product.destroy(queryCriteria)

    }


    async function doTheShit(){
        let productData = await getProductRecordbyID(req.params.productid );
        let partnerData = await getPartnerRecordsByUsername(req.partner.partnername)

        if ( typeof productData == 'undefined' || productData == null){
            res.status(403).send('Potential error due to product # provided. If you have given the correct product # and you continue to receive this error, please contact support');
        }
        else if ( typeof partnerData == 'undefined' || partnerData == null){
            res.status(403).send('Error detected with your account. If you have given the correct bearer token and you continue to receive this error, please contact support');                 
        }
        else if (productData.seller.split('-')[1]==partnerData.id){
            await deleteProductByID(req.params.productid )
            res.status(200).send('Successfully deleted');                 
        }
        else if (productData.seller.split('-')[1]!=partnerData.id){
            res.status(403).send('You may not have rights to delete this product. Please enter the correct product number or the correct bearer token. If you need more help, please contact support');        
        }
        else {
            res.status(403).send('Unknown error, please contact support');                 
        }

    }

    doTheShit();
    

});

//============


function authenticateToken (req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(
        token,
        ACCESS_TOKEN_SECRET, 
        (err,partner) => {
            if (err) res.status(403).send('Potential issue with your token. Please contact support')
            req.partner = partner
        
            next() 
        }
    )

}

module.exports = router;