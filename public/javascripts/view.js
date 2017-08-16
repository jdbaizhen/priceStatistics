$(function(){

	$('#btn').click(function(){

			$.get('/getVillageInfo',function(data){
				console.log();
			})

		return false;
	})
	
	
	
	var map = new BMap.Map("container");          				// 创建地图实例  
	var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
	var top_left_navigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
	
	/*缩放控件type有四种类型:
	BMAP_NAVIGATION_CONTROL_SMALL：仅包含平移和缩放按钮；BMAP_NAVIGATION_CONTROL_PAN:仅包含平移按钮；BMAP_NAVIGATION_CONTROL_ZOOM：仅包含缩放按钮*/
	
	//添加控件和比例尺
	function add_control(){
		map.addControl(top_left_control);        
		map.addControl(top_left_navigation);     
	}
	add_control();
	map.enableScrollWheelZoom(true);							//控制地图缩放
	map.addControl(new BMap.MapTypeControl());   				//添加地图类型控件
	map.centerAndZoom("上海", 12);//通过设置城市来访问地图
	map.addEventListener("tilesloaded",function(){
		var getZoom = map.getZoom();
		if(getZoom>11 && getZoom<14){
			map.clearOverlays();
			var areaPoint = [
							 {area:"宝山区",x:121.487639,y:31.41195},
							 {area:"闵行区",x:121.387604,y:31.118592},
							 {area:"浦东区",x:121.54973,y:31.227597},
							 {area:"松江区",x:121.234676,y:31.040406},
							 {area:"杨浦区",x:121.531908,y:31.266374},
							 {area:"普陀区",x:121.403989,y:31.256002},
							 {area:"嘉定区",x:121.270321,y:31.380386},
							 {area:"徐汇区",x:121.443011,y:31.195045},
							 {area:"闸北区",x:121.461239,y:31.28946},
							 {area:"奉贤区",x:121.47959,y:30.926475},
							 {area:"虹口区",x:121.510636,y:31.270571},
							 {area:"金山区",x:121.349659,y:30.748865},
							 {area:"青浦区",x:121.133491,y:31.156177},
							 {area:"长宁区",x:121.429573,y:31.227844},
							 {area:"静安区",x:121.453072,y:31.234082},
							 {area:"崇明区",x:121.403414,y:31.628657},
							 {area:"黄浦区",x:121.491304,y:31.238281}
							];
			$.get('/areaPrice',function(data){
				for(var i=0;i<areaPoint.length;i++){
					var point = new BMap.Point(areaPoint[i].x, areaPoint[i].y);
					var circle = new BMap.Circle(point,
                                 2500,{
                                 strokeColor:"#FF9800", //原型边框颜色
                                 strokeWeight:2, 
                                 strokeOpacity:0.3,
                                 fillColor:'skyblue'}); //创建圆

								var opts = {
								 	position : point,    // 指定文本标注所在的地理位置
								 	offset   : new BMap.Size(-25,-20)    //设置文本偏移量
								}
								var label = new BMap.Label(areaPoint[i].area+"</br>"+data[i].avgPrice+"/㎡", opts);  // 创建文本标注对象
									label.setStyle({
									color : "#000",
								    backgroundColor:'transparent',//文本背景色
							        borderColor:'transparent',//文本框边框色
									fontSize : "16px",
									height : "20px",
									lineHeight : "20px",
									fontFamily:"微软雅黑"
									
								});
				map.addOverlay(circle);
				map.addOverlay(label); 		
				circle.addEventListener('click',function(){
					map.centerAndZoom(point,15);
				})
				}
			})
		}else if(getZoom>13){
			map.clearOverlays();
			var bs = map.getBounds();   							//获取可视区域
			var bssw = bs.getSouthWest();   						//可视区域左下角
			var bsne = bs.getNorthEast();  							//可视区域右上角
			$.post('/searchZone',
				{
					bssw_lng : bssw.lng,
					bssw_lat : bssw.lat,
					bsne_lng : bsne.lng,
					bsne_lat : bsne.lat
				},function(data){
					data.forEach(function(value,index){
						// 复杂的自定义覆盖物
					    function ComplexCustomOverlay(point, text, mouseoverText){
					      this._point = point;
					      this._text = text;
					      this._overText = mouseoverText;
					    }
					    ComplexCustomOverlay.prototype = new BMap.Overlay();
					    ComplexCustomOverlay.prototype.initialize = function(map){
					      this._map = map;
					      var div = this._div = document.createElement("div");
					      div.style.position = "absolute";
					      div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
					      div.style.backgroundColor = "#EE5D5B";
					      div.style.border = "1px solid #BC3B3A";
					      div.style.color = "white";
					      div.style.height = "18px";
					      div.style.padding = "2px";
					      div.style.lineHeight = "18px";
					      div.style.whiteSpace = "nowrap";
					      div.style.MozUserSelect = "none";
					      div.style.fontSize = "12px"
					      var span = this._span = document.createElement("span");
					      div.appendChild(span);
					      span.appendChild(document.createTextNode(this._text));      
					      var that = this;
					
					      var arrow = this._arrow = document.createElement("div");
					      
					      arrow.style.position = "absolute";
					      arrow.style.width = "11px";
					      arrow.style.height = "10px";
					      arrow.style.top = "22px";
					      arrow.style.left = "10px";
					      arrow.style.overflow = "hidden";
					      div.appendChild(arrow);
					     
					      var opts = {
					      	  position : point,    // 指定文本标注所在的地理位置
							  offset   : new BMap.Size(5,-20),    //设置文本偏移量
							  width : 200,     // 信息窗口宽度
							  height: 100,     // 信息窗口高度
							  title : value.villageName , // 信息窗口标题
							  enableMessage:true//设置允许信息窗发送短息
						  }
					     	
						  var infoWindow = new BMap.InfoWindow("区域   :   "+value.district+"</br>"+
																 "地址   :   " +value.address+"</br>"+
																  "增幅   :   "+value.priceRate, opts);  // 创建信息窗口对象
					     
					      div.onmouseover = function(){
					        this.style.backgroundColor = "#6BADCA";
					        this.style.borderColor = "#0000ff";
					       	this.style.cursor = "pointer";  
					       	arrow.style.backgroundPosition = "0px -20px";
					      }
							
						  div.onclick = function(){
						  	map.openInfoWindow(infoWindow,point); //开启信息窗口
						  }
					
					      div.onmouseout = function(){
					        this.style.backgroundColor = "#EE5D5B";
					        this.style.borderColor = "#BC3B3A";   
					        arrow.style.backgroundPosition = "0px 0px";
					      }
					      map.getPanes().labelPane.appendChild(div);
					      return div;
					    }
					    ComplexCustomOverlay.prototype.draw = function(){
					      var map = this._map;
					      var pixel = map.pointToOverlayPixel(this._point);
					      this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
					      this._div.style.top = pixel.y - 30 + "px";
					     }
					    var point = new BMap.Point(value.villageX,value.villageY);
					    var myCompOverlay = new ComplexCustomOverlay(point,value.villageName);
						map.addOverlay(myCompOverlay);
					})
				})	
			}else{
				map.clearOverlays();
			}
		});
})
