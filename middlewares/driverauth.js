const Driver=require('./../models/Driver');

let auth =(req,res,next)=>{
    let token =req.cookies.auth;
    Driver.findByToken(token,(err,driver)=>{
        if(err) throw err;
        if(!driver) return res.json({
            error :true
        });

        req.token= token;
        req.driver=driver;
        next();

    })
}

module.exports={auth};
