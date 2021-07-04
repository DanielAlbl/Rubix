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
        constructor() { this.data = [];               }
        enqueue(item) { this.data.push(item);         }
        dequeue()     { return this.data.shift();     }
		size()        { return this.data.length;      }
        empty()       { return this.data.length == 0; }
    }

	// Constants
	const WIDTH = 1;
	const MARGIN = 0.001
	const INNER_COLOR = 0x000000;
	const COLORS = [
		0xCC0000, //right
		0xE57019, //left
		0xFFFFFF, //top
		0xFFE500, //bottom
		0x009A00, //front
		0x0000B2, //back
	];
	const AXES = [
		new THREE.Vector3( 1, 0, 0),
		new THREE.Vector3( 0, 1, 0),
		new THREE.Vector3( 0, 0, 1),
		new THREE.Vector3(-1, 0, 0),
		new THREE.Vector3( 0,-1, 0),
		new THREE.Vector3( 0, 0,-1)
	];

	// globals
	var rotation    = 0;
	var direction   = null;
	var orientation = new THREE.Quaternion(0,0,0,1);
	var prime       = false;
	var middle      = false;
	var spaceBar    = false;
	var cubeRot     = false;
	var solved      = true;
	var solving     = false;
	var speedChange = false;
	var moving      = false;
	var move        = 0;
	var AN_STEPS   = 6;
    var Q           = new Queue; 

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
	    let sides = new THREE.Mesh(geometry,material);
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
			cube.add(cubies[i]);
		}
	}

	function keyDown(e, pop = false) {
	    if(moving && !pop) {
			Q.enqueue({key: e.key, keyCode: e.keyCode});  
		    return;
        }
		
		if(!moving) {
			moving = true;
			setButtonClickability(false);
		}

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

	function moveSide() {
	    let side = new THREE.Group();
	    direction.applyQuaternion(orientation);
	    for(let i = 0; i < cube.children.length; i++)
		    if((!middle && Math.abs(cube.children[i].position.dot(direction) - WIDTH) < MARGIN) || (middle && Math.abs(cube.children[i].position.dot(direction) + WIDTH) >= MARGIN && Math.abs(cube.children[i].position.dot(direction) - WIDTH) >= MARGIN)) {   
		        side.attach(cube.children[i]);
		        i--;
		    }
	   
	    orientation.invert();
	    direction.applyQuaternion(orientation);
	    orientation.invert(); 

		side.rotateOnAxis(direction, (prime ? 1:-1)*Math.PI/AN_STEPS/2);

	    while(side.children.length !== 0)
		    cube.attach(side.children[side.children.length-1]);

	    rotation++;
	    if(rotation === AN_STEPS) { 
            rotation = 0;
			direction = null;
            prime = false;
            middle = false;
            if(solving) {
                move++;
                if(move === solver.max) {
                    solving = false;
					setMetricClickability(true);
                    move = 0;
                    solver.reset();
                }
                else
                    setDirection();
            }
			if(speedChange) {
				changeSpeed();
				speedChange = false;
			}
			if(Q.empty() && !solving) {
				setButtonClickability(true);
				moving = false;
			}
	    }
	}

	function cubeRotation() {
	    if(rotation === 0)
		    direction.applyQuaternion(orientation);
	    cube.rotateOnAxis(direction, Math.PI/AN_STEPS/2);
	    
	    rotation++;
	    if(rotation === AN_STEPS) {
            let q = new THREE.Quaternion();
            q.setFromAxisAngle(direction, -Math.PI/2);
            orientation.multiplyQuaternions(q,orientation);

			roundOrientation();
             
            rotation = 0;
			direction = null;
            cubeRot = false;
			if(speedChange) {
				changeSpeed();
				speedChange = false;
			}
			if(Q.empty()) {
				setButtonClickability(true);
				moving = false;
			}
	    }
	}

	function roundOrientation() {
		orientation._x = round90(orientation._x);
		orientation._y = round90(orientation._y);
		orientation._z = round90(orientation._z);
		orientation._w = round90(orientation._w);
	}

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

	function moveSideInstant(axis,neg) {
	    let side = new THREE.Group();
	    axis.applyQuaternion(orientation);
	    for(let i = 0; i < cube.children.length; i++)
            if(Math.abs(cube.children[i].position.dot(axis) - WIDTH) < MARGIN) {
                side.attach(cube.children[i]);
                i--;
            }
	   
	    orientation.invert();
	    axis.applyQuaternion(orientation);
	    orientation.invert();

		side.rotateOnAxis(axis, (neg ? 1:-1)*Math.PI/2);

	    while(side.children.length !== 0)
		    cube.attach(side.children[0]);
	}

	function isSolved() {
	    let normalMatrix = new THREE.Matrix3();
	    let worldNormal  = new THREE.Vector3();

	    for(let i = 0; i < cubies.length; i++) {
            normalMatrix.getNormalMatrix(cubies[i].matrixWorld);
               
            for(let j = 0; j < cubies[i].children[0].geometry.faces.length; j++) {
                worldNormal.copy(cubies[i].children[0].geometry.faces[j].normal).applyMatrix3(normalMatrix).normalize().applyQuaternion(orientation);
                if(cubies[i].children[0].geometry.faces[j].color.getHex() !== INNER_COLOR)
                    if(!checkColor(cubies[i].children[0].geometry.faces[j],worldNormal))
                        return false;
		    }
	    }
	    return true;
	}

	function checkColor(face,normal) {
	    if(Math.abs(normal.x - WIDTH) < MARGIN && face.color.getHex() !== COLORS[0])
		    return false;
	    if(Math.abs(normal.x + WIDTH) < MARGIN && face.color.getHex() !== COLORS[1])
		    return false;
	    if(Math.abs(normal.y - WIDTH) < MARGIN && face.color.getHex() !== COLORS[2])
		    return false;
	    if(Math.abs(normal.y + WIDTH) < MARGIN && face.color.getHex() !== COLORS[3])
		    return false;
	    if(Math.abs(normal.z - WIDTH) < MARGIN && face.color.getHex() !== COLORS[4])
		    return false;
	    if(Math.abs(normal.z + WIDTH) < MARGIN && face.color.getHex() !== COLORS[5])
		    return false;
	    return true;
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

	function changeSpeed() {
	    if(rotation === 0) 
			AN_STEPS = Number(16-$('#turnSpeed').val());
		else
			speedChange = true;
	}

	function setMetric() {
		let htm = $('input[name="metric"]:checked').val() === 'htm'; 
	    let edges = solver.edges;
		let centers = solver.centers;
		
		solver = htm ? new HTM_Solver() : new QTM_Solver();

	    solver.edges = edges;
		solver.centers = centers;

		$(htm ? '#htm' : '#qtm').blur();
	}

	function update() {
		if(direction === null && !Q.empty())
			keyDown(Q.dequeue(), true);

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
