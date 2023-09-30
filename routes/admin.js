var express = require('express');
var router = express.Router();

const productHelpers = require('../helpers/product-helpers');


/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{products,admin:true}); 
  }) 


});

router.get('/add-products',function(req,res){
  res.render('admin/add-products');
});

router.post('/add-products',function (req,res){
  //console.log(req.body)
  //console.log(req.files.image) 
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      //console.log(id)
      if(!err)
      res.render('admin/add-products')
    })
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let prodId=req.params.id
  productHelpers.deleteProduct(prodId).then((response)=>{
    res.render('/admin/')
  })
})

module.exports = router;
