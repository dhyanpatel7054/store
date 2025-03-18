const Cart = require('../models/Cart');
const Product = require('../models/product');
const customerror = require('../utils/customerror');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name price photos stock"); 

      if (!cart) {
          return res.status(404).json({ success: false, message: "Cart is empty" });
      }

      res.status(200).json({ success: true, cart });
  } catch (error) {
      console.error("❌ Cart Fetch Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
};


// Add to cart
exports.addToCart = async (req, res, next) => {
  try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity) {
          return next(new customerror('Missing product ID or quantity', 400));
      }

      const product = await Product.findById(productId);
      if (!product) {
          return next(new customerror('Product not found', 404));
      }

      if (product.stock < quantity) {
          return next(new customerror(`Only ${product.stock} items available`, 400));
      }

      let cart = await Cart.findOne({ user: req.user._id });

      if (!cart) {
          cart = new Cart({ user: req.user._id, items: [] });
      }

      const existingItem = cart.items.find(item => item.product.toString() === productId);

      if (existingItem) {
          existingItem.quantity += quantity;

          if (existingItem.quantity > product.stock) {
              return next(new customerror(`Cannot add more than ${product.stock} items`, 400));
          }
      } else {
          cart.items.push({ product: productId, quantity });
      }

      await cart.save();

      res.status(200).json({
          success: true,
          cart
      });
  } catch (error) {
      console.error("Cart Error:", error);
      next(new customerror(error.message, 500));
  }
};


// Update cart item
exports.updateCartItem = async (req, res, next) => {
  try {
      const { quantity } = req.body;
      const itemId = req.params.itemId;

      if (!quantity || quantity < 1) {
          return next(new customerror('Invalid quantity', 400));
      }

      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
          return next(new customerror('Cart not found', 404));
      }

      const item = cart.items.id(itemId);
      if (!item) {
          return next(new customerror('Item not found in cart', 404));
      }

      const product = await Product.findById(item.product);
      if (quantity > product.stock) {
          return next(new customerror(`Only ${product.stock} items available`, 400));
      }

      item.quantity = quantity;
      await cart.save();

      res.status(200).json({
          success: true,
          cart: cart
      });
  } catch (error) {
      next(new customerror(error.message, 500));
  }
};

// Remove from cart
exports.removeFromCart = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        const cart = await Cart.findOne({ user: req.user._id });
        
        cart.items.pull(itemId);
        await cart.save();

        res.status(200).json({
            success: true,
            cart: cart
        });
    } catch (error) {
        next(new customerror(error.message, 500));
    }
};