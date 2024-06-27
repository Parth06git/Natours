const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utls/appError");
const catchAsync = require("../utls/catchAsync");

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get Tour data
  const tours = await Tour.find();

  // 2) Render that template user your data
  res.status(200).render("overview", {
    title: "Exciting tours for adventurous people",
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get requested tour including tour guides and reviews
  const tour = await Tour.findOne({
    slug: req.params.slug,
  }).populate({
    path: "reviews",
    select: "review rating user",
  });

  if (!tour) {
    return next(
      new AppError("There is no tour with that name!", 404)
    );
  }

  // 2) Render that template user your data
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("tour", {
      title: tour.name,
      tour: tour,
    });
});

exports.getLogin = catchAsync(async (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("login", {
      title: "Login",
    });
});

exports.getAccount = async (req, res) => {
  const user = await User.findById(req.user._id);

  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("account", {
      title: `${user.name.split(" ")[0]}'s Account`,
    });
};
