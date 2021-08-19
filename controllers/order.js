require('dotenv').config();
const { Order, CartItem } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
// nodemailer for email
const nodemailer = require("nodemailer");

exports.orderById = (req, res, next, id) => {
    Order.findById(id)
        .populate('products.product', 'name price')
        .exec((err, order) => {
            if (err || !order) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            req.order = order;
            next();
        });
};

exports.create = (req, res) => {
    console.log('CREATE ORDER: ', req.body);
    req.body.order.user = req.profile;
    const order = new Order(req.body.order);
    order.save((error, data) => {
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }

        // email emailData
        const emailData = `
            <p>Total products: ${order.products.length}</p>
            <p>Total cost: R${order.amount}</p>
            <p>Login to dashboard to the order in detail.</p>
        `;

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
                user: 'amandlamm1@gmail.com',
                pass: process.env.GMAILPW
            },
            tls: {
                rejectUnauthorized: false //for allowing sending from another domain
            }
        });

        // setup email data with unicode symbols
        const mailOptions = {
            from: '"U-call Logistics" <noreply@u-call.com>',
            to: 'mnqobiwebdesign@gmail.com',
            subject: 'A new order is received',
            html: emailData
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(err, info) {
            if (err) {
                return console.log(err)
            }   
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        });
    });
};

exports.listOrders = (req, res) => {
    Order.find()
        .populate('user', '_id name address')
        .sort('-created')
        .exec((err, orders) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }
            res.json(orders);
        });
};

exports.getStatusValues = (req, res) => {
    res.json(Order.schema.path('status').enumValues);
};

exports.updateOrderStatus = (req, res) => {
    Order.update({ _id: req.body.orderId }, { $set: { status: req.body.status } }, (err, order) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(order);
    });
};
