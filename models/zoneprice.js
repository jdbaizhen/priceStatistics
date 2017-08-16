var mongoose = require("mongoose");
var zonepriceSchema = require("../schemas/zoneprice");
var ZonePrice = mongoose.model('ZonePrice',zonepriceSchema);

module.exports = ZonePrice;