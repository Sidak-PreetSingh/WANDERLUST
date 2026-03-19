const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  let { category, search } = req.query;
  console.log("Search:", search);
  let query = {};

  // Category filter
  if (category) {
    query.category = category;
  }

  // Search filter (title, location, country)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
    ];
  }
  console.log("Query:", query);
  const alllistings = await Listing.find(query);

  res.render("listings/index.ejs", { alllistings, category, search });
};


module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};




// MODIFY NEW
module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // 🔥 Nearby Similar Listings Logic
    const nearbyListings = await Listing.find({
        _id: { $ne:listing._id }, // current listing exclude
        category: listing.category,
        price: {
            $gte: listing.price - 500,
            $lte: listing.price + 500
        },
        geometry: {
            $near: {
                $geometry: listing.geometry,
                $maxDistance: 100000 // 100km radius
            }
        }
    }).limit(5);

    res.render("listings/show.ejs", { 
        listing, 
        nearbyListings,
        mapToken: process.env.MAP_TOKEN 
    });
};




module.exports.createListing = async (req, res,next) => {
    // 1. Location ko coordinates mein badlein (Geocoding)
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    const listingData = req.body.listing;
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // 2. Geometry data (coordinates) save karein
    // Ensure aapke Schema mein 'geometry' field ho
    newListing.geometry = response.body.features[0].geometry;

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};





module.exports.renderEditForm = async(req,res)=>{
    let {id}=req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let orignalImageUrl = listing.image.url;
    orignalImageUrl=orignalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs",{listing,orignalImageUrl});
}




module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    
    // 1. Purana data find karein update se pehle
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // 2. Text data update karein (Price, Location, etc.)
    // Yahan 'listing' variable ko firse declare nahi karna hai (let/const hata dein)
    listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
    );
    // 3. Image update handling (Agar nayi file upload hui hai)
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};






module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted");
    res.redirect("/listings");
}