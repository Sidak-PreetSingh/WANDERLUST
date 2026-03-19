const User = require("../models/user");

module.exports.renderSignupForm = (req,res)=>{
    res.render("users/signup.ejs");
};


module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Count existing accounts from same IP
        const existingIPUsers = await User.countDocuments({
            ipAddress: req.ip
        });

        // 🚫 BLOCK if too many accounts
        if (existingIPUsers >= 3) {
            req.flash("error", "Too many accounts created from this IP.");
            return res.redirect("/signup");
        }

        const newUser = new User({
            email,
            username,
            ipAddress: req.ip
        });

        // ⚠ Add suspicion score if nearing limit
        if (existingIPUsers === 2) {
            newUser.suspicionScore += 50;
            newUser.isFlagged = true;
        }

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};


module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
};



module.exports.login = async(req,res)=>{
    req.flash("success","Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};



module.exports.logout = (req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    });
};