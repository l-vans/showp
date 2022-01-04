/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
/*jshint esversion: 6 */
// "use strict";
var controller;
document.addEventListener('deviceready', onDeviceReady, false);



function onDeviceReady() {
	console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
	// Create the Shopper object for use by the HTML view
	controller = new Shopper();
	console.log("new controller created");
	// document.getElementById("searchPage").style.display='none';
	// document.getElementById("resultsPage").style.display='none';
	// location.href="#firstPage";
	// history.pushState(null, null, '#firstPage');
	// history.replaceState(null, null, '#firstPage');

}


//Model
function Shopper() {
	var fromA;
	var toB;
	var lati;
	var longi;
	var ak;
	// var loc;
	//var locTime;
	// var s_name;
	// var testers;
	var prodMark = new H.map.Icon("https://cdn4.iconfinder.com/data/icons/christmas-holidays-6/1400/65-1024.png" , { size: { w: 40, h: 40 } });
	var prods;
	
	$("#find_them").on("click", function(){
		updateMap();
	});

	$("#search_products").on("click", function() {
			prods = [];
			let search = $('#product').val();
			let s_ids = [];
			// var adds;
			let price = "Price: ";
			let prodName = "Product: ";
			var settings = {
				"url": "http://localhost/php_rest_showp/api/product/search.php?search=" + search,
				"method": "POST",
				"timeout": 0,
			};
			$.ajax(settings).done(function (response) {
				let r = response;
				prods = r.products;
				for (var i=0; i<r.products.length;i++){
					s_ids.push(r.products[i].store_id);
				}
				console.log(s_ids);
				getAddress(s_ids);
				// adds = getAddress(s_ids);
				// console.log(adds);
				
			});
			
	});
	
	function getAddress(sids){
		var current_adds = [];
		console.log(prods);
		
		for(var j = 0; j<sids.length; j++){
			let productName = prods[j].name;
			let productPrice = parseFloat(prods[j].price);
			let a = "";
			// let distance = "Distance: ";
			// let response1;
			
			let settings = {
				"url": "http://localhost/php_rest_showp/api/store/getAddress.php?id=" + sids[j],
				"method": "GET",
				"timeout": 0,
			};
			$.ajax(settings).done(function (response) {
				let storeName = response.a_name.toString();
				let html = '<div>Shop name: ' + storeName + '</div>' + '<div>Product: ' 
				+ productName + '</div>' + '<div>Price: £' + productPrice + '</div>';
				a = a.concat(response.street.toString()," ",response.city.toString()," ",
				response.county.toString(), " ",response.postcode.toString().replace('+',' '));
				a = a.replace('+', '');
				console.log(a);
				
				current_adds.push(a);
				console.log(a);
				var geode = {
					url: "https://geocode.search.hereapi.com/v1/geocode?q="+a+"&apiKey="+ak,
					method: "GET",
					"timeout": 0,
				};
				$.ajax(geode).done(function (response)
				{
					let pos = response.items[0].position;
					console.log(response.items[0]);
					console.log(pos);
					addInfoBubble(map, pos, html);	
				});	

					// console.log(loc);
			});
			
		}
		
	}
	
	function addMarkerToGroup(group, coordinate, html) {
		var marker = new H.map.Marker(coordinate, { icon: prodMark });
		// add custom data to the marker
		marker.setData(html);
		group.addObject(marker);
	}

	function addInfoBubble(map, points, html){
		var group = new H.map.Group();
		map.addObject(group);
		group.addEventListener('tap', function (evt) {
			// event target is the marker itself, group is a parent event target
			// for all objects that it contains
			// console.log((evt.target.$[0]) + ',' + (evt.target.$[1]));
			let A = fromA;
			
			toB = (evt.target.$[0] * -1) + ',' + (evt.target.$[1]);
			let B = toB;
			console.log(B);
			var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
			// read custom data
				content: evt.target.getData()
			});
			//add calculateRouteFromAtoB
			
			ui.addBubble(bubble);
			
			calculateRouteFromAtoB(platform, A, B);

		}, false);
		addMarkerToGroup(group,points,html)
	}

	function calculateRouteFromAtoB (platform,point1,point2) {

		fA = point1.lat + ',' + point1.lng;
		console.log(fA);
		toB = point2;
		// console.log(toB);
		var router = platform.getRoutingService(null, 8),
		routeRequestParams = {
			routingMode: 'fast',
			transportMode: 'pedestrian',
			origin: fA, 
			destination: toB,  
			return: 'polyline,turnByTurnActions,actions,instructions,travelSummary'
		};
		console.log(routeRequestParams);

		router.calculateRoute(
			routeRequestParams,
			onSuccess,
			onError
		);
	}
	function openBubble(position, text){
		if(!bubble){
			bubble =  new H.ui.InfoBubble(
			position,
			// The FO property holds the province name.
			{content: text});
			ui.addBubble(bubble);
		} else {
			bubble.setPosition(position);
			bubble.setContent(text);
			bubble.open();
		}
	}
	
	function onSuccess(result) {
		var route = result.routes[0];
		console.log(route);
		/*
		* The styling of the route response on the map is entirely under the developer's control.
		* A representitive styling can be found the full JS + HTML code of this example
		* in the functions below:
		*/
		addRouteShapeToMap(route);
		addManueversToMap(route);
		// addManueversToPanel(route);
		// addSummaryToPanel(route);
		// ... etc.
	}

	function onError(error) {
		alert('Can\'t reach the remote server');
	}

	function addRouteShapeToMap(route){
		route.sections.forEach((section) => {
		// decode LineString from the flexible polyline
		let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

		// Create a polyline to display the route:
		let polyline = new H.map.Polyline(linestring, {
			style: {
				lineWidth: 4,
				strokeColor: 'rgba(0, 128, 255, 0.7)'
			}
		});

		// Add the polyline to the map
		map.addObject(polyline);
		// And zoom to its bounding rectangle
		map.getViewModel().setLookAtData({
			bounds: polyline.getBoundingBox()
			});
		});
	}

	function addManueversToMap(route){
		var svgMarkup = '<svg width="18" height="18" ' +
		'xmlns="http://www.w3.org/2000/svg">' +
		'<circle cx="8" cy="8" r="8" ' +
		'fill="#1b468d" stroke="white" stroke-width="1"  />' +
		'</svg>',
		dotIcon = new H.map.Icon(svgMarkup, {anchor: {x:8, y:8}}),
		group = new  H.map.Group(),
		i,
		j;
		route.sections.forEach((section) => {
		let poly = H.geo.LineString.fromFlexiblePolyline(section.polyline).getLatLngAltArray();

		let actions = section.actions;
		// Add a marker for each maneuver
		for (i = 0;  i < actions.length; i += 1) {
			let action = actions[i];
			var marker =  new H.map.Marker({
        lat: poly[action.offset * 3],
        lng: poly[action.offset * 3 + 1]},
        {icon: dotIcon});
      marker.instruction = action.instruction;
      group.addObject(marker);
    }

    group.addEventListener('tap', function (evt) {
      map.setCenter(evt.target.getGeometry());
      openBubble(
         evt.target.getGeometry(), evt.target.instruction);
    }, false);

    // Add the maneuvers group to the map
    map.addObject(group);
  });
}


	
//Map functionality

	var BASE_GET_URL = "";
    var BASE_URL = BASE_GET_URL;
	
    // var meMarker; = 

	
	var icon1 = new H.map.DomIcon("<div>&#x1f4cd</div>");
	var icon2 = new H.map.DomIcon("<div>&#x1f4e6;</div>");
    var mapInterval;
    var destination;
    var marker;
    
	
	//step 1
	var platform = new H.service.Platform({
        // TODO: Change to your own API key or map will NOT work!
        apikey: "uGt32OzafRembxhANOFXMB0birrJLeAn6-qK8-xgD1Q",
    });
    var defaultLayers = platform.createDefaultLayers();
	//step 2
	var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 14,
            center: { lat: 52.5, lng: 13.4 },
        }
    );
	
	var locationsContainer = document.getElementById('panel');
	
    function updateMap() {
        function onSuccess(position) {
            console.log("Obtained position", position);
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };
			fromA = point;
			console.log(fromA);
			lati = position.coords.latitude;
			longi = position.coords.longitude;
            if (marker) {
                map.removeObject(marker);
            }
            if (bubble) {
                ui.removeBubble(bubble);
            }
            map.setCenter(point);

			var defMark = new H.map.Icon("https://cdn0.iconfinder.com/data/icons/transportation-328/24/walk-256.png" , { size: { w: 50, h: 50 } });
			marker = new H.map.Marker(point, { icon: defMark });
			map.addObject(marker);
			
        }
        function onError(error) {
            console.error("Error calling getCurrentPosition", error);
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    }
    // Update map on startup
    // updateMap();


    // if (cordova.platformId === "browser") {

    // }

	    // Initialize the platform object:

	ak = platform.c.a.apikey;
	console.log(ak);
    // Obtain the default map types from the platform object:

    // Instantiate (and display) a map object:

    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
	var bubble;

	
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    var behavior = new H.mapevents.Behavior(mapEvents);
	
	var geocoderService = platform.getGeocodingService();
	var searchService = platform.getSearchService();
	

}

