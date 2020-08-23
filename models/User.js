/*
This file handles the Gig model
1. Defines its attributes 
2. Synchronizes the attributes with the structure in the table 
*/
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var userAttributes = {
    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    first_name: {
        type: Sequelize.STRING
    },
    last_name: {
        type: Sequelize.STRING
    },
    datetime_joined: {
        type: Sequelize.DATE
    },
    enabled: {
        type: Sequelize.BOOLEAN
    },
    activation_token: {
        type: Sequelize.STRING
    },


}

const User = db.define('User', userAttributes)
try {
    User.sync();
} catch (error) {
    console.error("error occured" + error)
}

module.exports = User; 
