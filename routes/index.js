let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");
let Zone = require("../models/zone");
let ZonePrice = require("../models/zoneprice");
let Area = require("../models/area");
let request = require('request-promise');
let cheerio = require('cheerio');
const Url = "http://esf.fangdd.com/shanghai/xiaoqu_";
const areaUrlArr = ['s988','s977','s994','s993','s984','s986','s987','s978','s985','s990','s982','s992','s989','s979','s980','s991','s983'];
const areaName = ['宝山','闵行','浦东','松江','杨浦','普陀','嘉定','徐汇','闸北','奉贤','虹口','金山','青浦','长宁','静安','崇明','黄浦'];

mongoose.Promise = global.Promise;  
mongoose.connect('mongodb://localhost:27017/fddPrice');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getVillageInfo',async function(req,res){
	res.json("success");
	for(let i=0;i<areaUrlArr.length;i++){
		const now = new Date();
		console.log(now.getHours()+":"+now.getMinutes()+":"+now.getSeconds()+"  开始爬取 "+areaName[i]+"区");
		const areaPageUrl = Url+areaUrlArr[i]+"_ocost-desc";
		const areaPageInfo = await request(areaPageUrl);
		//const pages = villagePages(areaPageInfo);	
		var areaPriceArr = [];
		for(let j=1;j<=4;j++){
			const now = new Date();
			console.log(now.getHours()+":"+now.getMinutes()+":"+now.getSeconds()+"  开始爬取第"+j+"页...");
			const zonePageUrl = Url+areaUrlArr[i]+"_ocost-desc_pa"+j;
			const response = await request(zonePageUrl);
			const zones = everyVillageUrl(response);
			
			for(let k=0;k<zones.length;k++){		
					let options = {
						url : zones[k],
						timeout :2000,
						headers : {
							'User-Agent':'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3159.5 Safari/537.36'
						}
					}
					try{
					const zoneRep = await request(options);		//异常						
					const zoneInfo = zonesInfo(zoneRep);
					const zone = new Zone({
						district : zoneInfo.district,
						villageName : zoneInfo.villageName,
						villageKey : zoneInfo.villageKey,
						address : zoneInfo.address,
						villageX : zoneInfo.villageX,
						villageY : zoneInfo.villageY
					});
					const zoneSave = await zone.save();
					const priceMonthUrl = 'http://esf.fangdd.com/data/cell/price_history_trend?type=4&id='+zoneInfo.villageKey;
					const priceRep = await request({url:priceMonthUrl,timeout:2000});						
					const priceArr = getMonthPrice(priceRep);
					
					for(let i=0;i<priceArr.length;i++){
						const zoneprice = new ZonePrice({
							zone : zoneSave._id,
							time : priceArr[i].time,
							listedPrice : priceArr[i].listedPrice,
							currentPrice : priceArr[i].currentPrice,
							district : zoneInfo.district
						})
						const zonepriceSave = zoneprice.save();
					}
					
					let febPrice = priceArr[0].listedPrice;
					let julyPrice = priceArr[priceArr.length-1].listedPrice;
					areaPriceArr.push(julyPrice);
					if(febPrice!=0&&julyPrice!=0){
						const priceRate = ((julyPrice-febPrice)/febPrice*100).toFixed(3)+"%";
						await Zone.update({_id:zoneSave._id},{priceRate:priceRate});
					}else{
						await Zone.update({_id:zoneSave._id},{priceRate:"暂无数据"});
					}	
					}catch(e){
						console.log(e.messgae);
					}
			}
			
			const nowTime =new Date();
			console.log(nowTime.getHours()+":"+nowTime.getMinutes()+":"+nowTime.getSeconds()+"  第"+j+"页爬取结束");
		}
		
		let sum=0;
		for(let t=0;t<areaPriceArr.length;t++){
			sum = sum + Number(areaPriceArr[t]);
		}
		let avgPrice = Math.round(sum/areaPriceArr.length);
		const area = new Area({
			district : areaName[i],
			avgPrice : avgPrice
		})
		const areaSave = area.save();
		
		const nowDate =new Date();
		console.log(nowDate.getHours()+":"+nowDate.getMinutes()+":"+nowDate.getSeconds()+"  "+areaName[i]+"区爬取结束"+'\n');
	}
})

//获取区域均价
router.get('/areaPrice', async function(req,res){
	let data = await Area.find('avgPrice');
	res.json(data);
})


//获取前台传来的坐标，并在后台查找出对应的数据
router.post('/searchZone',async function(req,res){
	let bssw_lng = req.body.bssw_lng,
			bssw_lat = req.body.bssw_lat,
			bsne_lng = req.body.bsne_lng,
			bsne_lat = req.body.bsne_lat;
	let result = await Zone
									.where('villageX').gte(bssw_lng).lte(bsne_lng)
									.where('villageY').gte(bssw_lat).lte(bsne_lat);
	res.json(result);
					
})




//获取每个区小区的分页数
function villagePages(html){
	if(html){
		let $ = cheerio.load(html);
		const pageElem = $('.contain>.clearfix>.cell--result>.list-title>h4>span').text();
		let pages;
		if((pageElem/15)<100){
			pages = Math.ceil(pageElem/20);
		}else{
			pages = 100;
		}
		return pages;
	}
}
//获取每个小区的url
function everyVillageUrl(html){
	if(html){
		let $ = cheerio.load(html);
		let villageElem = $('.main>.cell--result>.cell--result--list>.cell--item');
		let villageInfo = [];
		villageElem.each(function(index,value){
			let elem = $(value);
			let villageUrl = elem.find('a').attr('href');
			villageInfo.push(villageUrl);
		})
		return villageInfo;
	}
}
//获取小区的所有信息
function zonesInfo(html){
	if(html){
		let $ = cheerio.load(html);
		let basicElem = $('.cell--detail--container>.main__cell__info>.right__cell__info>.cell__info--title');
		let villageName = basicElem.find('.cell__name').text();
		let district = $(basicElem.find('a')[0]).text()+"--"+$(basicElem.find('a')[1]).text();
		let address = $(basicElem.find('span')[2]).text();
//		let subwayElem = $('div>.cell--detail--container>.left-right-content>.left-side>.nearby__metro>.content>.station_item');
//		console.log(subwayElem.length);
//		let subway = subwayElem.find('.station_name').text()+"："+$(subwayElem.find('.subway_line>.line_no>a>span')[0]).text()+"号线"+$(subwayElem.find('.subway_line>.line_no>a>span')[1]).text();
		let scriptText = $($('script')[11]).html().trim();
		let villageKey = scriptText.substring(scriptText.indexOf("g_cell_id")+13,scriptText.indexOf("g_cell_name")-9);
		let position = scriptText.substring(scriptText.indexOf('g_cell_geo')+14,scriptText.indexOf('g_cell_price')-9);
		let posiArr = position.split(',');
		let villageY = posiArr[0],
				villageX = posiArr[1];
		
		let zoneObj = {
			district : district,
			villageName : villageName,
			villageKey : villageKey,
			address : address,
			villageX : villageX,
			villageY : villageY
		}
		return zoneObj;
	}
}

//获取每个小区一年来每个月的房价
function getMonthPrice(html){
	let $ = cheerio.load(html);
	let htmlText = $.html();
	let text = htmlText.replace(/&quot;/g,'"');
	let text2 = text.replace(/\\u6708/g,'月');
	let obj = text2.substring(text2.lastIndexOf("detail")+9,text2.lastIndexOf("name")-3);	//挂牌价
	let objArr = obj.split("},{");
	let obj2 = text2.substring(text2.indexOf("detail")+9,text2.indexOf("name")-3);				//成交均价
	let objArr2 = obj2.split("},{");
	var priceArr = [];
	for(let i=0;i<objArr.length;i++){
		let time = objArr[i].substring(objArr[i].indexOf("time_str")+11,objArr[i].indexOf("ancient_index")-3);
		let listedPrice = objArr[i].substring(objArr[i].indexOf("number")+8,objArr[i].indexOf("time_str")-2);	
		let currentPrice = objArr2[i].substring(objArr2[i].indexOf("number")+8,objArr2[i].indexOf("time_str")-2);
		let priceObj = {
			time :time,
			listedPrice : listedPrice,
			currentPrice : currentPrice
		}
		priceArr.push(priceObj);
	}
	return priceArr;
}

module.exports = router;
