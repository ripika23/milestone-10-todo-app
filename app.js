require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const { csrfSync } = require("csrf-sync");

const { User, Todo } = require("./models");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(flash());

const {
    generateToken,
    csrfSynchronisedProtection
} = csrfSync({
    getTokenFromRequest: (req) =>
        req.body?._csrf || req.headers["x-csrf-token"]
});

app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId
        ? {
              id: req.session.userId,
              first_name: req.session.first_name
          }
        : null;

    res.locals.successMessages = req.flash("success");
    res.locals.errorMessages = req.flash("error");

    next();
});

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        req.flash("error", "Please sign in first.");
        return res.redirect("/login");
    }

    next();
}

/* Home */

app.get("/", async (req, res) => {
    try {
        let todos = [];

        if (req.session.userId) {
            todos = await Todo.findAll({
                where: {
                    userId: req.session.userId
                },
                order: [["id", "DESC"]]
            });
        }

        res.render("index", {
            todos,
            csrfToken: generateToken(req)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

/* Sign Up */

app.get("/signup", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("signup", {
        csrfToken: generateToken(req)
    });
});

app.post(
    "/signup",
    csrfSynchronisedProtection,
    async (req, res) => {
        try {
            const { first_name, email, password } = req.body;

            if (!first_name || !email || !password) {
                req.flash(
                    "error",
                    "First name, email and password are required."
                );

                return res.redirect("/signup");
            }

            const existingUser = await User.findOne({
                where: { email }
            });

            if (existingUser) {
                req.flash(
                    "error",
                    "An account with this email already exists."
                );

                return res.redirect("/signup");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                first_name,
                email,
                password: hashedPassword
            });

            req.flash(
                "success",
                "Account created successfully. Please sign in."
            );

            res.redirect("/login");
        } catch (error) {
            console.error(error);

            if (error.name === "SequelizeValidationError") {
                error.errors.forEach((item) => {
                    req.flash("error", item.message);
                });

                return res.redirect("/signup");
            }

            req.flash("error", "Unable to create account.");
            res.redirect("/signup");
        }
    }
);

/* Sign In */

app.get("/login", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("login", {
        csrfToken: generateToken(req)
    });
});

app.post(
    "/login",
    csrfSynchronisedProtection,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({
                where: { email }
            });

            if (!user) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }

            const passwordMatches = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatches) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }

            req.session.userId = user.id;
            req.session.first_name = user.first_name;

            req.flash("success", "Signed in successfully.");

            res.redirect("/");
        } catch (error) {
            console.error(error);

            req.flash("error", "Unable to sign in.");
            res.redirect("/login");
        }
    }
);

/* Sign Out */

app.post(
    "/logout",
    csrfSynchronisedProtection,
    (req, res) => {
        req.session.destroy((error) => {
            if (error) {
                console.error(error);
                return res.redirect("/");
            }

            res.redirect("/login");
        });
    }
);

/* Create Todo */

app.post(
    "/todos",
    requireLogin,
    csrfSynchronisedProtection,
    async (req, res) => {
        try {
            const { title, dueDate } = req.body;

            if (!title || !title.trim()) {
                req.flash("error", "Todo title cannot be empty.");
                return res.redirect("/");
            }

            if (!dueDate) {
                req.flash("error", "Due date cannot be empty.");
                return res.redirect("/");
            }

            await Todo.create({
                title: title.trim(),
                dueDate,
                completed: false,
                userId: req.session.userId
            });

            req.flash("success", "Todo added successfully.");

            res.redirect("/");
        } catch (error) {
            console.error(error);

            if (error.name === "SequelizeValidationError") {
                error.errors.forEach((item) => {
                    req.flash("error", item.message);
                });
            } else {
                req.flash("error", "Unable to create Todo.");
            }

            res.redirect("/");
        }
    }
);

/* Update Todo */

app.put(
    "/todos/:id",
    requireLogin,
    csrfSynchronisedProtection,
    async (req, res) => {
        try {
            const todo = await Todo.findOne({
                where: {
                    id: req.params.id,
                    userId: req.session.userId
                }
            });

            if (!todo) {
                req.flash("error", "Todo not found.");
                return res.redirect("/");
            }

            const completed = req.body.completed === true ||
                req.body.completed === "true";

            todo.completed = completed;

            await todo.save();

            req.flash(
                "success",
                completed
                    ? "Todo marked as completed."
                    : "Todo marked as incomplete."
            );

            res.redirect("/");
        } catch (error) {
            console.error(error);

            req.flash("error", "Unable to update Todo.");
            res.redirect("/");
        }
    }
);

/* Delete Todo */

app.delete(
    "/todos/:id",
    requireLogin,
    csrfSynchronisedProtection,
    async (req, res) => {
        try {
            const todo = await Todo.findOne({
                where: {
                    id: req.params.id,
                    userId: req.session.userId
                }
            });

            if (!todo) {
                req.flash("error", "Todo not found.");
                return res.redirect("/");
            }

            await todo.destroy();

            req.flash("success", "Todo deleted successfully.");

            res.redirect("/");
        } catch (error) {
            console.error(error);

            req.flash("error", "Unable to delete Todo.");
            res.redirect("/");
        }
    }
);

module.exports = {
    app,
    sequelize: require("./models")
};