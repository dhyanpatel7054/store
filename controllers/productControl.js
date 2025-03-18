const Product = require('../models/product'); // ✅ Correct import
const bigPromise = require("../middlewares/bigPromise");
const cloudinary = require('cloudinary');
const CustomError = require('../utils/customerror');
const WhereClause = require('../utils/whereClause');
const Razorpay = require("razorpay");

exports.addProduct = bigPromise(async (req, res, next) => {
  try {
    let imagesArray = [];

    // ✅ Check if photos are provided
    if (!req.files || !req.files.photos) {
      return next(new CustomError("Images are required", 400));
    }

    // ✅ Ensure `photos` is an array (handles single & multiple images)
    const photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    // ✅ Upload images to Cloudinary
    for (let photo of photos) {
      let result = await cloudinary.v2.uploader.upload(photo.tempFilePath, {
        folder: "products",
      });

      console.log("Uploaded Image URL:", result.secure_url);

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url
      });
    }

    // ✅ Log received data for debugging
    console.log("Received Product Data:", req.body);

    // ✅ Convert stock to number and validate
    req.body.stock = req.body.stock ? Number(req.body.stock) : 0;

    if (req.body.stock === undefined || isNaN(req.body.stock)) {
        return next(new CustomError("Stock is required and must be a number", 400));
    }

    // ✅ Add images & user info to request body
    req.body.photos = imagesArray;
    req.body.user = req.user.id;

    console.log("Final Product Data Before Saving:", req.body);

    // ✅ Create product in database
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product,
    });

  } catch (error) {
    console.error("Error:", error);
    return next(new CustomError(error.message || "Something went wrong", 500));
  }
});

exports.getAllProduct = bigPromise(async (req, res, next) => {
  try {
    const resultPerPage = 100;
    const TotalcountProduct = await Product.countDocuments(); // ✅ Fixed

    let productsObj = new WhereClause(Product.find(), req.query).search().filter();
    let products=await productsObj.base
    const filteredProductNumber= products.length
    productsObj.pager(resultPerPage);
    products = await productsObj.base.clone();
    res.status(200).json({
      success: true,
      products,
      TotalcountProduct,
      filteredProductNumber,
    });
  } catch (error) {
    return next(new CustomError(error.message, 500));
  }
});
exports.getOneProduct = bigPromise(async (req, res, next) => {
  const product =await Product.findById(req.params.id)
  if(!product){
    return next(new CustomError('product not found with this ID',400))
  }
  res.status(200).json({
    success:true,
    product
  })
});
exports.adminGetAllProduct= bigPromise(async(req,res,next)=>{
  const products= await Product.find()
  if(!products){
    return next(new CustomError('product not found',400))
  }
  res.status(200).json({
    success:true,
    products
  })
})
exports.adminUpdateOneProduct = bigPromise(async (req, res, next) => {
  // Fix Typo: Use `params`, not `prams`
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("Product not found", 400));
  }

  let imagesArray = [];

  // ✅ Fix: Ensure `product.photos` exists before looping
  if (product.photos && product.photos.length > 0) {
    for (let index = 0; index < product.photos.length; index++) {
      await cloudinary.v2.uploader.destroy(product.photos[index].id);
    }
  }

  // ✅ Fix: Ensure `req.files.photos` exists before processing images
  if (req.files && req.files.photos) {
    let photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    for (let photo of photos) {
      let result = await cloudinary.v2.uploader.upload(photo.tempFilePath, {
        folder: "products",
      });

      console.log("Uploaded Image URL:", result.secure_url); // Debugging

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }

    // ✅ Fix: Assign `imagesArray` after the loop
    req.body.photos = imagesArray;
  }

  // ✅ Fix: Move the update query outside the loop
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct= bigPromise(async(req,res,next)=>{
  const product= await Product.findById(req.params.id)
  if(!product){
    return next(new CustomError('product not found',400))
  }
  for (let index = 0;index < product.photos.length; index++){
     await cloudinary.v2.uploader.destroy(
      product.photos[index].id
    )
  }
  await product.deleteOne(); 
  res.status(200).json({
    success:true,
    message:'product was deleted'
  })
})
exports.addReview = bigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
      return next(new CustomError("Product not found", 404));
  }

  const alreadyReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
      product.reviews.forEach((rev) => {
          if (rev.user.toString() === req.user._id.toString()) {
              rev.comment = comment;
              rev.rating = rating;
          }
      });
  } else {
      product.reviews.push(review);
      product.numberOfReviews = product.reviews.length;
  }

  // Adjust average rating
  product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
      success: true,
      message: "Review added successfully",
  });
});

exports.deleteReview= bigPromise(async(req,res,next)=>{
  const { productId}= req.query;
  const product= await Product.findById(productId)
  const reviews= product.reviews.filter(
    (rev)=>rev.user.toString === req.user._id.toString()
  )
  const numberOfReviews= reviews.length
  product.rating= product.reviews.reduce((acc,item)=> item.rating+ acc,0)/product.reviews.length


  await Product.findByIdAndUpdate(productId,{
    reviews,
    ratings,
    numberOfReviews,
  },{
    new: true,
    runValidators: true,
    useFindAndModify: false
  })
  res.status(200).json({
    success: true
  })
})
exports.getOnlyReviewsForOneProduct= bigPromise(async (req,res,next)=>{
  const product= await Product.findById(req.query.id)

  res.status(200).json({
    success:true,
    reviews: product.reviews,
  })
})
exports.searchItem=bigPromise(async (req, res, next) => {
  const query = req.query.q;
  if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter is required" });
  }

  const products = await Product.find({ name: new RegExp(query, 'i') }).limit(5);
  res.status(200).json({ success: true, products });
})
exports.sendRazorPayPayment=bigPromise(async (req, res, next) => {
  res.status(200).json({
    razorkey: process.env.RAZORPAY_API_KEY
  })
})
exports.captureRazorPayPayment = bigPromise(async (req, res, next) => {
  try {
      // Ensure amount is provided
      if (!req.body.amount) {
          return res.status(400).json({ success: false, message: "Amount is required" });
      }

      // Convert amount to paise (₹1 = 100 Paise)
      const amountInPaise = req.body.amount;

      // Initialize Razorpay instance
      const instance = new Razorpay({
          key_id: process.env.RAZORPAY_API_KEY,
          key_secret: process.env.RAZORPAY_SECRET
      });

      // Define payment options
      const options = {
          amount: amountInPaise, // Amount in paise
          currency: "INR"
      };

      console.log("Creating Razorpay order with amount:", amountInPaise);

      // Create order with Razorpay
      const myOrder = await instance.orders.create(options);
      console.log("Razorpay Order Created:", myOrder);

      // Send order details to frontend
      res.status(200).json({
          success: true,
          amount: req.body.amount,
          razorpayOrderId: myOrder.id,
          order: myOrder
      });

  } catch (error) {
      console.error("Razorpay Error:", error);
      res.status(500).json({ success: false, message: "Payment creation failed", error: error.message });
  }
});