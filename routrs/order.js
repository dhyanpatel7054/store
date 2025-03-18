const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require('../middlewares/user');
const {
    createOrder,  // Fixed typo (creatOrder → createOrder)
    getOneOrder,
    getLoggedInOrders,
    adminGetAllOrders,  // Changed to match controller export
    adminUpdateOrder,   // Fixed case and name (AdminUpdateOrders → adminUpdateOrder)
    adminDeleteOrder    // Fixed case and name (AdminDeleteOrders → adminDeleteOrder)
} = require('../controllers/orderController');

// User routes
router.route('/order/create').post(isLoggedIn, createOrder);
router.route('/order/:id').get(isLoggedIn, getOneOrder);
router.route('/myorders').get(isLoggedIn, getLoggedInOrders);  // Changed to plural for consistency

// Admin routes
router.route('/admin/orders')
    .get(isLoggedIn, customRole('admin'), adminGetAllOrders);  // Changed to admin-specific endpoint

router.route('/admin/order/:id')
    .put(isLoggedIn, customRole('admin'), adminUpdateOrder)
    .delete(isLoggedIn, customRole('admin'), adminDeleteOrder);

module.exports = router;