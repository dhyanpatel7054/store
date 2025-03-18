const express = require('express');
const router = express.Router();
const { isLoggedIn, customRole } = require('../middlewares/auth');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
} = require('../controllers/cartcontroller');

router.route('/')
    .get(isLoggedIn, getCart)
    .post(isLoggedIn, addToCart);

router.route('/:itemId')
    .put(isLoggedIn, updateCartItem)
    .delete(isLoggedIn, removeFromCart);


module.exports = router;