var db = require('../config/dbConnection')
var collection = require('../config/collections')

const bcrypt = require('bcrypt')

module.exports={
    doSignUp:(userData) => {
        return new Promise(async(resolve,reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) =>{
                console.log(data)
                resolve(data) 
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((result)=>{
                    if(result){
                        console.log('login success!')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('login failed!')
                        resolve({state:false})
                    }
                })
            } else{
                console.log('user does not exist')
                resolve({state:false})
            }
        })
    }
}