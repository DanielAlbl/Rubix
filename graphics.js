"use strict";

$(document).ready(function() {
	// Initialize
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(5,6,12);
	camera.lookAt(new THREE.Vector3(0,0,0));
	var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(0.5*window.innerWidth,0.5*window.innerHeight);
    var div = document.getElementById('cube');
    div.appendChild(renderer.domElement);
	document.body.addEventListener("keydown",keyDown);

    // Classes
    class Queue {
        constructor() { this.data = [], this.start = 0; }
        enqueue(item) { this.data.push(item);           }
		size()        { return this.data.length;        }
        empty()       { return this.data.length === 0;  }
        dequeue() {
			let c = this.data[this.start++];
			if(2 * this.start >= this.data.length) {
				this.data = this.data.slice(this.start);
				this.start = 0;
			}
			return c;
		}
    }

	// Constants
	const WIDTH = 1;			  // width of cubies
	const MARGIN = 0.001;		  // margin of error for 2 floats to be consider equal
	const INNER_COLOR = 0x000000; // color of inside of cube
	const COLORS = [
		0xCC0000, 				  //right
		0xE57019, 				  //left
		0xFFFFFF, 				  //top
		0xFFE500, 				  //bottom
		0x009A00, 				  //front
		0x0000B2, 				  //back
	];
	// direction (axis) of basic moves 
	const AXES = [
		new THREE.Vector3( 1, 0, 0), // R
		new THREE.Vector3( 0, 1, 0), // U
		new THREE.Vector3( 0, 0, 1), // F
		new THREE.Vector3(-1, 0, 0), // L
		new THREE.Vector3( 0,-1, 0), // D
		new THREE.Vector3( 0, 0,-1)  // B
	];

	// globals
	var frame       = 0; 							 // frame number of current move animation
	var direction   = null;							 // quaternion for direction of current move
	var orientation = new THREE.Quaternion(0,0,0,1); // quaternion for orientation of cube itself
	var prime       = false;					     // is current move counter-clockwise
	var middle      = false;						 // is current move a middle move
	var cubeRot     = false;						 // is current move a cube rotation
	var solving     = false; 						 // is cross being solved
	var speedChange = false;						 // has there been a change in animation speed
	var moving      = false;						 // is moving animation taking place
	var move        = 0;							 // current move number for cross solution
	var AN_STEPS   = 6;								 // animation frames per move
    var Q           = new Queue; 					 // move queue

	// Make Cube
	var cube = new THREE.Group();
	var cubies = [];

	makeCube();

	// init solver
	var solver = new HTM_Solver();

	setCube();	

	scene.add(cube);

	// Main Loop
	gameLoop();
    
    // Event Bindings
    $('#scramble').click(scramble);
    $('#solve').click(solveCross);
    $('#options').click(showOptions);
    $('#htm').click(setMetric);
    $('#qtm').click(setMetric);
    $('#turnSpeed').click(changeSpeed);

	// Functions
	function makeCubie(x,y,z) {
	    let geometry = new THREE.BoxGeometry(WIDTH, WIDTH, WIDTH);
	    let material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
	    let sides = new THREE.Mesh(geometry, material);
	    let bordersGeo = new THREE.EdgesGeometry(geometry);
	    let borders = new THREE.LineSegments(bordersGeo,new THREE.LineBasicMaterial({color: 0xE8E8E8, linewidth: 16}));
	    let cubie = new THREE.Group();
	    cubie.add(sides);
	    cubie.add(borders);
	    cubie.translateX(x);
	    cubie.translateY(y);
	    cubie.translateZ(z);
	    cubies.push(cubie);
	}

	function makeRow(y,z) {
	    makeCubie(-WIDTH,y,z);
	    makeCubie(0,y,z);
	    makeCubie(WIDTH,y,z);
	}

	function makeFace(z) {
	    makeRow(-WIDTH,z);
	    makeRow(0,z);
	    makeRow(WIDTH,z);
	}

	function makeCube() {
	    makeFace(WIDTH);
	    makeFace(0);
	    makeFace(-WIDTH);
	}

	function setCube() {
		// set colors for each face of the cube
		for(let i = 0; i < cubies.length; i++) {
			for(let j = 0; j < cubies[i].children[0].geometry.faces.length; j++) {
				 if(cubies[i].position.x ===  WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3( 1, 0, 0)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[0]);
			else if(cubies[i].position.x === -WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3(-1, 0, 0)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[1]);
			else if(cubies[i].position.y ===  WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3( 0, 1, 0)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[2]);
			else if(cubies[i].position.y === -WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3( 0,-1, 0)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[3]);
			else if(cubies[i].position.z ===  WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3( 0, 0, 1)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[4]);
			else if(cubies[i].position.z === -WIDTH && cubies[i].children[0].geometry.faces[j].normal.equals(new THREE.Vector3( 0, 0,-1)))
				cubies[i].children[0].geometry.faces[j].color.setHex(COLORS[5]);
			else
				cubies[i].children[0].geometry.faces[j].color.setHex(INNER_COLOR);
			}
			// add cubies to main cube group
			cube.add(cubies[i]);
		}
	}

	function keyDown(e, pop = false) {
		// add moves to queue if currently moving
	    if(moving && !pop) {
			Q.enqueue({key: e.key, keyCode: e.keyCode});  
		    return;
        }
		
		// enable clicking of scramble and solve buttons if done moving
		if(!moving) {
			moving = true;
			setButtonClickability(false);
		}

		// handle moves of a slice of the cube
	    switch(e.key) {
		case 'o':
		    direction = new THREE.Vector3( 0, 1, 0);
		    prime = true;
		    solver.move(3); 
		    return;
		case 'w':
		    direction = new THREE.Vector3( 0, 1, 0);
		    solver.move(2);
		    return;
		case 'l':
		    direction = new THREE.Vector3( 0, 0, 1);
		    prime = true;
		    solver.move(5); 
		    return;
		case 's':
		    direction = new THREE.Vector3( 0, 0, 1);
		    solver.move(4);
		    return;
		case ';':
		    direction = new THREE.Vector3( 1, 0, 0);
		    prime = true;
		    solver.move(1);
		    return;
		case 'd':
		    direction = new THREE.Vector3( 1, 0, 0);
		    solver.move(0);
		    return;
		case 'k':
		    direction = new THREE.Vector3(-1, 0, 0);
		    prime = true;
		    solver.move(7);
		    return;
		case 'a':
		    direction = new THREE.Vector3(-1, 0, 0);
		    solver.move(6);
		    return;
		case ',':
		    direction = new THREE.Vector3( 0,-1, 0);
		    prime = true;
		    solver.move(9);
		    return;
		case 'z':
		    direction = new THREE.Vector3( 0,-1, 0);
		    solver.move(8);
		    return;
		case 'p':
		    direction = new THREE.Vector3( 0, 0,-1);
		    prime = true;
		    solver.move(11);
		    return;
		case 'e':
		    direction = new THREE.Vector3( 0, 0,-1);
		    solver.move(10);
		    return;
		case 'm':
		    direction = new THREE.Vector3(-1, 0, 0);
		    prime = middle = true;
            solver.moveMiddle(0);
            return;
		case 'c':
		    direction = new THREE.Vector3(-1, 0, 0);
		    middle = true;
            solver.moveMiddle(1);
		    return;
	    }
		// handle cube frames
	    switch(e.keyCode) {
		case 33:
		    direction = new THREE.Vector3( 0, 0, 1);
            solver.rotateCube(5);
		    cubeRot = true;
		    return;
		case 34:
		    direction = new THREE.Vector3( 0, 0,-1);
            solver.rotateCube(4);
		    cubeRot = true;
		    return;
		case 37:
		    direction = new THREE.Vector3( 0,-1, 0);
            solver.rotateCube(2);
		    cubeRot = true;
		    return;
		case 38:
		    direction = new THREE.Vector3(-1, 0, 0);
            solver.rotateCube(0);
		    cubeRot = true;
		    return;
		case 39:
		    direction = new THREE.Vector3( 0, 1, 0);
            solver.rotateCube(3);
		    cubeRot = true;
		    return;
		case 40:
		    direction = new THREE.Vector3( 1, 0, 0);
            solver.rotateCube(1);
		    cubeRot = true;
		    return;
	    }
	}

	// single animation frame of a move of slice of the cube
	function moveSide() {
	    let side = new THREE.Group();
		// rotate direction of move based on orientation of the cube
	    direction.applyQuaternion(orientation);
		// cubies in the slice to be moved to temporary group
	    for(let i = 0; i < cube.children.length; i++)
		    if((!middle && Math.abs(cube.children[i].position.dot(direction) - WIDTH) < MARGIN) || 
				(middle && Math.abs(cube.children[i].position.dot(direction) + WIDTH) >= MARGIN && 
				 Math.abs(cube.children[i].position.dot(direction) - WIDTH) >= MARGIN)) 
		        side.attach(cube.children[i--]);
	   
		// undo frame of direction
	    orientation.invert();
	    direction.applyQuaternion(orientation);
	    orientation.invert(); 

		// perform frame of temporary group
		// the angle is a fraction of 90 degrees based on animation speed
		side.rotateOnAxis(direction, (prime ? 1:-1)*Math.PI/AN_STEPS/2);

		// add cubies of temp group back to cube
	    while(side.children.length !== 0)
		    cube.attach(side.children[side.children.length-1]);

	    frame++;
		// handle completed animation
	    if(frame === AN_STEPS) { 
            frame = 0;
			direction = null;
            prime = false;
            middle = false;
            if(solving) {
                move++;
				// handle completed cross solve
                if(move === solver.min) {
                    solving = false;
					setMetricClickability(true);
                    move = 0;
                    solver.reset();
                }
				// set direction for next move of cross
                else setDirection();
            }
			// handle change of animation speed during move
			if(speedChange) {
				changeSpeed();
				speedChange = false;
			}
			// enable scramble and solve buttons when all moving is done
			if(Q.empty() && !solving) {
				setButtonClickability(true);
				moving = false;
			}
	    }
	}

	// single animation frame of frame of entire cube
	function cubeRotation() {
		// rotate direction of move based on orientation of cube 
		// on first animation frame
	    if(frame === 0)
		    direction.applyQuaternion(orientation);
		// rotate cube by fraction of 90 degrees, based on animation speed
	    cube.rotateOnAxis(direction, Math.PI/AN_STEPS/2);
	    
	    frame++;
		// handle completed frame
	    if(frame === AN_STEPS) {
			// caclulate new orientation quaternion of cube
            let q = new THREE.Quaternion();
            q.setFromAxisAngle(direction, -Math.PI/2);
            orientation.multiplyQuaternions(q,orientation);

			// round to nearest quaternion representing a 90 degree orientation
			roundOrientation();
             
            frame = 0;
			direction = null;
            cubeRot = false;
			// handle animation speed change
			if(speedChange) {
				changeSpeed();
				speedChange = false;
			}
			// make solve and scramble buttons clickable after moving is done
			if(Q.empty()) {
				setButtonClickability(true);
				moving = false;
			}
	    }
	}

	// fix floating point errors in orientation quaternion
	function roundOrientation() {
		orientation._x = round90(orientation._x);
		orientation._y = round90(orientation._y);
		orientation._z = round90(orientation._z);
		orientation._w = round90(orientation._w);
	}

	// helper function for roundOrientation
	function round90(x) {
		let r = Math.sqrt(2) / 2;

		if(Math.abs(x - 0) < 0.1) return    0;
		if(Math.abs(x - r) < 0.1) return    r;
		if(Math.abs(x + r) < 0.1) return   -r;
		if(Math.abs(x - 1) < 0.1) return    1;
		if(Math.abs(x + 1) < 0.1) return   -1;
		if(Math.abs(x-0.5) < 0.1) return  0.5;
		if(Math.abs(x+0.5) < 0.1) return -0.5;
	}

	// make 20 random moves without animating the movement
	function scramble() {
	    for(let i = 0; i < 20; i++) {
            let index = Math.floor(6*Math.random());
            let neg   = Math.floor(2*Math.random());
            moveSideInstant(AXES[index],neg);
            index *= 2;
            solver.move(neg ? index+1: index);
        }
		$('#scramble').blur();
	}

	// move side without multiple animation frames
	function moveSideInstant(axis,neg) {
	    let side = new THREE.Group();
		// rotate axis according to orientation of the cube
	    axis.applyQuaternion(orientation);
		// create temp group of cubies from side to be rotated
	    for(let i = 0; i < cube.children.length; i++)
            if(Math.abs(cube.children[i].position.dot(axis) - WIDTH) < MARGIN) 
                side.attach(cube.children[i--]);
	   
		// undo frame of axis
	    orientation.invert();
	    axis.applyQuaternion(orientation);
	    orientation.invert();

		// rotate temp group
		side.rotateOnAxis(axis, (neg ? 1:-1)*Math.PI/2);

		// add cubies back to cube
	    while(side.children.length !== 0)
		    cube.attach(side.children[0]);
	}

	function solveCross() {
	    if(solver.solved())
		    return;

	    solving = moving = true;
		setMetricClickability(false);
		setButtonClickability(false);
	    solver.solveCross(false);
	    setDirection();
	}

	function setMetricClickability(b) {
		$('#htm').prop('disabled', !b);
		$('#qtm').prop('disabled', !b);
	}

	function setButtonClickability(b) {
		$('#scramble').prop('disabled', !b);
		$('#solve'   ).prop('disabled', !b);
	}

	// set direction of move to the current move in the cross
	function setDirection() {
	    solver.move(solver.sol[move]);
	    switch(solver.sol[move]) {
		case 0:
		    direction = new THREE.Vector3( 1, 0, 0);
		    return;
		case 1:
		    direction = new THREE.Vector3( 1, 0, 0);
		    prime = true;
		    return;
		case 2:
		    direction = new THREE.Vector3( 0, 1, 0);
		    return;
		case 3:
		    direction = new THREE.Vector3( 0, 1, 0);
		    prime = true;
		    return;
		case 4:
		    direction = new THREE.Vector3( 0, 0, 1);
		    return;
		case 5:
		    direction = new THREE.Vector3( 0, 0, 1);
		    prime = true;
		    return;
		case 6:
		    direction = new THREE.Vector3(-1, 0, 0);
		    return;
		case 7:
		    direction = new THREE.Vector3(-1, 0, 0);
		    prime = true;
		    return;
		case 8:
		    direction = new THREE.Vector3( 0,-1, 0);
		    return;
		case 9:
		    direction = new THREE.Vector3( 0,-1, 0);
		    prime = true;
		    return;
		case 10:
		    direction = new THREE.Vector3( 0, 0,-1);
		    return;
		case 11:
		    direction = new THREE.Vector3( 0, 0,-1);
		    prime = true;
	    }
	}

	function showOptions() {
		$('#settings').toggle();
	}

	// change animation speed
	function changeSpeed() {
	    if(frame === 0) 
			AN_STEPS = Number(16-$('#turnSpeed').val());
		else
			speedChange = true;
	}

	// set cross solver metric for counting moves based on radio button
	function setMetric() {
		let htm = $('input[name="metric"]:checked').val() === 'htm'; 
	    let edges = solver.edges;
		let centers = solver.centers;
		
		solver = htm ? new HTM_Solver() : new QTM_Solver();

	    solver.edges = edges;
		solver.centers = centers;

		$(htm ? '#htm' : '#qtm').blur();
	}

	// updates to be done each animation frame
	function update() {
		// make next move in queue if not currently moving
		if(direction === null && !Q.empty())
			keyDown(Q.dequeue(), true);

		// continue ongoing animations of moves or frames
	    if(direction !== null) {
		    if(cubeRot)
		        cubeRotation();
		    else
		        moveSide();
	    }
	}

	function render() {
	    renderer.render(scene,camera);    
	}

	function gameLoop() {
	    update();
	    render();

	    requestAnimationFrame(gameLoop);
	}
});
