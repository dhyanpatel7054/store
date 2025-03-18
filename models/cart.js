const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
  product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
  },
  quantity: {
      type: Number,
      required: true,
      min: 1
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for total price calculation
cartSchema.virtual('total').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
});

// Virtual for formatted total display
cartSchema.virtual('formattedTotal').get(function() {
  return this.total.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
});

// Add population middleware for product detail
module.exports = mongoose.model('Cart', cartSchema);