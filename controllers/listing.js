const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// 1. INDEX ROUTE (Search + Category Filter)
module.exports.index = async (req, res) => {
    let { category, search } = req.query;
    let filter = {};

    // Category check
    if (category) {
        filter.category = category;
    }

    // Search check (Title, Location, Country sab search hoga)
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } },
        ];
    }

    const alllistings = await Listing.find(filter);
    res.render("listings/index.ejs", { alllistings, category, search });
};
// Yeh wala function aapki controller file mein missing hai:
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};
// 2. SHOW ROUTE (Map + Nearby Listings)
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

    // Nearby Similar Listings (Optimization)
    let nearbyListings = [];
    if (listing.geometry && listing.geometry.coordinates) {
        nearbyListings = await Listing.find({
            _id: { $ne: listing._id }, 
            geometry: {
                $near: {
                    $geometry: listing.geometry,
                    $maxDistance: 50000 // 50km radius
                }
            }
        }).limit(3);
    }

    res.render("listings/show.ejs", { 
        listing, 
        nearbyListings,
        mapToken: process.env.MAP_TOKEN 
    });
};

// 3. CREATE ROUTE (Geocoding included)
module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    
    if (typeof req.file !== "undefined") {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    // Geometry data save
    if (response.body.features.length > 0) {
        newListing.geometry = response.body.features[0].geometry;
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// 4. EDIT FORM
module.exports.renderEditForm = async(req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, orignalImageUrl });
};

// 5. UPDATE ROUTE
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

// 6. DELETE ROUTE
module.exports.destroyListing = async(req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};