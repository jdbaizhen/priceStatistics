var mongoose = require('mongoose');
var areaSchema = require('../schemas/area');
var Area = mongoose.model('Area',areaSchema);

module.exports = Area;
