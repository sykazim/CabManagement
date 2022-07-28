const Rider=require('./../models/Rider');

let auth =(req,res,next)=>{
    let token =req.cookies.auth;
    Rider.findByToken(token,(err,rider)=>{
        if(err) throw err;
        if(!rider) return res.json({
            error :true
        });

        req.token= token;
        req.rider=rider;
        next();

    })
}

module.exports={auth};
