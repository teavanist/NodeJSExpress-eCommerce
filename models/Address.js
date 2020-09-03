
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var AddressAttributes = {
    pk:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    user_id: {
        type: Sequelize.INTEGER
        
    },

    street: {
        type: Sequelize.STRING
    },

    city: {
        type: Sequelize.STRING
    },

    zipcode: {
        type: Sequelize.STRING
    },

    country: {
        type: Sequelize.STRING
    },

    additional_info: {
        type: Sequelize.STRING
    }
}


const Address = db.define('Address', AddressAttributes)

try {
    Address.sync();
} catch (error) {
    console.error("error occured" + error)
}

module.exports = Address; 
