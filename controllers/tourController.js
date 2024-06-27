const multer = require("multer");
const sharp = require("sharp");

const AppError = require("../utls/appError");
const Tour = require("./../models/tourModel");
const catchAsync = require("./../utls/catchAsync");
const factory = require("./handlerFactory");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not an image! Please upload only images",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// exports.checkID = (req, res, next, val) => {
//   // console.log({ id: val });
//   // if (val > tours.length) {
//   //   return res.status(404).json({
//   //     status: "fail",
//   //     message: "Tour not Found",
//   //   });
//   // }
//   next();
// };

// Tours API Function
// exports.getAllTours = catchAsync(async (req, res) => {
//   // console.log(req.requestTime);

//   // Query building

//   // 1A) Filtering
//   // const queryObj = { ...req.query };
//   // const excludeFields = [
//   //   "page",
//   //   "sort",
//   //   "limit",
//   //   "fields",
//   // ];
//   // excludeFields.forEach((el) => delete queryObj[el]);

//   // 1B) Advance Filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(
//   //   /\b(gte|gt|lte|lt)\b/g,
//   //   (match) => `$${match}`
//   // );
//   // console.log(JSON.parse(queryStr));

//   // let query = Tour.find(JSON.parse(queryStr));

//   // const query = await Tour.find()
//   //   .where("duration")
//   //   .equals(5)
//   //   .where("difficulty")
//   //   .equals("easy");

//   // 2) Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(",").join(" ");
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort("-createdAt");
//   // }

//   // 3) Limiting Fields
//   // if (req.query.fields) {
//   //   let fields = req.query.fields.split(",").join(" ");
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select("-__v");
//   // }

//   // 4) Pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 25;
//   // const skip = (page - 1) * limit;
//   // query = query.skip(skip).limit(limit);

//   // // page=2 & limit=5 1-5 on page-1, 6-10 on page-2 .....
//   // // query = query.skip(5).limit(5);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) {
//   //     throw new Error("This page does not exit");
//   //   }
//   // }

//   // Query exexution
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();
//   const tours = await features.query;

//   // send response

//   res.status(200).json({
//     status: "success",
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: "reviews" });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields =
    "name,price,ratingsAverage,difficulty,duration,summary";
  next();
};

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTours: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $sort: { numTours: -1 },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      plans: plan,
    },
  });
});

exports.getToursWithin = catchAsync(
  async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const radius =
      unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng",
          400
        )
      );
    }

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: { $centerSphere: [[lng, lat], radius] },
      },
    });

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours: tours,
      },
    });
  }
);

exports.getDistances = catchAsync(
  async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng",
          400
        )
      );
    }

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          name: 1,
          distance: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        data: distances,
      },
    });
  }
);

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(
  async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images)
      return next();

    // Cover-Images
    req.body.imageCover = `tour-${req.params.id}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    // Images
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const fileName = `tour-${req.params.id}-${
          i + 1
        }.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${fileName}`);

        req.body.images.push(fileName);
      })
    );

    next();
  }
);
