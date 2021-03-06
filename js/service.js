/**
 * service.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Implements a shuttle service.
 */
 
// create global variable points 
points = 0;

// default height
var HEIGHT = 0.8;

// default latitude
var LATITUDE = 42.3745615030193;

// default longitude
var LONGITUDE = -71.11803936751632;

// default heading
var HEADING = 1.757197490907891;

// default number of seats
var SEATS = 10;

// default velocity
var VELOCITY = 50;

// global reference to shuttle's marker on 2D map
var bus = null;

// global reference to 3D Earth
var earth = null;

// global reference to 2D map
var map = null;

// global reference to shuttle
var shuttle = null;

// load version 1 of the Google Earth API
google.load("earth", "1");

// load version 3 of the Google Maps API
google.load("maps", "3", {other_params: "sensor=false"});

// once the window has loaded
$(window).load(function() {

    // listen for keydown anywhere in body
    $(document.body).keydown(function(event) {
        return keystroke(event, true);
    });

    // listen for keyup anywhere in body
    $(document.body).keyup(function(event) {
        return keystroke(event, false);
    });

    // listen for click on Drop Off button
    $("#dropoff").click(function(event) {
        dropoff();
    });

    // listen for click on Pick Up button
    $("#pickup").click(function(event) {
        pickup();
    });

    // load application
    load();
});

// unload application
$(window).unload(function() {
    unload();
});

/**
 * Renders seating chart.
 */
function chart()
{
    var html = "<ol start='0'>";
    for (var i = 0; i < shuttle.seats.length; i++)
    {
        if (shuttle.seats[i] == null)
        {
            html += "<li>Empty Seat</li>";
        }
        else
        {
            html += "<li class=" + shuttle.seats[i].house.split(" ")[0] +">" + shuttle.seats[i].name + "</li>"; //changed this line
        }
    }
    html += "</ol>";
    $("#chart").html(html);
}

/**
 * Drops up passengers if their stop is nearby.
 */
function dropoff()
{
    found_building = false;
    
    for (var t in HOUSES)
    {
        buildinglat = HOUSES[t].lat;
        buildinglng = HOUSES[t].lng;
        
        if (shuttle.distance(buildinglat, buildinglng) < 30)
        {
            // check if shuttle is empty
            if (shuttle.seats == null)
            {
                $("#announcements").html("The shuttle is empty");
                break;
            }
            
            // itereate over shuttle.seats, if you come across a passenger whose house is near
            for (var z = 0; z < shuttle.seats.length; z++)
            {
                if (shuttle.seats[z] != null && shuttle.seats[z].house == t)
                {
                    points ++;
                    $("#announcements").html("Dropped off. U have " + points + "points");
                    
                    // subtract 3 because 3 of the passengers are freshmen so they dont ride the shuttle
                    if (points == PASSENGERS.length - 3)
                    {
                        $("#announcements").html("Good work, u dropped them all off");
                    }
                    shuttle.seats[z] = null;
                    chart();
                    break;
                }
            }
            found_building = true;
        }
    }    
    
    if (found_building == false)
    {
        $("#announcements").html("Sry, can not drop off here");
    }
}

/**
 * Called if Google Earth fails to load.
 */
function failureCB(errorCode) 
{
    // report error unless plugin simply isn't installed
    if (errorCode != ERR_CREATE_PLUGIN)
    {
        alert(errorCode);
    }
}

/**
 * Handler for Earth's frameend event.
 */
function frameend() 
{
    shuttle.update();
}

/**
 * Called once Google Earth has loaded.
 */
function initCB() //instance) 
{
    // retain reference to GEPlugin instance
    //earth = instance;

    // specify the speed at which the camera moves
    //earth.getOptions().setFlyToSpeed(100);

    // show buildings
    //earth.getLayerRoot().enableLayerById(earth.LAYER_BUILDINGS, true);

    // disable terrain (so that Earth is flat)
    //earth.getLayerRoot().enableLayerById(earth.LAYER_TERRAIN, false);

    // prevent mouse navigation in the plugin
    //earth.getOptions().setMouseNavigationEnabled(false);

    // instantiate shuttle
    shuttle = new Shuttle({
        heading: HEADING,
        height: HEIGHT,
        latitude: LATITUDE,
        longitude: LONGITUDE,
        planet: earth,
        seats: SEATS,
        velocity: VELOCITY
    });

    // synchronize camera with Earth
    //google.earth.addEventListener(earth, "frameend", frameend);

    // synchronize map with Earth
    //google.earth.addEventListener(earth.getView(), "viewchange", viewchange);

    // update shuttle's camera
    //shuttle.updateCamera();

    // show Earth
    //earth.getWindow().setVisibility(true);

    // render seating chart
    chart();

    // populate Earth with passengers and houses
    populate();
}

/**
 * Handles keystrokes.
 */
function keystroke(event, state)
{
    // ensure we have event
    if (!event)
    {
        event = window.event;
    }

    // left arrow
    if (event.keyCode == 37)
    {
        shuttle.states.turningLeftward = state;
        return false;
    }

    // up arrow
    else if (event.keyCode == 38)
    {
        shuttle.states.tiltingUpward = state;
        return false;
    }

    // right arrow
    else if (event.keyCode == 39)
    {
        shuttle.states.turningRightward = state;
        return false;
    }

    // down arrow
    else if (event.keyCode == 40)
    {
        shuttle.states.tiltingDownward = state;
        return false;
    }

    // V, v
    else if (event.keyCode == 86 || event.keyCode == 118)
    {
        shuttle.velocity += 10;
        console.log(shuttle.velocity);
        return false;
    }
    
    // C, c
    else if (event.keyCode == 67 || event.keyCode == 99)
    {
        shuttle.velocity -= 10;
        console.log(shuttle.velocity);
        return false;
    }
    
    // A, a
    else if (event.keyCode == 65 || event.keyCode == 97)
    {
        shuttle.states.slidingLeftward = state;
        return false;
    }

    // D, d
    else if (event.keyCode == 68 || event.keyCode == 100)
    {
        shuttle.states.slidingRightward = state;
        return false;
    }
  
    // S, s
    else if (event.keyCode == 83 || event.keyCode == 115)
    {
        shuttle.states.movingBackward = state;     
        return false;
    }

    // W, w
    else if (event.keyCode == 87 || event.keyCode == 119)
    {
        shuttle.states.movingForward = state;    
        return false;
    }
  
    return true;
}

/**
 * Loads application.
 */
function load()
{
    // embed 2D map in DOM
    var latlng = new google.maps.LatLng(LATITUDE, LONGITUDE);
    map = new google.maps.Map($("#map").get(0), {
        center: latlng,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: true,
        zoom: 13,
        zoomControl: true
    });

    // prepare shuttle's icon for map
    bus = new google.maps.Marker({
        icon: "https://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/bus.png",
        map: map,
        title: "you are here"
    });

    // embed 3D Earth in DOM
    //google.earth.createInstance("earth", initCB, failureCB);
    initCB();
}

/**
 * Picks up nearby passengers.
 */
function pickup()
{
    for (var i = 0; i < PASSENGERS.length; i++)
    {
        // added if statement cause trying to get rid or annoying js error
        // Cannot read property 'placemark' or null
        if (PASSENGERS[i] != null)
        {    
            // check distance from the shuttle to PASSENGERS
            lat = PASSENGERS[i].placemark.getGeometry().getLatitude();
            lng = PASSENGERS[i].placemark.getGeometry().getLongitude();
        }
        
        // get distance
        if (shuttle.distance(lat, lng) < 15)
        {
            // check if theres room in shuttle
            for (var k = 0; k < shuttle.seats.length; k++)
            {
                if (shuttle.seats[k] == PASSENGERS[i])
                {
                    break;
                }
            
                var pickedup = false;
                if (shuttle.seats[k] == null)
                {
                    // make sure the passenger is not a freshman if HOUSES contains PASSENGERS[i].house
                    if (PASSENGERS[i].house in HOUSES != false)
                    {
                        // remove pictures on 3d map
                        var features = earth.getFeatures();
                        features.removeChild(PASSENGERS[i].placemark);
                     
                        // remove 2d icon on map
                        PASSENGERS[i].marker.setMap(null);
                        shuttle.seats[k] = PASSENGERS[i];
                        
                        chart();
                        pickedup = true;
                        break;
                    }
                    
                    else
                    $("#announcements").html("freshmen");
                    
                    // make marker null and placemark null so the person can't be added more than once
                    PASSENGERS[i] = null;
                }
            }
        
            if (pickedup = false)
            {
                $("#announcements").html("shuttle full, sry");
                break;
            }
        }
    }
}

/**
 * Populates Earth with passengers and houses.
 */
function populate()
{
    // mark henges
    for (var henge in HENGE_STARTS)
    {
        // plant henge on map
        new google.maps.Marker({
            icon: "img/megalith.png",
            map: map,
            position: new google.maps.LatLng(HENGE_STARTS[henge].lat, HENGE_STARTS[henge].lng),
            title: henge
        });
    }

}

/**
 * Handler for Earth's viewchange event.
 */
function viewchange() 
{
    // keep map centered on shuttle's marker
    var latlng = new google.maps.LatLng(shuttle.position.latitude, shuttle.position.longitude);
    map.setCenter(latlng);
    bus.setPosition(latlng);
}

/**
 * Unloads Earth.
 */
function unload()
{
    //google.earth.removeEventListener(earth.getView(), "viewchange", viewchange);
    //google.earth.removeEventListener(earth, "frameend", frameend);
}
