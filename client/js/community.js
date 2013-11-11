function renderCommunityView(container, width, height, padManager, pads, selectCallback) {

    // renderer
    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMapEnabled = true;
    renderer.setSize(width, height);
    container.append($(renderer.domElement));
    
    // camera
    var camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 300;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(new THREE.Vector3( 0, 0, 0 ));
    
    function moveCamera(t) {
        camera.position.z = 260 * (1-t) + 400 * t;
        camera.position.x = 0;
        camera.position.y = 200 * t;
        camera.lookAt(new THREE.Vector3(0, -50 * t, 0));
    }
    
    // scene
    var scene = new THREE.Scene();
    var objects = [];
   
            
    // cube
    for (var i=0;i<pads.length;i++) { // material
        var material = new THREE.MeshLambertMaterial({
            map: getPadTexture(padManager, pads[i])
        });
        var cube = new THREE.Mesh(new THREE.CubeGeometry(80, 60, 2), material);
        cube.overdraw = true;
        var alpha = i / pads.length * Math.PI * 2 + Math.PI / 2;
        cube.position.x = 180 * Math.cos(alpha);
        cube.position.y = 0;
        cube.position.z = 200 * Math.sin(alpha);
        cube.padId = pads[i];
        //cube.castShadow = true;
        //cube.receiveShadow = true;
        scene.add(cube);
        objects.push(cube);
    }
    
    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0xbbbbbb);
    scene.add(ambientLight);
    
    // directional lighting
    var spotLight = new THREE.SpotLight( 0x888888 );
    spotLight.position.set( 0, 1000, 200 );
    
    /*spotLight.castShadow = true;
    
    spotLight.shadowMapWidth = 10240;
    spotLight.shadowMapHeight = 10240;
    
    spotLight.shadowCameraNear = 100;
    spotLight.shadowCameraFar = 4000;
    spotLight.shadowCameraFov = 30;*/
    scene.add(spotLight);
    
    // start animation
    renderer.render(scene, camera);

    var t = 0;
    var timer = setInterval(function() {
        t += 0.01;
        moveCamera(t);
        renderer.render(scene, camera);
        if (t >= 1) {
            t = 1;
            clearInterval(timer);
        }
    }, 10);

    function getPos(e) {
        var x;
        var y;
        if (e.pageX || e.pageY) { 
          x = e.pageX;
          y = e.pageY;
        }
        else { 
          x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
          y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
        } 
        x -= renderer.domElement.offsetLeft;
        y -= renderer.domElement.offsetTop;
        return new Vec2(x, y);
    }
    
    $(document).keydown(function(e) {
        if (e.keyCode == 37) {
            e.preventDefault();
            var t = 0;
            var timer = setInterval(function() {
                t = t + Math.PI / pads.length / 20;
                rotate(t);
                renderer.render(scene, camera);
                if (t >= 2 * Math.PI / pads.length) {
                    t = 2 * Math.PI / pads.length;
                    clearInterval(timer);
                }
            }, 10);
        } else if (e.keyCode == 39) {
            e.preventDefault();
            var t = 0;
            var timer = setInterval(function() {
                t = t + Math.PI / pads.length / 20;
                rotate(-t);
                renderer.render(scene, camera);
                if (t >= 2 * Math.PI / pads.length) {
                    t = 2 * Math.PI / pads.length;
                    clearInterval(timer);
                }
            }, 10);
        }
    })
    
    function rotate(t) {
        for (var i=0;i<pads.length;i++) { // material
            var alpha = i / pads.length * Math.PI * 2 + Math.PI / 2 + t;
            objects[i].position.set(180 * Math.cos(alpha), 0, 200 * Math.sin(alpha));
        }
    }


    $(renderer.domElement).mouseup(function(data) {
        var pos = getPos(data).sub(new Vec2(98, 27));
        var projector = new THREE.Projector();
        var vector = new THREE.Vector3( ( pos.x / width ) * 2 - 1, - ( pos.y / height ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );

        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var intersects = raycaster.intersectObjects( objects );

        if ( intersects.length > 0 ) {

            selectCallback(intersects[ 0 ].object.padId);

        }

    })
}