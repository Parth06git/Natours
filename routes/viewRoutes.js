const express = require("express");
const viewCotroller = require("../controllers/viewController");
const authCotroller = require("../controllers/authController");

const router = express.Router();

// router.get("/", (req, res) => {
//   res.status(200).render("base", {
//     tour: "Tada falls",
//     user: "Parth",
//   });
// });

router.get(
  "/",
  authCotroller.isLogedin,
  viewCotroller.getOverview
);
router.get(
  "/tour/:slug",
  authCotroller.isLogedin,
  viewCotroller.getTour
);
router.get(
  "/login",
  authCotroller.isLogedin,
  viewCotroller.getLogin
);
router.get(
  "/me",
  authCotroller.protect,
  viewCotroller.getAccount
);

module.exports = router;
