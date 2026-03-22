if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const {MongoStore} = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

 const dbUrl = process.env.ATLASDB_URL;

const Listing = require("./models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });



main()
    .then(()=>{
        console.log("connection successfull");
    })
    .catch((err)=>{
        console.log("error");
    });
async function main(){
    await mongoose.connect(dbUrl);
}


// //remove krna hain  
// async function main(){
//     await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");

//     console.log("Updating listings with missing geometry...");

//     const listings = await Listing.find({ geometry: { $exists: false } });

//     for (let listing of listings) {
//         try {
//             let response = await geocodingClient.forwardGeocode({
//                 query: `${listing.location}, ${listing.country}`,
//                 limit: 1
//             }).send();

//             listing.geometry = response.body.features[0].geometry;
//             await listing.save();

//             console.log(`Updated: ${listing.title}`);
//         } catch (err) {
//             console.log(`Error updating ${listing.title}`);
//         }
//     }

//     console.log("All listings updated!");
// }





app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => { // Add 'err' as a parameter
    console.log("Error in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
};


// app.get("/",(req,res)=>{
//     res.send("Hi i am root");
// });


app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null; // Adding '|| null' ensures the variable always "exists"
    next();
});


// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username:"delta-student",
//     });

//     let registeredUser = await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// })













app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);





// app.get("/testListing",async (req,res)=>{
//     let sampleListing = new Listing({
//         title:"My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successfull testing");
// });

// idhar agar koi default page  mein bhej diya request to 
app.use((req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});



app.use((err,req,res,next)=>{
    let {status = 500,message="Something went wrong!"}=err;
    res.status(status).render("error.ejs",{message});
    // res.status(status).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
}); 