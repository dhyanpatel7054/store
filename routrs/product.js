const express = require('express')
const router = express.Router()
const { isLoggedIn, customRole,} = require('../middlewares/user');
const {addProduct,getAllProduct,adminGetAllProduct,getOneProduct,adminUpdateOneProduct,adminDeleteOneProduct, addReview, deleteReview, getOnlyReviewsForOneProduct, searchItem, sendRazorPayPayment, captureRazorPayPayment} = require('../controllers/productControl');

// user routes
router.route('/products').get(getAllProduct)
router.route('/product/:id')
.get(getOneProduct)
router.route('/review').post(isLoggedIn,addReview)
router.route('/review').delete(isLoggedIn,deleteReview)
router.route('/reviews').get(getOnlyReviewsForOneProduct);
//admin routes
router.route('/admin/product/add').post(isLoggedIn,customRole("admin"),addProduct)
router.route('/admin/products')
router.route('/search').get(searchItem)
.get(isLoggedIn,customRole("admin"),adminGetAllProduct)
router.route('/admin/product/:id')
.put(isLoggedIn,customRole("admin"),adminUpdateOneProduct)
.delete(isLoggedIn,customRole("admin"),adminDeleteOneProduct)

router.route('/razorpaykey').get(isLoggedIn,sendRazorPayPayment)
router.route('/razorpaypayment').post(isLoggedIn,captureRazorPayPayment)
module.exports=router;