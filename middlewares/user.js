const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customerror');
const JWT = require('jsonwebtoken');

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  let token;

  // Extract token
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.header("Authorization")) {
    if (req.header("Authorization").startsWith("Bearer ")) {
      token = req.header("Authorization").replace("Bearer ", "");
    }
  }

  if (!token) {
    return next(new CustomError("Login first to access this page", 401));
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return next(new CustomError("User not found", 404));
    }
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return next(new CustomError("Invalid or expired token", 401));
  }
});
exports.customRole = (...roles) => {
  return(req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return next(new CustomError('Ypu are not allowed for this resource',403))
    }
    next();
  }
}