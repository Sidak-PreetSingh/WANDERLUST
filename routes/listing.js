const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing");
const Review = require("../models/review.js");
const {isLoggedIn,isOwner,validateListing} = require("../middleware.js");
const multer  = require('multer');
const {storage} =  require("../cloudConfig.js");
const upload = multer({storage});


const listingController = require("../controllers/listing.js");

// router
//   .route("/")
//   .get(wrapAsync(listingController.index))
//   // .post(
//   //   isLoggedIn,
//   //   validateListing,
//   //   wrapAsync(listingController.createListing)
//   // );
//   .post((req,res)=>{
//     res.send(req.body);
//   })



router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image][url]'), // Multer data parse karega
    wrapAsync(listingController.createListing)
    // (req, res) => {
    //   res.send(req.file); // Ab yahan data dikhega!
    // }
  );



// NEW ROUTE
router.get("/new",isLoggedIn,listingController.renderNewForm);


router
  .route("/:id")
  .get( wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image][url]'), // Multer data parse karega
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing));




//edit route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));



module.exports=router;