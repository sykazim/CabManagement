const mongoose = require('mongoose');

const CabCategory = mongoose.Schema({

    name:{type:String,unique:true,required:true},
    basefare:{type:Number,required:true},
    perkmprice :{type:Number,required:true}

});

module.exports = mongoose.model("category",CabCategory);