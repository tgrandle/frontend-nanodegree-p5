/*global google, ko */

/*
* this works for first load
* but does not detect disconnects later
*
* I hope that this is enough disconnect logic
* https://discussions.udacity.com/t/need-help-using-offline-js/26091/9
*/
if (typeof google !== 'object' || typeof google.maps !== 'object') {
  // Failed to load Google Maps
  console.log('google failed to load');
  $('#myModal').modal();
}

var sanDiegoLatlng = new google.maps.LatLng(32.7337316, -117.1931538);
var mapOptions = {
  center: sanDiegoLatlng,
  zoom: 12
};

var mapGlobal = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

function Place(name, url, rating, tip, lat, longi) {
  'use strict';
  this.name = name;
  this.url = url;
  this.rating = rating;
  this.tip = tip;
  this.lat = lat;
  this.longi = longi;
  this.marker = '';
  this.infoWindow = '';
  this.location = '';
}

var popupController = {
  lastOpenI: null,
  lastOpenM: null,
  isOpen: false,

  init: function() {
    'use strict';
  },

  myClick: function(marker, infoWindow) {
    'use strict';
    if (this.isOpen) {
      this.lastOpenI.close(mapGlobal, this.lastOpenM);
      this.lastOpenM.setAnimation(google.maps.Animation.NONE);
    }
    infoWindow.open(mapGlobal, marker);
    this.isOpen = true;
    this.lastOpenI = infoWindow;
    this.lastOpenM = marker;

    var mLatLong = marker.getPosition();
    mapGlobal.setCenter(mLatLong);
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
};

var PlacesController = {
  places: ko.observableArray([]),

  gotClick: function(place) {
    'use strict';
    var m = place.marker;
    var i = place.infoWindow;
    popupController.myClick(m, i);
  }

};

var mapModel = {
  map: null,
  mapOptions: mapOptions,
  places: PlacesController.places,

  init: function() {
    'use strict';

    this.map = mapGlobal;

    this.places().forEach(function(p) {
      var newLatLng = new google.maps.LatLng(p.lat, p.longi);
      p.location = newLatLng;
      var newMarker = new google.maps.Marker({
        position: newLatLng,
        map: mapGlobal,
        title: p.name,
        animation: null
      });
      p.marker = newMarker;

      var markerHtml = '';
      if (typeof p.tip !== 'undefined') {
        markerHtml = '<div class="marker"><h4>' + p.name +
            '</h4><div><p class="hidden-xs hidden-sm">' +
            '<i>' + p.tip + '</i>' + '<br />Rating: ' + p.rating +
            '<br /></p><a href="' + p.url +
            '">' + p.url + '</a></div></div>';
      }else {
        console.log('check ' + p.name);
      }

      var newInfoWindow = new google.maps.InfoWindow({
        content: markerHtml
      });
      p.infoWindow = newInfoWindow;

      new google.maps.event.addListener(newMarker, 'click', function() {
        popupController.myClick(newMarker, newInfoWindow);
      });
    });

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

var searchController = {
  locationData: null,
  searchResults: ko.observableArray(null),
  searchFilter: '',
  markerArray: [],

  init: function() {
    'use strict';
    mapModel.init();
    popupController.init();

    this.locationData = PlacesController.places;
    for (var i = 0; i < this.locationData().length; i++) {
      var l = this.locationData()[i];
      this.searchResults.push(l);

      this.markerArray.push(l);
    }

  },

  setMap: function(newMap) {
    'use strict';
    this.markerArray.forEach(function(m) {
      m.marker.setMap(newMap);
    });
  },

  filterList: function() {
    'use strict';
    var matches = this.filterBySearchFilter();
    this.searchResults(matches);

  },

  filterBySearchFilter: function() {
    'use strict';
    var matchingLocations = [];
    var matchingFullObj = [];

    for (var i = 0; i < this.locationData().length; i++) {
      if (this.locationData()[ i ].name.toLowerCase().search(
          this.searchFilter.toLowerCase()) !== -1) {
        matchingLocations.push(this.locationData()[ i ].name);

        matchingFullObj.push(this.locationData()[ i ]);
      }
    }

    this.setMap(null);
    matchingFullObj.forEach(function(q) {
      q.marker.setMap(mapGlobal);
    });

    return matchingFullObj;
  }
};

var fetchData = {
  fetch: function() {
    'use strict';

    var lClientId = 'removed';
    var lSecretId = 'removed';

    var url = 'https://api.foursquare.com/v2/venues/explore' +
      '?client_id=' + lClientId +
      '&client_secret=' + lSecretId +
      '&v=20130815' +
      '&ll=' + sanDiegoLatlng.toUrlValue() +
      '&query=taco';

    // for testing
    // var urlMock = 'http://www.mocky.io/v2/55affffee37b457f13e77bd0';

    $.ajax({
      url: url,
      dataType: 'json',
      timeout: 3000 //3 seconds
    }).done(function(data) {
      data.response.groups[0].items.forEach(function(i) {
        var obj3 = new Place(i.venue.name, i.venue.url, i.venue.rating,
            i.tips[0].text, i.venue.location.lat, i.venue.location.lng);
        PlacesController.places().push(obj3);
      }); //end forEach

      if (PlacesController.places().length < 1) {
        console.log('error block 1');
        $('#myModal').modal();
      }

    }).error(function() {
      console.log('error block 2');

      $('#myModal').modal();
    }).always(function() {
      searchController.init();
      ko.applyBindings(searchController);
    });

  }

};

google.maps.event.addDomListener(window, 'load', fetchData.fetch());

// ko bindings are inside the fetch ajax .always()
