var mongoose = require("mongoose");
var zoneSchema = require("../schemas/zone");
var Zone = mongoose.model('Zone',zoneSchema);

module.exports = Zone;