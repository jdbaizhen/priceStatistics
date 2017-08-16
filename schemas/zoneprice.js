var mongoose = require('mongoose');
var zonepriceSchema = new mongoose.Schema({
	zone : {
		type :mongoose.Schema.Types.ObjectId,
		ref : "Zone"
	},
	time : String,
	listedPrice : Number,	//挂牌均价
	currentPrice : Number,	//成交均价		
	district : String
})

module.exports = zonepriceSchema;