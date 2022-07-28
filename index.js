const mongoose = require("mongoose");
const express = require("express");
const coursesRouter = require("./routes/Rider")

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const riderauth =require('./middlewares/riderauth');
const Rider = require("./models/Rider")



const app = express();

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(cookieParser());
//middleware
app.use('/cabBooking',coursesRouter);


const dbUrl = "mongodb+srv://syedkazim:syedkazim@cluster0.kmwfn1h.mongodb.net/?retryWrites=true&w=majority"

const connectionParams = {
    useNewUrlParser:true,
    useUnifiedTopology:true
}

mongoose.connect(dbUrl,connectionParams).then(()=>{
    console.info("connected to the DB");
}).catch((e)=>{
    console.log("error:",e);

});




// adding new rider (sign-up route)
app.post('/api/register',function(req,res){
    // taking a rider
    const newrider=new Rider(req.body);
    console.log(newrider);
 
    
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
 });


 // login rider
app.post('/api/login', function(req,res){
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
});
 


//logout rider
app.get('/api/logout',riderauth,function(req,res){
    req.rider.deleteToken(req.token,(err,rider)=>{
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    });

}); 




app.listen(2000,()=>{
    console.log("server is running");
});

