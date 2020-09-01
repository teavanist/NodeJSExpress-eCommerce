// ALL REQUESTS PREFIXED WITH '/SHOP'

var express = require('express');
var router = express.Router();
const db = require('../config/database');

let Partner = require('../models/Partner');
let Product = require('../models/Product');
let User = require('../models/User');
let Order = require('../models/Order');
let CartItem = require('../models/CartItem');
let Basket = require('../models/Basket')

const jwt = require('jsonwebtoken');

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



//========================== ROUTE HANDLING =====================
/* Products home page. */
router.get('/products/list', function(req, res, next) {
  
  Product.findAll()
  .then(function (products) {
    console.log(products.length)

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
    
  
  async function doTheShit(){

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
  
  doTheShit();


});


router.get('/basket/mybasket', function(req, res, next){
  var user = req.session.user

  async function getCurrentBasketItems(user_id){
    const { Sequelize, Op, Model, DataTypes, INTEGER } = require("sequelize");
    const db = require('../config/database');
    let CartItems = await db.query("SELECT * FROM `Baskets` where user_id=:user_id and is_order_placed=0", {
       type: Sequelize.QueryTypes.SELECT,
       replacements:{user_id: user.id}
      })
  
    var grand_total = 0; 
  
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('mybasket',{CartItems,grand_total})
  }  


  getCurrentBasketItems(user.id);

});


router.get('/basket/:orderid', function(req, res, next){
  
  if(!req.session.user){
    res.status(403).send('Please login ');
  }

  var user = req.session.user; 
  var givenorderid = parseInt(req.params.orderid);





  async function doTheShit(userid,orderid){
    let orderData = await getUsersOrder(userid,orderid,res); 
    let CartItems = await getBasketItemsByOrderID(orderid); 

    var grand_total = 0; 
  
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('myorder',{CartItems,grand_total})


  }

  doTheShit(user.id,givenorderid)




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

  async function doTheShit(userid,orderid){
    let orderData = await getUsersOrder(userid,orderid,res); 
    let CartItems = await getBasketItemsByOrderID(orderid); 

    var grand_total = 0; 
  
    for (var i=0; i< CartItems.length;i++){
      grand_total = grand_total + parseFloat(CartItems[i].total_cost )
    }
  
    res.render('checkout',{CartItems,grand_total})


  }

  doTheShit(user.id,givenorderid)


})

router.get('/payment/:orderid', function(req, res, next){

  

})



module.exports = router;
