const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
const OBJLoader = require('three-obj-loader')(THREE)

var startTime = Date.now();

var officeBlackGeo = new THREE.Geometry();
var officeBlackLoaded = new Promise((resolve, reject) => {
    (new THREE.OBJLoader()).load('./assets/OfficeBlack.obj', function(obj) {
        officeBlackGeo = obj.children[0].geometry;
        officeBlackGeo.computeBoundingSphere();
        resolve(officeBlackGeo);
    });
});

var officeMetalGeo = new THREE.Geometry();
var officeMetalLoaded = new Promise((resolve, reject) => {
    (new THREE.OBJLoader()).load('./assets/OfficeMetal.obj', function(obj) {
        officeMetalGeo = obj.children[0].geometry;
        officeMetalGeo.computeBoundingSphere();
        resolve(officeMetalGeo);
    });
});

var officeWhiteGeo = new THREE.Geometry();
var officeWhiteLoaded = new Promise((resolve, reject) => {
    (new THREE.OBJLoader()).load('./assets/OfficeWhite.obj', function(obj) {
        officeWhiteGeo = obj.children[0].geometry;
        officeWhiteGeo.computeBoundingSphere();
        resolve(officeWhiteGeo);
    });
});

var officeWoodGeo = new THREE.Geometry();
var officeWoodLoaded = new Promise((resolve, reject) => {
    (new THREE.OBJLoader()).load('./assets/OfficeWood.obj', function(obj) {
        officeWoodGeo = obj.children[0].geometry;
        officeWoodGeo.computeBoundingSphere();
        resolve(officeWoodGeo);
    });
});

var tank = new THREE.Mesh();
var tankGeo = new THREE.Geometry();
var tankLoaded = new Promise((resolve, reject) => {
    (new THREE.OBJLoader()).load('./assets/tank.obj', function(obj) {
        tankGeo = obj.children[0].geometry;
        tankGeo.computeBoundingSphere();
        resolve(tankGeo);
    });
});

/////////////////////////////////////////////////////////////////////

// called after the scene loads
function onLoad(framework) {
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;
    var controls = framework.controls;

    // Set light
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.color.setHSL(0.1, 1, 1);
    directionalLight.position.set(-1, 3, 1);
    directionalLight.position.multiplyScalar(10);
    scene.add(directionalLight);

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
    scene.add( ambientLight );

    // set camera position and rotation point
    camera.position.set(0, 15, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.target.set(0, 0, 0);

    //add smith head to scene
    //perform all these operations after all the data is loaded
    Promise.all([officeBlackLoaded, officeMetalLoaded, officeWhiteLoaded, officeWoodLoaded]).then(values => {   

        var officeBlackMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(0, 0, 0)});
        officeBlackMaterial.roughness = 1;
        officeBlackMaterial.metalness = 0;
        var officeBlack = new THREE.Mesh( officeBlackGeo, officeBlackMaterial);
        scene.add(officeBlack);

        var officeMetalMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(0.51, 0.51, 0.51)});
        officeMetalMaterial.roughness = 1;
        officeMetalMaterial.metalness = 0;
        var officeMetal = new THREE.Mesh(officeMetalGeo, officeMetalMaterial);
        scene.add(officeMetal);

        var officeWhiteMaterial = new THREE.MeshStandardMaterial({map: new THREE.TextureLoader().load('./assets/white.jpg')});
        officeWhiteMaterial.roughness = 1;
        officeWhiteMaterial.metalness = 0;
        var officeWhite = new THREE.Mesh(officeWhiteGeo, officeWhiteMaterial);
        scene.add(officeWhite);

        var officeWoodMaterial = new THREE.MeshStandardMaterial({map: new THREE.TextureLoader().load('./assets/wood.jpg')});
        //officeWoodMaterial.bumpMap = new THREE.TextureLoader().load('./assets/woodbump.jpg');
        officeWoodMaterial.roughness = 1;
        officeWoodMaterial.metalness = 0;
        var officeWood = new THREE.Mesh(officeWoodGeo, officeWoodMaterial);
        scene.add(officeWood);

    });
    
    Promise.all([tankLoaded]).then(values => {

        var tankMaterial = new THREE.MeshLambertMaterial({color: 0xd3c78f});
        tank = new THREE.Mesh(tankGeo, tankMaterial);
        scene.add(tank);

    });

    /*
    var geometry = new THREE.PlaneGeometry(66, 66, 1);
    var material = new THREE.MeshBasicMaterial( {color: new THREE.Color(0, 0, 0), side: THREE.DoubleSide} );
    var eyeball = new THREE.Mesh( geometry, material );
    eyeball.rotation.x = Math.PI/2.0;
    eyeball.position.y = 30;
    scene.add( eyeball );
    */
    
}

var destination = new THREE.Vector3();
var normalizedVelocity = new THREE.Vector3();
var forwardAxis = new THREE.Vector3(0, 0, 1);
function moveTank(dimension) {

    //y is the up axis
    //z is the forward axis

    //METHOD 1
    //check if reached destination
    if (tank.position.distanceTo(destination) < 2.0) {
        normalizedVelocity = new THREE.Vector3(0, 0, 0);
    }
    //determine new destination if reached old destination
    if (normalizedVelocity.x == 0.0 && normalizedVelocity.z == 0.0) {
        destination = new THREE.Vector3((2.0*Math.random()-1.0)*dimension, 0, (2.0*Math.random()-1.0)*dimension);
        console.log("chose position: (" + destination.x + ", " + destination.z + ")");
        normalizedVelocity = new THREE.Vector3(destination.x - tank.position.x, 0, destination.z - tank.position.z).normalize();
    }

    //https://stackoverflow.com/questions/5188561/signed-angle-between-two-3d-vectors-with-same-origin-within-the-same-plane
    var angleToDestination = Math.atan2( new THREE.Vector3(forwardAxis.x, forwardAxis.y, forwardAxis.z).cross(normalizedVelocity).dot(new THREE.Vector3(0, 1, 0)), 
            new THREE.Vector3(normalizedVelocity.x, normalizedVelocity.y, normalizedVelocity.z).dot(forwardAxis));

    //if facing the correct direction, move; else, rotate
    if (angleToDestination < 1*Math.PI/180.0 && angleToDestination > -1*Math.PI/180.0) { 
        tank.position.x += normalizedVelocity.x/5.0;
        tank.position.z += normalizedVelocity.z/5.0;
    }
    else {
        var sign = angleToDestination > 0 ? 1 : -1;
        tank.rotation.y += sign*2*Math.PI/180.0;
        forwardAxis.applyQuaternion( new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sign*2*Math.PI/180.0));
    }
    

    //METHOD 2

}

// called on frame updates
function onUpdate(framework) {
    moveTank(33);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);