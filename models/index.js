require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false
    }
);

// Export sequelize BEFORE loading the models
module.exports = sequelize;

const User = require("./user");
const Todo = require("./todo");

User.hasMany(Todo, {
    foreignKey: "userId",
    onDelete: "CASCADE"
});

Todo.belongsTo(User, {
    foreignKey: "userId"
});

module.exports.User = User;
module.exports.Todo = Todo;