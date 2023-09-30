var db= require('../config/dbConnection')
var collection=require('../config/collections');
var objectId=require('mongodb').objectId //get mongodb object function
const { response } = require('express');
const { ObjectId } = require('mongodb');


module.exports={
    addProduct:(product,callback)=>{
        console.log(product);
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        }) 
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id: new ObjectId(prodId)}).then((response)=>{ //using mongodb object to convert prodId similar to mongodb
            resolve(response)  
        })
        })
    }
}