const mongoose = require("mongoose");
const express = require("express");
const coursesRouter = require("./routes/Rider")

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const riderauth =require('./middlewares/riderauth');
const driverauth =require('./middlewares/driverauth');
const Rider = require("./models/Rider");
const Driver = require("./models/Driver")



const app = express();

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(cookieParser());
//middleware
app.use('/cabBooking',coursesRouter);


const dbUrl = ""

const connectionParams = {
    useNewUrlParser:true,
    useUnifiedTopology:true
}

mongoose.connect(dbUrl,connectionParams).then(()=>{
    console.info("connected to the DB");
}).catch((e)=>{
    console.log("error:",e);

});




// adding new rider/driver (sign-up route)
app.post('/api/register',function(req,res){

    // taking a rider
    if(req.body.usertype === 'rider'){
    //const newrider=new Rider(req.body);
    const newrider = new Rider({
        firstname:req.body.firstname,
        lastname:req.body.lastname,
        email:req.body.email,
        mobile:req.body.mobile,
        password:req.body.password});

        //console.log(testrider);
 
    
    Rider.findOne({email:newrider.email},function(err,rider){
        if(rider) return res.status(400).json({ auth : false, message :"email exits"});
 
        newrider.save((err,doc)=>{
            if(err) {console.log(err);
                return res.status(400).json({ success : false});}
            res.status(200).json({
                succes:true,
                rider : doc
            });
        });
    });
    }
    else{
        //taking a driver

        const newdriver = new Driver({
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            mobile:req.body.mobile,
            password:req.body.password,
            vehicleno:req.body.vehicleno,
            latitude:"",
            longitude:"",
            available:"yes"
            });
            
            //console.log(testrider);
     
        
        Driver.findOne({email:newdriver.email},function(err,driver){
            if(driver) return res.status(400).json({ auth : false, message :"email exits"});
     
            newdriver.save((err,doc)=>{
                if(err) {console.log(err);
                    return res.status(400).json({ success : false});}
                res.status(200).json({
                    succes:true,
                    driver : doc
                });
            });
        });

    }
 });


 // login rider/driver
app.post('/api/login', function(req,res){
    if(req.body.usertype === 'rider'){

    let token=req.cookies.auth;
    Rider.findByToken(token,(err,rider)=>{
        if(err) return  res(err);
        if(rider) return res.status(400).json({
            error :true,
            message:"You are already logged in"
        });
    
        else{
            Rider.findOne({'email':req.body.email},function(err,rider){
                if(!rider) return res.json({isAuth : false, message : ' Auth failed ,email not found'});
        
                rider.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.json({ isAuth : false,message : "password doesn't match"});
        
                    rider.generateToken((err,rider)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',rider.token).json({
                        isAuth : true,
                        id : rider._id
                        ,email : rider.email
                    });
                });    
            });
          });
        }
    });
}
else{

    let token=req.cookies.auth;
    Driver.findByToken(token,(err,driver)=>{
        if(err) return  res(err);
        if(driver) return res.status(400).json({
            error :true,
            message:"You are already logged in"
        });
    
        else{
            Driver.findOne({'email':req.body.email},function(err,driver){
                if(!driver) return res.json({isAuth : false, message : ' Auth failed ,email not found'});
        
                driver.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.json({ isAuth : false,message : "password doesn't match"});
        
                    driver.generateToken((err,driver)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',driver.token).json({
                        isAuth : true,
                        id : driver._id
                        ,email : driver.email
                    });
                });    
            });
          });
        }
    });

}

});
 


//logout rider
app.get('/api/rider/logout',riderauth.auth,function(req,res){
    req.rider.deleteToken(req.token,(err,rider)=>{
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    });

}); 

//logout driver
app.get('/api/driver/logout',driverauth.auth,function(req,res){
    req.driver.deleteToken(req.token,(err,driver)=>{
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    });

});




app.listen(2000,()=>{
    console.log("server is running");
});

