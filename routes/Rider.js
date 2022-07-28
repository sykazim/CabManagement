const express = require("express");
const Rider = require("../models/Rider")
const {route} =  require("express/lib/application")

const router = express.Router();

//getting all the riders

router.get("/riders",async(req,res) =>{

    try{
    const Riders = await Rider.find();
    res.send(Riders);
    }
    catch(error){
        res.send(error)
    }
});

//getting a particular rider

router.get("/riders/:email",async(req,res)=>{

    const eml = req.params.email;
    console.log(eml);

    try{
       const ri = await Rider.find({
        "$or":[
            {
                email: eml
            }
        ]
       });
       res.send(ri);

    }
    catch(error){
        console.log(error);
        res.send(error);
    }

});


//creating a rider

router.post("/riders",async(req,res)=>{

    const rider = Rider.create(req.body);
    res.json(rider);
});


module.exports = router;