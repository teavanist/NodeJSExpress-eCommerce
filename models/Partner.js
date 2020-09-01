/*
This file handles the User model
1. Defines its attributes 
2. Synchronizes the attributes with the structure in the table 
*/
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var partnerAttributes = {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    name: {
        type: Sequelize.STRING
    },

    web_site: {
        type: Sequelize.STRING
    },

    token: {
        type: Sequelize.STRING
    },


}

const Partner = db.define('Partner', partnerAttributes)
try {
    Partner.sync({alter: true});
} catch (error) {
    console.error("error occured" + error)
}

module.exports = Partner; 
