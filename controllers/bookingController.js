const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);
const Tour = require("../models/tourModel");
const catchAsync = require("../utls/catchAsync");

exports.getCheckOutSession = catchAsync(
  async (req, res) => {
    // 1) Get current user
    const tour = await Tour.findById(req.params.tourId);

    // 2) create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      success_url: `${req.protocol}://${req.get("host")}/`,
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
        {
          price_data: {
            currency: "aud",
            unit_amount: tour.price * 100,
            product_data: {
              name: tour.name,
              description: tour.summary,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
    });

    // 3) Create session as response
    res.status(200).json({
      status: "success",
      session,
    });
  }
);
