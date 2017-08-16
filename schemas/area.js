var mongoose = require('mongoose');
var areaSchema = new mongoose.Schema({
	district : String,
	avgPrice : Number
})

module.exports = areaSchema;