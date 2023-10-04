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
router.get('/', function (req, res, next) {
  let user = req.session.user
  console.log(user)
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user });
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
      console.log('login success')
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


router.get('/cart', verifyLoggedIn, (req, res) => {
  res.render('user/cart')
})

module.exports = router;    
