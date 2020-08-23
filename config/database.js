const { Sequelize, Op, Model, DataTypes } = require("sequelize");

//Database 
module.exports =  new Sequelize({
  dialect: 'sqlite',
  storage: './data/database.sqlite'
});

