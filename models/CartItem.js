
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var cartItemAttributes = {
    pk:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    product_id: {
        type: Sequelize.INTEGER
    },

    quantity: {
        type: Sequelize.INTEGER
    },

    order_id: {
        type: Sequelize.INTEGER
    },


}

const CartItem = db.define('CartItem', cartItemAttributes)

try {
    CartItem.sync({alter: true});
} catch (error) {
    console.error("error occured" + error)
}

module.exports = CartItem; 
