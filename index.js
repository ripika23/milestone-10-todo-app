require("dotenv").config();

const { app, sequelize } = require("./app");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();

        console.log("Database connected successfully.");

        app.listen(PORT, () => {
            console.log(`Todo Manager running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();