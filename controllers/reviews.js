const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.createReview = async (req, res) => {

    // 🔥 FRAUD DETECTION LOGIC START
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentReviews = await Review.countDocuments({
        author: req.user._id,
        createdAt: { $gte: oneMinuteAgo }
    });

    if (recentReviews >= 5) {
        req.flash("error", "Suspicious activity detected! Too many reviews.");
        return res.redirect("back");
    }
    // 🔥 FRAUD DETECTION LOGIC END


    const listing = await Listing.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;

    listing.reviews.push(review);

    await review.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull: {reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
     req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
   }