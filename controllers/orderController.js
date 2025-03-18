const Order = require('../models/order');
const Product = require('../models/product');
const bigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customerror");
const mongoose = require('mongoose');

exports.createOrder = bigPromise(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
        user: req.user._id
    });

    res.status(201).json({
        success: true,
        order,
    });
});

exports.getOneOrder = bigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
        return next(new CustomError('Order not found. Please check the order ID.', 404));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

exports.getLoggedInOrders = bigPromise(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });

    if (orders.length === 0) {
        return next(new CustomError("No orders found for this user.", 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});

exports.adminGetAllOrders = bigPromise(async (req, res, next) => {
    const orders = await Order.find();
    res.status(200).json({
        success: true,
        orders,
    });
});

exports.adminUpdateOrder = bigPromise(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(req.params.id).session(session);
        if (!order) {
            throw new CustomError('Order not found.', 404);
        }

        if (order.orderStatus === 'Delivered') {
            throw new CustomError('Order is already delivered.', 400);
        }

        const validStatuses = ['Processing', 'Shipped', 'Delivered'];
        if (!validStatuses.includes(req.body.status)) {
            throw new CustomError('Invalid order status.', 400);
        }

        // If status is being updated to Shipped/Delivered for the first time, update stock
        if (order.orderStatus !== 'Delivered' && req.body.status === 'Delivered') {
            for (const item of order.orderItems) {
                const product = await Product.findOneAndUpdate(
                    { _id: item.product, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );

                if (!product) {
                    throw new CustomError(`Insufficient stock for product ${item.product} or product not found.`, 400);
                }
            }
        }

        order.orderStatus = req.body.status;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            order,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});

exports.adminDeleteOrder = bigPromise(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(req.params.id).session(session);
        if (!order) {
            throw new CustomError('Order not found.', 404);
        }

        // Restore product stock if order was delivered
        if (order.orderStatus === 'Delivered') {
            for (const item of order.orderItems) {
                await Product.findOneAndUpdate(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
        }

        await Order.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully.',
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});