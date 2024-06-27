const { promisify } = require("util");
const User = require("./../models/userModel");
const AppError = require("./../utls/appError");
const crypto = require("crypto");
const catchAsync = require("../utls/catchAsync");
const jwt = require("jsonwebtoken");
const Email = require("../utls/email");

const createToken = (id) => {
  return jwt.sign({ _id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  // sending token as Cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV !== "development")
    cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  // This works like it change password to undefined but this action doesn't save in db because we haven't use user.save()

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  sendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Email and Password exist
  if (!email || !password) {
    return next(
      new AppError("Please Enter Email and Password", 400)
    );
  }

  // 2) User exist && password is correct
  const user = await User.findOne({ email: email }).select(
    "+password"
  );

  if (
    !user ||
    !(await user.correctPassword(password, user.password))
  ) {
    return next(
      new AppError("Invalid Email or Password", 401)
    );
  }

  // 3) if everything is ok, send token to client
  sendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "LogOut", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError(
        "You are not logged in! Please log in to get access",
        401
      )
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) check if user still exists
  const freshUser = await User.findById(decoded._id);
  if (!freshUser) {
    next(
      new AppError(
        "The user belonging to this user does no longer exist",
        401
      )
    );
  }

  // 4) check user change password after token was issued
  if (freshUser.changePasswordAfter(decoded.iat)) {
    next(
      new AppError(
        "Password is changed! Please login again.",
        401
      )
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You are not allowed to perform this action!",
          403
        )
      );
    }

    next();
  };
};

exports.forgetPassword = async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(
      new AppError(
        "There is no user with this email address.",
        404
      )
    );
  }

  // 2) Generate random token
  const resetToken = user.genPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token to user's email

  // We are using try catch because we have to do more than just send the error
  try {
    const resetUrl = `${req.protocol}:/${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token is sent to provided email",
    });
  } catch (err) {
    // console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        "There was an error during sending the email! Try again later",
        500
      )
    );
  }
};

exports.resetPassword = catchAsync(
  async (req, res, next) => {
    // 1) Get user based on token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    // 2) Reset Password if token is not expired
    if (!user)
      next(
        new AppError("Token is invalid or expired", 400)
      );
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpire = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // 3) Update passwordChangedAt property for user done in mongoose middleware check useModel
    // 4) Log the user in, send jwt
    sendToken(user, 200, res);
  }
);

exports.updatePassword = catchAsync(
  async (req, res, next) => {
    // 1) Get user
    const user = await User.findById(req.user._id).select(
      "+password"
    );

    // 2) check if posted current password is correct
    if (
      !(await user.correctPassword(
        req.body.currentPassword,
        user.password
      ))
    ) {
      return next(
        new AppError("Current password is incorrect", 400)
      );
    }

    // 3) update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in
    sendToken(user, 200, res);
  }
);

//  only for rendering pages
exports.isLogedin = async (req, res, next) => {
  try {
    // 1) get token and check if it's there
    if (req.cookies.jwt) {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) check if user still exists
      const freshUser = await User.findById(decoded._id);
      if (!freshUser) {
        next();
      }

      // 4) check user change password after token was issued
      if (freshUser.changePasswordAfter(decoded.iat)) {
        next();
      }

      res.locals.user = freshUser;
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};
