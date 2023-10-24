var db = require('../config/dbConnection')
var collection = require('../config/collections')

const Razorpay = require('razorpay');
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express');
const { resolve } = require('path');
const { rejects } = require('assert');





var instance = new Razorpay({
    key_id: 'rzp_test_zd7eeAYu6Ev5Jm',
    key_secret: 'LqYcfflJsvf6vSGR2ki5O55X',
});



module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data)
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((result) => {
                    if (result) {
                        console.log('login success!')
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed!')
                        resolve({ state: false })
                    }
                })
            } else {
                console.log('user does not exist')
                resolve({ state: false })
            }
        })
    },
    addToCart: (prodId, userId) => {
        let prodObj = {
            item: new ObjectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (userCart) {
                console.log("******************** cart exist")
                let prodExist = userCart.products.findIndex(product => product.item == prodId)  // checking particular item exist in cart already
                if (prodExist != -1) {
                    // item exist in cart  
                    console.log("******************** Product exist in cart")
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(prodId) },           // matching existing item ID with new product ID
                            {
                                $inc: { 'products.$.quantity': 1 }                      // incriment product quantity by 1
                            }).then(() => {
                                resolve()
                            })
                } else {
                    // item not exist in cart
                    console.log("******************** Product NOT exist in cart")
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId) },
                            {
                                $push: { products: prodObj }
                                //$push: { products: new ObjectId(prodId) } 
                            }
                        ).then((response) => {
                            resolve()
                        })
                }
            } else {
                console.log("******************** cart NOT exist")
                let cartObj = {
                    user: new ObjectId(userId),
                    // products: [new ObjectId(prodId)]       //insert only product id
                    products: [prodObj]                       // insert both product id and quantity
                }
                console.log(cartObj)
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) } // to match with USER ID on collections - products and cart .

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },
                        //total: {$multiply:[{$toInt:"$product.Price"},{$toInt:"$quantity"}]}                        
                    }
                }
                // {
                //     "$lookup":
                //     {                                                    //find data on PRODUCTS that match with USER ID.
                //         "from": collection.PRODUCT_COLLECTION,           // from which collection
                //         "let": { "productList": "$products" },           // put result array into a variable named 'productList'
                //         "as": "cartItems",
                //         pipeline: [{ "$match": { "$expr": { "$in": ['$_id', "$$productList"] } } }]
                //     }
                // }
            ]).toArray()
            //console.log(cartItems)
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItemsCount = 0
            let cartExist = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (cartExist) {
                console.log(cartExist + "******************** cart exist")
                cartItemsCount = cartExist.products.length
            }
            resolve(cartItemsCount)
        })
    },
    changeProductQuntity: (details) => {
        let count = parseInt(details.count)
        let quantity = parseInt(details.quantity)

        //console.log("helper function called")

        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {                   // if user pressing '-' button and present quantity is 1, then..
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        {
                            _id: new ObjectId(details.cart)
                        },
                        {
                            $pull: { products: { item: new ObjectId(details.product) } } //remove particular product from products array
                        }

                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        {
                            _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) //matching cartID and item ID
                        },
                        {
                            $inc: { 'products.$.quantity': count } //increase or decrease product count by 1 
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })

            }

        })
    },

    removeItem: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    {
                        _id: new ObjectId(details.cart)
                    },
                    {
                        $pull: { products: { item: new ObjectId(details.product) } } //remove particular product from products array
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })
                })
        })

    },


    getTotalAmount: (userId) => {
        //console.log("User id: "+userId)
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) } // to match with USER ID on collections - products and cart .

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        quantity: '$quantity',
                        Price: '$product.Price',
                        total: { $sum: { $multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.Price" }] } }
                    }
                }
            ]).toArray()
            //console.log(total)
            console.log("Total Price: " + total[0].total)
            resolve(total[0].total)
        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total)
            let status = 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    house: order.houseNumber,
                    street: order.street,
                    city: order.city,
                    post: order.post,
                    mobile: order.mobile,
                },
                userId: new ObjectId(order.userId),
                products: products,
                totalAmount: total,
                status: status,
                time: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
                //console.log("response: "+ response.ops.insertedId)
                //console.log("order user id: "+response.insertedId)
                resolve(response.insertedId)
            })
        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            resolve(cart.products)
        })
    },
    generateRazorPay: (orderId, price) => {
        console.log("price :" + price)
        console.log("order id :" + orderId)
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: price * 100,
                currency: "INR",
                receipt: orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            }, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("new order: " + order.receipt)
                    resolve(order)
                }
            })
        })
    },
    verifyPayment: (payDetails) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'LqYcfflJsvf6vSGR2ki5O55X')
            hmac.update(payDetails['payment[razorpay_order_id]'] + '|' + payDetails['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == payDetails['payment[razorpay_signature]']) {
                console.log("hmac success")
                resolve()
            } else {
                console.log("hmac fail")
                reject()
            }

        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log("payment status :" + orderId)
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _Id: new ObjectId(orderId) },
                    {
                        $set: { status: 'placed' }
                    }).then(() => {
                        resolve()
                    })
        })
    },
    getOrdersList: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId)
            //let ordersList=await db.get().collection(collection.ORDER_COLLECTION).find({userId:new ObjectId(userId)}).toArray()
            let orderList = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        time: '$time',
                        amount: '$totalAmount',
                        status: '$status'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        time: 1, amount: 1, status: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(orderList)
            resolve(orderList)
        })
    },
    getAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) })
            resolve(address)
            console.log(address)
        })

    }



    // {
    //     $group:
    //     {
    //         _id:null,
    //         //total:{$sum:{$multiply:['$quantity','$product.Price']}}
    //         total: {$sum:{ $multiply: [ "$product.Price", "$quantity" ] } }
    //         //total:{$sum:{$multiply:["$ ",{$toInt:'$product.Price'}]}}
    //         //total:{$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.Price' }]}}
    //     }        
    // }   

}