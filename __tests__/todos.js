const request = require("supertest");
const bcrypt = require("bcryptjs");

const { app } = require("../app");
const sequelize = require("../models");
const { User, Todo } = sequelize;

describe("Milestone 10 Todo Application", () => {
    let user;
    let agent;

    beforeAll(async () => {
        agent = request.agent(app);

        user = await User.create({
            first_name: "Test User",
            email: `test${Date.now()}@example.com`,
            password: await bcrypt.hash("password123", 10)
        });
    });

    afterAll(async () => {
        await Todo.destroy({
            where: {
                userId: user.id
            }
        });

        await User.destroy({
            where: {
                id: user.id
            }
        });

        await sequelize.close();
    });

    test("should create a Todo for a user", async () => {
        const todo = await Todo.create({
            title: "Test Todo",
            dueDate: "2026-09-30",
            completed: false,
            userId: user.id
        });

        expect(todo.title).toBe("Test Todo");
        expect(todo.userId).toBe(user.id);
        expect(todo.completed).toBe(false);
    });

    test("should not allow a Todo without a title", async () => {
        await expect(
            Todo.create({
                title: "",
                dueDate: "2026-09-30",
                userId: user.id
            })
        ).rejects.toThrow();
    });

    test("should not allow a Todo without a due date", async () => {
        await expect(
            Todo.create({
                title: "Missing Date",
                dueDate: null,
                userId: user.id
            })
        ).rejects.toThrow();
    });

    test("should update Todo completion status", async () => {
        const todo = await Todo.create({
            title: "Completion Test",
            dueDate: "2026-09-30",
            completed: false,
            userId: user.id
        });

        todo.completed = true;
        await todo.save();

        const updatedTodo = await Todo.findByPk(todo.id);

        expect(updatedTodo.completed).toBe(true);
    });

    test("should delete a Todo", async () => {
        const todo = await Todo.create({
            title: "Delete Test",
            dueDate: "2026-09-30",
            completed: false,
            userId: user.id
        });

        await todo.destroy();

        const deletedTodo = await Todo.findByPk(todo.id);

        expect(deletedTodo).toBeNull();
    });

    test("should isolate Todos by userId", async () => {
        const secondUser = await User.create({
            first_name: "Second User",
            email: `second${Date.now()}@example.com`,
            password: await bcrypt.hash("password123", 10)
        });

        await Todo.create({
            title: "User One Todo",
            dueDate: "2026-09-30",
            userId: user.id
        });

        await Todo.create({
            title: "User Two Todo",
            dueDate: "2026-09-30",
            userId: secondUser.id
        });

        const userOneTodos = await Todo.findAll({
            where: {
                userId: user.id
            }
        });

        expect(
            userOneTodos.some(todo => todo.title === "User One Todo")
        ).toBe(true);

        expect(
            userOneTodos.some(todo => todo.title === "User Two Todo")
        ).toBe(false);

        await Todo.destroy({
            where: {
                userId: secondUser.id
            }
        });

        await User.destroy({
            where: {
                id: secondUser.id
            }
        });
    });
});