const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Import the whole module
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    isFlagged: {
        type: Boolean,
        default: false
    },
    suspicionScore: {
    type: Number,
    default: 0
    }
});

// We extract the function manually to ensure it is NOT an object
const plugin = typeof passportLocalMongoose === 'function' 
               ? passportLocalMongoose 
               : passportLocalMongoose.default;

userSchema.plugin(plugin);

module.exports = mongoose.model("User", userSchema);