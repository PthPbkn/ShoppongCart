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
  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
    //console.log(response)
  })
})


router.get('/add-to-cart/:id', verifyLoggedIn, (req, res)=>{                    // remove for ajax badge update
//router.get('/add-to-cart/:id', (req, res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/')                                                           // remove for ajax badge update
  })
})

router.get('/cart', verifyLoggedIn, async(req,res)=>{
  let cartProducts=await userHelpers.viewCart(req.session.user._id)
  console.log(cartProducts)
  res.render('user/cart',{cartProducts,user:req.session.user})
  
})

module.exports = router;    
