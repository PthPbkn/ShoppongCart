var db = require('../config/dbConnection')
var collection = require('../config/collections');
const { response } = require('express');
const { ObjectId } = require('mongodb'); //get mongodb object function


module.exports = {
    addProduct: (product, callback) => {
        console.log(product);
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(prodId) }).then((response) => { //using mongodb object to convert prodId similar to mongodb
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(prodId) }).then((product) => {
                resolve(product)
            })
        })

    },
    updateProductDetails: (prodId, prodDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: new ObjectId(prodId) }, {
                    $set: {
                        Name: prodDetails.Name,
                        Category: prodDetails.Category,
                        Description: prodDetails.Description,
                        Price: prodDetails.Price
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}