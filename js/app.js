/**
 * Created by lw3111 on 2/16/2017.
 */
//Global variables
var map;

//viewModel

//Initialize Google Mpas with school locations

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: {
            lat: 37.33747,
            lng: -122.06025
        },
        disableDedfaultUI: true
    });

    ko.applyBindings(new AppViewModel());
}

//fallback function when google maps fails loading
function googleError() {
    //alert('Google Maps API Error! No Response.')
    document.getElementById('map').innerHTML = "<h3>Google Maps fails loading. Please refresh later.</h3>";

}

//School Constructor
var School = function (data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.lat = ko.observable(data.lat);
    self.lng = ko.observable(data.lng);
    self.yelpId = ko.observable(data.yelpId);
    self.marker = ko.observable();
    self.address = ko.observable("");
    self.phone = ko.observable("");
    self.rating = ko.observable();
    self.rating_img_url = ko.observable("");
    self.yelp_url = ko.observable("");
    self.snippet_text = ko.observable("");

};

//App ViewModel Constructor
var AppViewModel = function () {
    var self = this;

    //create a schoolList Array
    self.schoolList = ko.observableArray();

    //add school objects in schoolList Arrary from Schools JSON file(data.js)
    for (var i = 0; i < schools.length; i++) {
        self.schoolList.push(new School(schools[i]));
    }

    //console.log(self.schoolList);

    //Initialize the Google maps marker & infowindow
    var infoWindow = new google.maps.InfoWindow({maxWidth: 200});
    var marker;

    self.schoolList().forEach(function (school) {



        //google maps marker for each school
        marker = new google.maps.Marker({
            map: map,
            position: {lat: school.lat(), lng: school.lng()},
            title: school.name(),
            animation: google.maps.Animation.Drop
        });
        school.marker = marker;

        //Make Ajax request to Yelp API credit: https://discussions.udacity.com/t/how-to-make-ajax-request-to-yelp-api/13699/5

        /**
        * Generates a random number and returns it as a string for OAuthentication
        * @return {string}
        */
        function nonce_generate() {
          return (Math.floor(Math.random() * 1e12).toString());
        }

        var yelp_url = 'https://api.yelp.com/v2/business/' + school.yelpId();

        YELP_KEY = "mlYXqKDTHa-J2kHR2tb3Ww";
        YELP_TOKEN = "MzcTqWtp9ew_gm_9urvcqaJHKzkg7NSJ";
        YELP_KEY_SECRET = "etJcH-gftUlCVssLg9Tj16g7CyQ";
        YELP_TOKEN_SECRET = "OrD0TNRx3C0QXhC4AtNDHjjYLf4";


        var parameters = {
          oauth_consumer_key: YELP_KEY,
          oauth_token: YELP_TOKEN,
          oauth_nonce: nonce_generate(),
          oauth_timestamp: Math.floor(Date.now()/1000),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_version : '1.0',
          callback: 'cb'              // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
        };

        var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, YELP_KEY_SECRET, YELP_TOKEN_SECRET);
        parameters.oauth_signature = encodedSignature;

        $.ajax({
          url: yelp_url,
          data: parameters,
          cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
          dataType: 'jsonp',
          success: function(result) {

              var location = result.hasOwnProperty('location') ? result.location : '';
              if (location.hasOwnProperty('display_address')) {
                  school.address(location.display_address.join() || '');
              }

              var phone = result.hasOwnProperty('display_phone') ? result.display_phone : '';
              school.phone(phone || '');

              var rating = result.hasOwnProperty('rating') ? result.rating : '';
              school.rating(rating || 'none');

              var rating_img_url = result.hasOwnProperty('rating_img_url')? result.rating_img_url : '';
              school.rating_img_url(rating_img_url || '');

              var yelp_url = result.hasOwnProperty('url') ? result.url : '';
              school.yelp_url(yelp_url || '');

              var snippet_text = result.hasOwnProperty('snippet_text') ? result.snippet_text : '';
              school.snippet_text(snippet_text || '');

              console.log(school.yelp_url());
              infoContent = '<div id="infoWindow"><h4>' + school.name() + '</h4><div id="rating-img"><img src="' + school.rating_img_url +
                        '"></div> <div> <span class="glyphicon glyphicon-phone-alt">  ' + school.phone() +
                        '</span></div><div> <span class="glyphicon glyphicon-home">  ' + school.address() +
                        '</span></div><br/><p class="text-muted"><span class="glyphicon glyphicon-comment"></span>  ' +
                        school.snippet_text() + '(<a target="_blank" href="' + school.yelp_url() + '">Read More</a>)</p></div>';

              //Google maps event listener
              google.maps.event.addListener(school.marker, 'click', function () {
                    infoWindow.open(map, school.marker);
                    school.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function () {
                        school.marker.setAnimation(null);
                    }, 1400);
                    infoWindow.setContent(infoContent);
              });
          },
          error: function(error) {
              infoWindow.setContent('<h4>Yelp Request is unavailable. Please try again later.</h4>h5');
          }
        });



    });

    //click the school name in the list to triggle the marker to bounce and show infowindow
    self.showInfoWindow = function (school) {
        google.maps.event.trigger(school.marker, 'click');
    };


    //searchString from user input
    self.searchString = ko.observable("");
    //Array with filtered Schools
    self.filteredSchools = ko.computed(function () {

        if (!self.searchString) {
            for (var i = 0; i < self.schoolList.length; i++) {
                self.schoolList[i].marker.setVisible(true);
            }
            return self.schoolList();
        } else {
            var searchInput = self.searchString().toLowerCase();
            return ko.utils.arrayFilter(self.schoolList(), function (school) {
                var name = school.name().toLowerCase();
                var matched = name.indexOf(searchInput) > -1;
                school.marker.setVisible(matched);
                return matched;
            });
        }
    })


};

