
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const db = require('../config/database');

const Basket = db.query("SELECT * FROM `Baskets`", { type: Sequelize.QueryTypes.SELECT})

module.exports = Basket; 
