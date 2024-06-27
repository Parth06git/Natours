const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");
// const reviewController = require("./../controllers/reviewController");

const router = express.Router();

// router.param("id", tourController.checkID);

// Nested Routes

// Route for the review can be POST|GET   /tours/145258/reviews
// 1) Method
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

// 2) Method
router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-tours")
  .get(
    tourController.aliasTopTours,
    tourController.getAllTours
  );

router
  .route("/tours-stats")
  .get(tourController.getTourStats);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo(
      "admin",
      "lead-guide",
      "guides"
    ),
    tourController.getMonthlyPlan
  );

router
  .route(
    "/tours-within/:distance/center/:latlng/unit/:unit"
  )
  .get(tourController.getToursWithin);

router
  .route("/distances/:latlng/unit/:unit")
  .get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
