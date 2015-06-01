/*global google, ko */

var sanDiegoLatlng = new google.maps.LatLng(32.7337316, -117.1931538);
var mapOptions = {
  center: sanDiegoLatlng,
  zoom: 12
};
var myPlaces = [
  {
    name: 'Lucha Libre Taco Shop',
    lat: '32.743265',
    longi: '-117.181573',
    location: null,
    infoWindow: null,
    marker: null
  },
  {
    name: 'Wahoo\'s Fish Taco',
    lat: '32.755827',
    longi: '-117.221982',
    location: null,
    infoWindow: null,
    marker: null
  },
  {
    name: 'Taco Express',
    lat: '32.719245',
    longi: '-117.166649',
    location: null,
    infoWindow: null,
    marker: null
  },
  {
    name: 'Roberto\'s Taco Shop',
    lat: '32.755717',
    longi: '-117.134002',
    location: null,
    infoWindow: null,
    marker: null
  },
  {
    name: 'La Playa Taco Shop',
    lat: '32.789505',
    longi: '-117.252987',
    location: null,
    infoWindow: null,
    marker: null
  }
];

var mapModel = {
  map: null,
  mapOptions: mapOptions,
  places: myPlaces,

  init: function() {
    'use strict';
    this.map = new google.maps.Map(document.getElementById('map-canvas'),
      this.mapOptions);

    for (var i = 0; i < this.places.length; i++) {
      var p = this.places[i];
      var newLatLng = new google.maps.LatLng(p.lat, p.longi);
      p.location = newLatLng;
      var newMarker = new google.maps.Marker({
        position: newLatLng,
        map: this.map,
        title: p.name,
        animation: null
      });
      p.marker = newMarker;

      var newInfoWindow = new google.maps.InfoWindow({
        content: '<p>' + p.name + '</p>'
      });
      p.infoWindow = newInfoWindow;

    }
  },
  getMap: function() {
    'use strict';
    return this.map;
  },
  getPlaces: function() {
    'use strict';
    return this.places;
  }
};

var popupController = {
  init: function() {
    'use strict';
    mapModel.places.forEach(function(p) {
      var myMarker = p.marker;
      var myInfo = p.infoWindow;
      google.maps.event.addListener(myMarker, 'click', function() {
        myInfo.open(mapModel.map, myMarker);
      });
    });
  }
};
var mapController = {
  locationData: ko.observableArray(null),
  searchResults: ko.observableArray(null),
  searchFilter: '',

  init: function() {
    'use strict';
    mapModel.init();

    this.locationData = ko.observableArray(mapModel.getPlaces());
    for (var i = 0; i < this.locationData().length; i++) {
      var l = this.locationData()[i];
      this.searchResults().push(l.name);
    }

    popupController.init();
  },

  filterList: function() {
    'use strict';
    var matches = this.filterBySearchFilter();
    this.searchResults(matches);

  },

  filterBySearchFilter: function() {
    'use strict';
    var matchingLocations = [];

    for (var i = 0; i < this.locationData().length; i++) {
      if (this.locationData()[ i ].name.toLowerCase().search(
          this.searchFilter.toLowerCase()) !== -1) {
        matchingLocations.push(this.locationData()[ i ].name);
      }
    }
    return matchingLocations;
  },

  getMap: function() {
    'use strict';
    return mapModel.getMap();
  }
};

google.maps.event.addDomListener(window, 'load', mapController.init());

ko.applyBindings(mapController);
