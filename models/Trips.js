const mongoose = require('mongoose');

const Trips = mongoose.Schema({

    driver_email:String,
    rider_email:String,
    start_location:String,
    end_location:String,
    status:String,
    price:Number

});

module.exports = mongoose.model("trips",Trips);