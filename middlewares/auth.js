const CustomError = require('../utils/customerror');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.isLoggedIn = async (req, res, next) => {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return next(new CustomError('Login required', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        return next(new CustomError('Invalid token', 401));
    }
};

exports.customRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new CustomError('Access denied', 403));
        }
        next();
    };
};