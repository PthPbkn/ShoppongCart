var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')


const verifyLoggedIn = ((req, res, next) => {  /* function to verify user is logged in */
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/logIn') // if user is not logged in ask to log in
  }
})



/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartItemsCount=0
  if(user){
    cartItemsCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartItemsCount});
  })

});

router.get('/logIn', function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/logIn', { "LoginErr": req.session.loginErr })
    req.session.loginErr = false
  }

})

router.post('/logIn', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
      //console.log('login success')
    }
    else {
      //req.session.loginErr=true OR another methode below
      req.session.loginErr = "Invalid username OR password"
      res.redirect('/logIn')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})



router.get('/signUp', function (req, res, next) {
  res.render('user/signUp')
})



router.post('/signUp', (req, res) => {
  console.log(req.body)
  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
    console.log(response)
  })
})


router.get('/add-to-cart/:id', verifyLoggedIn, (req, res)=>{                    // remove for ajax badge update
//router.get('/add-to-cart/:id', (req, res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/')                                                            // remove for ajax badge update
  })  
})
 



router.get('/cart', verifyLoggedIn, async(req,res)=>{ 
  let user = req.session.user
  let cartItemsCount=0
  if(user){
    cartItemsCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let cartProducts=await userHelpers.getCartProducts(req.session.user._id)
  if(cartItemsCount!=0){
    var totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  }else{
    var totalValue=0
  }  
  //console.log(cartProducts)
  res.render('user/cart',{cartProducts,user:req.session.user,totalValue,cartItemsCount})
  
})



router.post('/change-quantity',(req,res,next)=>{
 
  userHelpers.changeProductQuntity(req.body).then(async(response)=>{
    response.totalPrice=await userHelpers.getTotalAmount(req.body.user)  // calling getTotalAmount func to change total amount when quantity change
    res.json(response)
    console.log(response)
  }) 
}) 

router.get('/place-order',verifyLoggedIn, async(req,res)=>{
  let user = req.session.user
  let cartItemsCount=0
  if(user){
    cartItemsCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let address=await userHelpers.getAddress(req.session.user._id)
  console.log(address)
  let totalPrice=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{totalPrice,user:req.session.user,cartItemsCount,address})
})  


router.post('/place-order',verifyLoggedIn,async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.session.user._id)
  let totalPrice=await userHelpers.getTotalAmount(req.session.user._id)  

  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
      //res.json({status:true})
      //console.log("order id :"+orderId)
      userHelpers.generateRazorPay(orderId,totalPrice).then((response)=>{
        res.json(response) 
      })
  })
})


router.get('/payment-status',verifyLoggedIn,(req,res)=>{
  res.render('user/payment-status')

})



router.post('/verify-payment',(req,res)=>{  
  userHelpers.verifyPayment(req.body).then(()=>{
        //console.log(req.body['order[receipt]'])

    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Success")
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:'Payment failed'})
  })
})

router.get('/order-list',verifyLoggedIn,async(req,res)=>{
  let cartItemsCount=0
  if(req.session.user){
    cartItemsCount=await userHelpers.getCartCount(req.session.user._id)
  }
  let ordersList=await userHelpers.getOrdersList(req.session.user._id)
  res.render('user/order-list',{user:req.session.user,ordersList,cartItemsCount})
})






module.exports = router;    
