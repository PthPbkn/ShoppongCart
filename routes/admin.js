var express = require('express');
var router = express.Router();
const fs = require('fs');

const productHelpers = require('../helpers/product-helpers');


/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{products,admin:true}); 
  }) 


});

router.get('/add-products',function(req,res){
  res.render('admin/add-products', {admin:true});
});

router.post('/add-products',function (req,res){
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err)
      res.redirect('/admin')
    })
  })
})

router.get('/delete-product/:id',(req,res)=>{
  let prodId=req.params.id
  productHelpers.deleteProduct(prodId).then((response)=>{
    fs.unlink('./public/product-images/'+prodId+'.jpg',(err)=>{
      if(err){
        console.log('image delete error') 
      } else{
        console.log('file deleted :' + './public/product-images/'+prodId+'.jpg')
      }
       
    })
    //res.render('admin/view-products')
    res.redirect('/admin') 
  })
})

router.get('/edit-product/:id',async (req,res)=>{
  let productDetails=await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{productDetails})
})


router.post('/edit-product/:id', (req,res)=>{
  productHelpers.updateProductDetails(req.params.id, req.body).then(()=>{
  if(req.files.image){
    let id=req.params.id
    req.files.image.mv('./public/product-images/'+id+'.jpg')
  }
  res.redirect('/admin')
  })
})


module.exports = router;
