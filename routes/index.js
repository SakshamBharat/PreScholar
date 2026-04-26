var express = require("express");
var router = express.Router();
var passport = require("passport");
var isAuth = require("../middleware/auth");

/* Dashboard */
router.get("/", isAuth, function (req, res) {
  res.render("index", { title: "Dashboard" });
});

/* Login page */
router.get("/login", (req, res) => {
  res.render("login");
});

/* Login POST */
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    res.redirect("/");
  }
);

/* Logout */
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/login");
  });
});

module.exports = router;