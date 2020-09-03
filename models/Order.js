
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var orderAttributes = {
    pk:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    customer_id: {
        type: Sequelize.INTEGER,
    },

    placed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
        
    },

    date_placed: {
        type: Sequelize.DATE,
        
    },
    
    shipping_address: {
        type: Sequelize.INTEGER,
        
    },

    payment: {
        type: Sequelize.INTEGER,
        
    },


}

const Order = db.define('Order', orderAttributes)

try {
    Order.sync();
} catch (error) {
    console.error("error occured" + error)
}

module.exports = Order; 
