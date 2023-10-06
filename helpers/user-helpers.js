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
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (userCart) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: new ObjectId(prodId) }

                        }
                    ).then((response) => {
                        resolve()
                    })
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [new ObjectId(prodId)]
                }
                console.log(cartObj)
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    viewCart:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user: new ObjectId(userId)} // to match with USER ID on collections - products and cart .
                
                },
                {
                    "$lookup":
                    {                              //find data on PRODUCTS that match with USER ID.
                        "from": collection.PRODUCT_COLLECTION,                   // from which collection
                        "let": {"productList":"$products"},           // put result array into a variable named 'productList'
                        "as":"cartItems",
                        pipeline:[{"$match":{"$expr":{"$in":['$_id',"$$productList"]}}}]       
                    }
                }                
            ]).toArray()
            resolve(cartItems[0].cartItems)            
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let cartItemsCount=0
            let cartExist=await db.get().collection(collection.CART_COLLECTION).findOne({user: new ObjectId(userId)})
            if(cartExist){
                cartItemsCount=cartExist.products.length
            }
            resolve(cartItemsCount)
        })
    }
}