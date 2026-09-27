const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "First name cannot be empty"
                }
            }
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Please enter a valid email"
                },
                notEmpty: {
                    msg: "Email cannot be empty"
                }
            }
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Password cannot be empty"
                },
                len: {
                    args: [6, 100],
                    msg: "Password must be at least 6 characters"
                }
            }
        }
    },
    {
        tableName: "users",
        timestamps: true
    }
);

module.exports = User;