var db = require('../config/dbConnection')
var collection = require('../config/collections')

const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')


module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
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
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((result) => {
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
                let prodExist = userCart.products.findIndex(product => product.item==prodId)  // checking particular item exist in cart already
                if (prodExist!=-1) {                                            
                    // item exist in cart                                   
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ 'products.item':new ObjectId(prodId)},           // matching existing item ID with new product ID
                            {
                                $inc: {'products.$.quantity':1}                      // incriment product quantity by 1
                            }).then(()=>{
                                resolve()
                            })
                } else {
                    // item not exist in cart
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId)},
                            {
                                $push: {products: prodObj}
                                 //$push: { products: new ObjectId(prodId) } 
                             }
                        ).then((response) => {
                            resolve()
                        })
                }
            } else {
                console.log("cart not exist: " + userCart) 
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
    viewCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) } // to match with USER ID on collections - products and cart .

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
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
                cartItemsCount = cartExist.products.length
            }
            resolve(cartItemsCount)
        })
    }
}