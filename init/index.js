const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const initdb = async () => {
    await Listing.deleteMany({});
    const seedData = initdata.data.map((obj) => ({
        ...obj, 
        owner: "698b2d12926bcf5a09944515",
        category: obj.category || "Trending",
        geometry: obj.geometry || {
            type: "Point",
            coordinates: [77.2090, 28.6139]
        }
    }));
    await Listing.insertMany(seedData);
    console.log("data was initialized");
};

module.exports = { initdb };

// const mongoose = require("mongoose");
// const initdata = require("./data.js");
// const Listing = require("../models/listing.js");

// main()
//     .then(()=>{
//         console.log("connected to db");
//     })
//     .catch((err)=>{
//         console.log(err)
//     });

// async function main(){
//     await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
// }  

// const initdb = async () => {
//     await Listing.deleteMany({});
    
//     // Use 'initdata' (all lowercase) to match your require statement
//     initdata.data = initdata.data.map((obj) => ({
//         ...obj, 
//         owner: "698b2d12926bcf5a09944515"
//     }));
    
//     await Listing.insertMany(initdata.data);
//     console.log("data was initialized");
// };
// initdb();
