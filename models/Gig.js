/*
This file handles the Gig model
1. Defines its attributes 
2. Synchronizes the attributes with the structure in the table 
*/
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var gigAttributes = {
    title: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    contact_email: {
        type: Sequelize.STRING
    }


}

const Gig = db.define('Gig', gigAttributes)
try {
    Gig.sync();
} catch (error) {
    console.error("error occured" + error)
}
module.exports = Gig; 

