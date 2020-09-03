
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');


var PaymentAttributes = {
    pk:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    amount: {
        type: Sequelize.DECIMAL(10,2)
        
    },

    method: {
        type: Sequelize.STRING
    }

}

const Payment = db.define('Payment', PaymentAttributes)

try {
    Payment.sync();
} catch (error) {
    console.error("error occured" + error)
}

module.exports = Payment; 
