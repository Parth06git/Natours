const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");
// const validator = require("validator");

//Mongoose Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have Name"],
      unique: [true, "Each tour must have unique name"],
      trim: true,
      maxlength: [
        40,
        "A tour should have less than 40 character",
      ],
      minlength: [
        10,
        "A tour should have greater than 10 character",
      ],
      // validate: [
      //   validator.isAlpha,  // it also not allow spaces in name
      //   "Tour name must only contain alphabet",
      // ],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "Difficulty must be either Easy, Medium or Difficult",
      },
      default: "medium",
    },
    price: {
      type: Number,
      required: [true, "A Tour must have Price"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [0, "rating must be between 0 and 5"],
      max: [5, "rating must be between 0 and 5"],
      set: (val) => Math.round(val * 10) / 10, // Math.round() rounds the value to INT
    },
    slug: String,
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on New document creation
          // So this doesn't work in update tour
          return val < this.price;
        },
        message:
          "Discount should be less than the price of tour",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array,     this line is for embedding the guides from user model
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

// Mongoose Virtual Properties
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Mongoose Middleware

// 1) Document middleware   runs before .save() and .create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  // console.log(this.slug);
  next();
});

// Embedding guides from user to tours
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(
//     async (id) => await User.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre("save", function (next) {
//   console.log("Document is saving ...");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(`${doc.slug} is saved in db`);
//   next();
// });

// 2) Query Middleware
// tourSchema.pre("find", function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: { $ne: true },
  });
  next();
});

// Populating the data
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

// 3) Aggregation Middleware
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
//   // console.log(this.pipeline());
//   next();
// });

// Mongoose Model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
