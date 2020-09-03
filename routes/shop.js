// ALL REQUESTS PREFIXED WITH '/SHOP'

var express = require('express');
var router = express.Router();
const db = require('../config/database');
const { Op } = require("sequelize");


let Partner = require('../models/Partner');
let Product = require('../models/Product');
let User = require('../models/User');
let Order = require('../models/Order');
let CartItem = require('../models/CartItem');
let Basket = require('../models/Basket')
let Address = require('../models/Address')
let Payment = require('../models/Payment')


//const jwt = require('jsonwebtoken');

/// ======================= COMMON FUNCTIONS ===================


async function getUsersOrder(userid,orderid,res){

  const queryCriteria = {
    where: { 
        customer_id: userid,
        pk:parseInt(orderid)
    }
  };

  let result = await Order.findOne(queryCriteria);

  if ( typeof result == 'undefined' || result == null){
    res.status(404).send('Error: You may not be authorized or the record does not exist. Please contact support');
  }
  else {
    return result;
  }


}


async function getBasketItemsByOrderID(orderid){
  const { Sequelize, Op, Model, DataTypes, INTEGER } = require("sequelize");
  const db = require('../config/database');
  let results = await db.query("SELECT * FROM `Baskets` where order_id=:order_id", {
     type: Sequelize.QueryTypes.SELECT,
     replacements:{order_id: orderid}
    })

  return results
}


async function getProductQuantity(id){

  const result = await Product.findByPk(id);
  return result;
  
}

async function getCurrentBasketItems(user_id,res,req){
  const { Sequelize, Op, Model, DataTypes, INTEGER } = require("sequelize");
  const db = require('../config/database');
  let CartItems = await db.query("SELECT * FROM `Baskets` where user_id=:user_id and is_order_placed=0", {
     type: Sequelize.QueryTypes.SELECT,
     replacements:{user_id: user_id}
    })

  var grand_total = 0; 

  if ( typeof CartItems == 'undefined' || CartItems == null){
    //or any other error handling mechanism 
    res.status(403).send('Some problem retrieving your current basket');
  }
  else if (CartItems.length==0){
    req.flash('Message', 'You have not selected any items. Please select any product and then click again' )
    res.redirect('/shop/products/list')

  }
  else {
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('mybasket',{CartItems,grand_total})

  }


}  

//========================== ROUTE HANDLING =====================

/* Products home page. */
router.get('/products/list', function(req, res, next) {

  if(!req.session.user){
    return res.status(403).send('Please login ');
  }

  const queryCriteria = {
    where: {
      [Op.gt]: [{count:0}]
    }
  }

  
  Product.findAll()
  .then(function (products) {

    res.render('shop',{products})
  })
  .catch((err) => {
    console.log(err);
  })


});


/* Add to cart functionality  */
router.get('/basket/addtocart/:id', function(req, res, next) {

/*
  The logic followed by this route is as follows 
  1. does the user have any active order --if yes, return order number 
  2. if above is no, create an active order and then return order number 
  3. check if the item is in the cart -> if yes, return cartid  
  4. If 3 is yes, update item quantity in cart with the returned cart id 
  5. if 3 is no, then add the item to the cart 
  
  for each of the above a separate function is developed and they are called in order in the final function 
*/
  if(!req.session.user){
    return res.status(403).send('Please login ');
  }

  
  var productID = req.params.id 
  var user = req.session.user
  var ordernumber = '';
  var cartID = '';


  async function getUsersActiveOrder(userid){
     
    const queryCriteria = {
      where: { 
          customer_id: userid,
          placed: false
      }
    };

    let result = await Order.findOne(queryCriteria);
    return result
  }

  
  async function createActiveOrder(userid){

    fresh_order = {
      customer_id: userid
    }

    let { customer_id } = fresh_order

    const result = await Order.create({customer_id});
    
    if ( typeof result == 'undefined' || result == null){
      res.status(403).send('Error adding to cart (order number could not be generated). Please contact support');
    }
    else {
      return result;
    }

  }

  async function createNewCartEntry(product_id,order_id){

    new_cart_item = {
      product_id:product_id,
      quantity:1,
      order_id:order_id
    }

    const result = await CartItem.create(new_cart_item);

    if ( typeof result == 'undefined' || result == null){
      res.status(403).send('Error adding to cart (cart could not be updated). Please contact support');
    }
    else {
      return result;
    }

  }

  async function isItemInCartAlready(product_id,order_id){
    const queryCriteria = {
      where: { 
        product_id: product_id,
        order_id: order_id
      }
    };

    let result = await CartItem.findOne(queryCriteria);
    return result

  }

  async function updateItemQuantityinCart(cart_id){
    const queryCriteria = {
      where: { 
        pk: cart_id
      }
    };

    CartItem.findOne(queryCriteria)
    .then(function (cartItemRecord) {

      //if empty return null 
      if (!cartItemRecord) {
        res.status(403).send('Error adding to cart: The cart record could not be found during update process. Please contact support');
      }
      else {
        var newQuantity = cartItemRecord.quantity + 1 

        cartItemRecord.update({
          quantity: newQuantity
        })
        .then(function (result) {
          return result; 
        })
        .catch((err) => { res.status(403).send('Error adding to cart: Error occured during quantity update. Please contact support'); });

      }

    })

  }
    
  
  async function doTheMainFunction(){




    //1. does the user have any active order --if yes, return order number 
    let existingOrderDetail = await getUsersActiveOrder(user.id);
    

    if ( typeof existingOrderDetail == 'undefined' || existingOrderDetail == null){

      //2. create an active order and then return order number 
      let orderDetail = await createActiveOrder(user.id);
      ordernumber = OrderDetail.pk
      console.log('\n\n\n Fresh order generated ')
      

    }
    else {
      ordernumber = existingOrderDetail.pk 
      console.log('\n\n\n Existing order found with ref number '+ordernumber)

      //before updating the quantity in the cart, check if the user has selected more items than in stock 
      let CartItems = await getBasketItemsByOrderID(ordernumber); 

      for (var i=0; i< CartItems.length;i++){
        if(parseFloat(CartItems[i].cart_qty) >= parseFloat(CartItems[i].available_qty)) {// user selected more than available 
          return  res.status(404).send('You have selected more items than available in stock. This item cannot be selected now')
        }
      }


    }

    //3. check if the item is in the cart -> if yes, return cartid 
    let cartDetail = await isItemInCartAlready(productID,ordernumber);

    if (typeof cartDetail == 'undefined' || cartDetail == null){ //item is not in the cart already 

      //5. add the item to the cart with the specific cart id 
      let cartDetail = await createNewCartEntry(productID,ordernumber);
      cartID = cartDetail.pk; 
      req.flash('Message', 'Item added to your cart for the first time')

    }
    else {
      cartID = cartDetail.pk; 
      req.flash('Message', 'Item exists in your cart. Qty to be updated')

      let newcartDetail = await updateItemQuantityinCart(cartID)
      req.flash('Message', 'Qty updated')
    }

    
    res.redirect('/shop/products/list')                 
  
  }
  
  try {
    doTheMainFunction();
  } catch (err) {
    console.log(err)
  }


});


router.get('/basket/mybasket', function(req, res, next){
  if(!req.session.user){
    return res.status(403).send('Please login ');
  }

  var user = req.session.user

  getCurrentBasketItems(user.id,res,req);

});

/* Remove item from cart functionality  */
// e.g. POST /shop/basket/mybasket/remove/order/4/item/1

router.post('/basket/mybasket/remove/order/:orderid/item/:productid', function(req, res, next){
  if(!req.session.user){
    return res.status(403).send('Please login ');
  }

  try {
    var user = req.session.user
    var productid = parseInt(req.params.productid )
    var orderid = parseInt(req.params.orderid )
  
    // reduce quantity of item by 1 in cart 
    async function reduceProductQtyInCartByOne(orderid,productid){
      try {

        const queryCriteria = {
          where: {
            product_id: productid,
            order_id: orderid
          }
        }
        
        const cart = CartItem.findAll(queryCriteria)
        res.status(403).send('TBD: The cart quantity is' + cart.quantity);

        
      } catch (error) {
        res.status(403).send('TBD: Error in reduceProductQtyInCartByOne function');
        console.log(error)
      }

  
    }

    async function reduceProductQtyInCartByOnev2(orderid,productid){
      const queryCriteria = {
        where: { 
          product_id: productid,
          order_id: orderid
        }
      };
  
      CartItem.findOne(queryCriteria)
      .then(function (cartItemRecord) {
  
        //if empty return null 
        if (!cartItemRecord) {
          res.status(403).send('Error adding to cart: The cart record could not be found during update process. Please contact support');
        }
        else {
          //res.status(403).send('cartItemRecord.quantity is ' + cartItemRecord.quantity + ' and cart id is ' + cartItemRecord.pk );
          console.log('cartItemRecord.quantity is ' + cartItemRecord.quantity + ' and cart id is ' + cartItemRecord.pk );

          var newQuantity = cartItemRecord.quantity -1
          var cart_pk = cartItemRecord.pk

          //if new quantity is 0, then delete the 

          if (newQuantity==0){

            // return res.status(403).send('Quantity is 0');
            
            const deletionCriteria = {
              where: { 
                  pk: cart_pk 
              }
            };
            CartItem.destroy(deletionCriteria)
            return res.redirect('/shop/basket/mybasket')

          }
          else {

            cartItemRecord.update({
              quantity: newQuantity
            })
            .then(function (result) {
              //return result; 
              return res.redirect('/shop/basket/mybasket')
            })
            .catch((err) => { res.status(403).send('Error adding to cart: Error occured during quantity update. Please contact support'); });


          }
  
  
        }
  
      })
  
    }
 
    // if quantity of item is 0, delete the row in CartItem 
    async function deleteCartRecord(cartid){
      try {

        const queryCriteria = {
          where: { pk: cartid }
        };
        await CartItem.destroy(queryCriteria)

      } catch (err) {
        res.status(403).send('Some error occured')
        console.error(err)

      }

    } 


    //define the main function that combines all the subfunctions 
    async function doTheMainFunction(orderid,productid,userid){
      
      await reduceProductQtyInCartByOnev2(orderid,productid)
      

      


      


    }

    
    //execute the main function
    doTheMainFunction(orderid,productid,user.id)
  
  
  } catch (error) {
    console.log(error)
    return res.status(404).send('Some error occured')
  }






});

router.get('/basket/:orderid', function(req, res, next){
  
  if(!req.session.user){
    res.status(403).send('Please login ');
  }

  var user = req.session.user; 
  var givenorderid = parseInt(req.params.orderid);





  async function doTheMainFunction(userid,orderid){
    let orderData = await getUsersOrder(userid,orderid,res); 
    let CartItems = await getBasketItemsByOrderID(orderid); 

    var grand_total = 0; 
  
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('myorder',{CartItems,grand_total})


  }

  doTheMainFunction(user.id,givenorderid)




});

router.get('/checkout/:orderid', function(req, res, next){

  // Update the address 
  // Update the payment details 
  // Update quantity 
  // Update order status 
  

  if(!req.session.user){
    res.status(403).send('Please login ');
  }

  var user = req.session.user; 
  var givenorderid = parseInt(req.params.orderid);

  async function doTheMainFunction(userid,orderid){
    let orderData = await getUsersOrder(userid,orderid,res); 
    let CartItems = await getBasketItemsByOrderID(orderid); 

    var grand_total = 0; 
  
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('checkout',{CartItems,grand_total})


  }

  doTheMainFunction(user.id,givenorderid)


})


router.post('/payment/:orderid', function(req, res, next){
  if(!req.session.user){
    return res.status(403).send('Please login ');
  }


  try {

    var productid = '';
    var grand_total = 0; 
    var user = req.session.user; 

    //save all the form data from the request to a dictionary 

    var req_data = {
      orderid: parseInt(req.params.orderid),
      userid: user.id,
      street_name: req.body.street_name,
      city: req.body.city,
      zipcode: req.body.zipcode, 
      country: req.body.country,
      additional_info: req.body.additional_info, 
      payment_option: req.body.payment_option,
      total_amount: req.body.Amount
    }

    console.log(req_data)

    async function createNewAddress( user_id, street, city, zipcode, country, additional_info){
      row = {
        user_id: user_id,
        street: street,
        city: city,
        zipcode: zipcode,
        country: country,
        additional_info: additional_info
      }
  
      const result = await Address.create(row);
  
      if ( typeof result == 'undefined' || result == null){
        
        res.status(403).send('Unable to create address in table');
      }
      else {
        return result;
      }

    }

    
    async function createNewPaymentRecord(amount,method){
      row = {
        amount:amount,
        method:method,
      }
  
      const result = await Payment.create(row);
  
      if ( typeof result == 'undefined' || result == null){
        
        res.status(403).send('Unable to create payment entry in table');
      }
      else {
        return result;
      }
  

    }

    async function updateOrderAfterPurchase(order_id,address_id,payment_id){

      const updateCriteria = {
        placed:true,
        date_placed: Date.now(), 
        shipping_address: address_id,
        payment: payment_id

      }

      const queryCriteria = {
        where: {
          pk: order_id
        }
      }

      Order.findOne(queryCriteria)
      .then(function (orderRecord) {
  
        //if empty return null 
        if (!orderRecord) {
          res.status(403).send('Unable to find your order in the database')
        }
        else {
          orderRecord.update(updateCriteria)
          .then(function (result) { return result })
          .catch((err) => { console.log(err); });
        }
  
      })

    }

    async function updateQuantityforProductID(product_id,new_qty){

      const updateCriteria = {
        count:new_qty
      }
  
      const queryCriteria = {
        where: {
          pk: product_id
        }
      }
  
      Product.findOne(queryCriteria)
      .then(function (product) {
  
        //if empty return null 
        if (!product) {
          res.status(403).send('Unable to find product ' + product_id + ' in the database')
        }
        else {
          product.update(updateCriteria)
          .then(function (result) { return result })
          .catch((err) => { console.log(err);res.status(403).send('Unable to update quantity for product ' + product_id + ' in the database') });
        }
  
      })
  
    }



    async function doTheMainFunction(req_data){
      //let productRecords = await getProductQuantity(productid)
      //if(!productRecords){
        //return  res.status(404).send('Unable to find product')
      //}

      console.log(req_data.orderid)

      let CartItems = await getBasketItemsByOrderID(req_data.orderid); 

      for (var i=0; i< CartItems.length;i++){
         if(parseFloat(CartItems[i].cart_qty) > parseFloat(CartItems[i].available_qty)) {// user selected more than available 
          return  res.status(404).send('You have selected more items than available in stock')
        }
      }

      req.flash('Message', 'Count is within available qiantity. Proceeding to next steps ' )

      for (var i=0; i< CartItems.length;i++){
        grand_total = grand_total + parseFloat(CartItems[i].total_cost )
      }

      req_data.total_amount = grand_total


      let addressResult = await createNewAddress( req_data.userid, req_data.street_name, req_data.city, req_data.zipcode, req_data.country, req_data.additional_info)
      req.flash('Message', 'Address updated to table' )

      let paymentResult = await createNewPaymentRecord(req_data.total_amount,req_data.payment_option)
      req.flash('Message', 'Payment updated to table' )

      let orderResult = await updateOrderAfterPurchase(req_data.orderid,addressResult.pk,paymentResult.pk)
      req.flash('Message', 'Order has been updated' )

      for (var i=0; i< CartItems.length;i++){

        // modify quantity for each product in the order 
        var new_qty =  parseFloat(CartItems[i].available_qty) - parseFloat(CartItems[i].cart_qty)
        
        let modifiedProduct = await updateQuantityforProductID( CartItems[i].product_id , new_qty)

      }
      req.flash('Message', 'All Quantities have  been updated' )


     


      return  res.render('paymentstatus')
    }

    doTheMainFunction(req_data)
    
  } catch (error) {

    console.log(error)
    
  }

  



})



module.exports = router;
