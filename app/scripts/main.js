/*global google, ko */

/*
* this works for first load
* but does not detect disconnects later
*
* I hope that this is enough disconnect logic
* https://discussions.udacity.com/t/need-help-using-offline-js/26091/9
*/
if (typeof google === 'object' && typeof google.maps === 'object') {
  // Google maps loaded

} else {
  // Failed to load the Google Maps
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

var myPlaces = ko.observableArray([
  /*
  * now the data comes from Foursquare
  */
]);

var popupController = {
  places: null,
  lastOpenI: null,
  lastOpenM: null,
  isOpen: false,

  init: function() {
    'use strict';
    this.places = myPlaces;
  },

  myClick: function(marker, infoWindow) {
    'use strict';
    if (this.isOpen) {
      this.lastOpenI.close(mapGlobal, this.lastOpenM);
    }
    infoWindow.open(mapGlobal, marker);
    this.isOpen = true;
    this.lastOpenI = infoWindow;
    this.lastOpenM = marker;

    var mLatLong = marker.getPosition();
    mapGlobal.setCenter(mLatLong);
  }
};

var mapModel = {
  map: null,
  mapOptions: mapOptions,
  places: myPlaces,

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

    this.locationData = mapModel.getPlaces();
    for (var i = 0; i < this.locationData().length; i++) {
      var l = this.locationData()[i];
      this.searchResults.push(l.name);

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

    return matchingLocations;
  }
};

var fetchData = {
  fetch: function() {
    'use strict';

    var lClientId = 'DCCR0NACVZOUAFB15HNOG3ULSY25I42PUZFK5D5K1X3V4BXM';
    var lSecretId = 'FUZTLZ2FC0Q3OIXE0WIS2ETHQ3XUBT22PKOXFVVCF1RXQQHE';

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
        var obj = {
          name: i.venue.name,
          details: i.venue.url + ' : ' + i.venue.rating +
              ' : ' + i.tips[0].text,
          url: i.venue.url,
          rating: i.venue.rating,
          tip: i.tips[0].text,
          lat: i.venue.location.lat,
          longi: i.venue.location.lng
        };
        myPlaces().push(obj);
      }); //end forEach

      if (myPlaces().length < 1) {
        console.log('error block 1');
        $('#myModal').modal();
      }

    }).error(function() {
      console.log('error block 2');

      $('#myModal').modal();
    }).always(function() {
      searchController.init();
    });

  }

};

google.maps.event.addDomListener(window, 'load', fetchData.fetch());

ko.applyBindings(searchController);
