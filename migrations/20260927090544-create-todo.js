"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("todos", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            title: {
                type: Sequelize.STRING,
                allowNull: false
            },

            dueDate: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },

            completed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("todos");
    }
};