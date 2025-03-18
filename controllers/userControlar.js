const User = require("../models/user.js");
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customerror.js');
const cookieToken = require('../utils/cookietoken');
const cloudinary = require('cloudinary');
const bcrypt = require('bcryptjs');
const mailHelper= require('../utils/emailhelper')
let result = {}; // Initialize 'result' for file upload
const nodemailer = require('nodemailer');
const crypto= require('crypto');
const user = require("../models/user.js");
const path = require('path');

exports.signup = BigPromise(async (req, res, next) => {
    // File upload handling
    if (req.files && req.files.photo) {
        let file = req.files.photo;
        result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: 'users',
            width: 150,
            crop: 'scale'
        });
    } else {
        result = { public_id: null, secure_url: null }; // handle case when no photo is uploaded
    }

    // Destructuring fields from request body
    const { name, email, password } = req.body;

    // Check for required fields
    if (!name || !email || !password) {
        return next(new CustomError('Name, email, and password are required fields', 400));
    }
    // Create user
    const user = await User.create({
        name,
        email,
        password,  // Save the hashed password
        photo: {
            id: result.public_id || null,  // Photo is optional
            secure_url: result.secure_url || null
        }
    });

    // Set cookie token
    cookieToken(user, res);
});
exports.login= BigPromise(async(req,res,next)=>{
     const {email,password}=req.body
     // check of password and email
     if(!email || !password){
        return next(new CustomError('email, and password are required fields', 400));
     }
     // get user from db
     const user = await User.findOne({email}).select("+password")
     // if user not found in db
     if(!user){
        return next(new CustomError('email or password dosent match or exist', 400));
     }
     const bcrypt = require("bcryptjs");

(async () => {
  const dbPassword = "$2a$10$J0wuLDOXz2t6x9r.t.YJquJhSU0bHf3xsv.T26hxugXBDQ13jhRdG"; // Your DB hash
  const userProvidedPassword = "12345678";

  const match = await bcrypt.compare(userProvidedPassword, dbPassword);
  console.log("Do passwords match?", match);
})();

     // if password is correct or not
     const isPasswordCorrect = await user.isValidatedPassword(password)
     console.log(isPasswordCorrect);
     
     if(!isPasswordCorrect){
        return next(new CustomError(' password dosent match or exist', 400));
     }
     // give token if correct 
     cookieToken(user, res,'/home.html');
})

exports.forgotPassword = BigPromise(async (req, res, next) => {
    const { email } = req.body;

    // 1️⃣ Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        return next(new CustomError("Email not found in our records", 400));
    }

    // 2️⃣ Generate reset token
    const forgotToken = user.getForgotPasswordToken();

    // Debugging logs
    console.log("Generated Token:", forgotToken);
    console.log("Encrypted Token (to save):", user.forgotPasswordToken);

    // 3️⃣ Save token to database
    await user.save({ validateBeforeSave: false });

    // 4️⃣ Create reset link
    const resetUrl = `${req.protocol}://${req.get("host")}/static/reset-password.html?token=${forgotToken}`;
    ;

    // 5️⃣ Email message
    const message = `Copy and paste this link into your browser: \n\n ${resetUrl} \n\n If you didn't request this, ignore this email.`;

    try {
        await mailHelper({
            email: user.email,
            subject: "Store Password Reset Email",
            message,
        });

        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully",
            token: forgotToken 
        });
    } catch (error) {
        console.error("Error sending email:", error);
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new CustomError("Email could not be sent", 500));
    }
});
  exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;
    
    const encryToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Encrypted Token:', encryToken);
  
    const user = await User.findOne({
      forgotPasswordToken: encryToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });
  
    console.log('User Query Result:', user);
  
    if (!user) {
      return next(new CustomError('Token is invalid or expired', 400));
    }
  
    if (req.body.password !== req.body.confirmPassword) {
      return next(new CustomError('Password and confirm password do not match', 400));
    }
  
    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
  
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
});  
exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
      expires: new Date(Date.now()), // Expire token immediately
      httpOnly: true,
      secure: true,  // Ensure secure cookie in HTTPS
      sameSite: "None", // Allow cross-origin cookies
  });

  res.status(200).json({
      success: true,  // Fixed typo
      message: "Logout successful"
  });
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});
exports.changePassword= BigPromise(async(req,res,next)=>{
  const userId = req.user.id;
  const user= await User.findById(userId).select('+password')
  const isCorrectPassword= await user.isValidatedPassword(req.body.oldPassword)
  if(!isCorrectPassword){
    return next(new customElements('old password is incorresct',400))
  }
  user.password= req.body.password
  await user.save()
  cookieToken(user,res);
})
exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const newData = {
      name: req.body.name,
      email: req.body.email
  };

  if (!req.body.name || !req.body.email) {
      return next(new CustomError("Name and email are required", 400));
  }

  if (req.files && req.files.photo) {  // ✅ Check if req.files.photo exists
      const user = await User.findById(req.user.id);
      if (!user) {
          return next(new CustomError("User not found", 404));
      }

      // Delete old photo if it exists
      if (user.photo?.id) {
          await cloudinary.v2.uploader.destroy(user.photo.id);
      }

      // Upload new photo
      const result = await cloudinary.v2.uploader.upload(req.files.photo.tempFilePath, {
          folder: 'users',
          width: 150,
          crop: 'scale'
      });

      newData.photo = {
          id: result.public_id,
          secure_url: result.secure_url
      };
  }

  // Update user details
  const updatedUser = await User.findByIdAndUpdate(req.user.id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
  });

  res.status(200).json({
      success: true,
      user: updatedUser
  });
});

exports.adminAllUser= BigPromise(async(req,res,next)=>{
  const users= await User.find({})
  res.status(200).json
  ({
    success:true,
    users
  })
})
exports.adminGetOneUser= BigPromise(async(req,res,next)=>{
  const user= await User.findById(req.params.id)
  if (!user) {
    return next(new CustomError('user not found',400))
  }
  res.status(200).json
  ({
    success:true,
    user
  })
})
exports.adminDeleteOneUserDetails= BigPromise(async(req,res,next)=>{
  const user= await User.findById(req.params.id)
  if(!user){
    return next(new CustomError('user not found',400))
  }
  const imageId=user.photo.id
  await cloudinary.v2.uploader.destroy(imageId)
  await user.remove()
  res.status(200).json({
    succes:true
  })
})
exports.managerAllUser= BigPromise(async(req,res,next)=>{
  const users= await User.find({role:'user'})
  res.status(200).json
  ({
    success:true,
    users
  })
})