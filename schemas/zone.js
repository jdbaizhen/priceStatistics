var mongoose = require("mongoose");
var zoneSchema = new mongoose.Schema({
	district : String,
	villageName: String,
	villageKey : String,
	address : String,
	villageX : Number,
	villageY : Number,
	priceRate : {type : Object},
	priceRateOneY : Number,
	priceRateTwoY : Number,
	priceRateThreeY : Number
})


module.exports = zoneSchema;
