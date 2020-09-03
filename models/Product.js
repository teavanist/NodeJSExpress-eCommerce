/*
This file handles the User model
1. Defines its attributes 
2. Synchronizes the attributes with the structure in the table 
*/
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var productAttributes = {
    pk:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    name: {
        type: Sequelize.STRING
    },

    description: {
        type: Sequelize.STRING
    },
    slug: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.DECIMAL(10,2)
    },

    special_price: {
        type: Sequelize.DECIMAL(10,2)
    },

    count: {
        type: Sequelize.INTEGER
    },

    image: {
        type: Sequelize.STRING
    },

    seller: {
        type: Sequelize.STRING
    },


}
const Product = db.define('Product', productAttributes)

try {

    Product.sync();
} catch (error) {
    console.error("error occured" + error)
}

module.exports = Product; 
