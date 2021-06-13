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
	var direction   = 0;
	var orientation = new THREE.Quaternion(0,0,0,1);
	var prime       = false;
	var middle      = false;
	var spaceBar    = false;
	var cubeRot     = false;
	var solved      = true;
	var solving     = false;
	var move        = 0;
	var MOVE_TIME   = 17;
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
	    var geometry = new THREE.BoxGeometry(WIDTH, WIDTH, WIDTH);
	    var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
	    var sides = new THREE.Mesh(geometry,material);
	    var bordersGeo = new THREE.EdgesGeometry(geometry);
	    var borders = new THREE.LineSegments(bordersGeo,new THREE.LineBasicMaterial({color: 0xE8E8E8, linewidth: 16}));
	    var cubie = new THREE.Group();
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

	function keyDown(e) {
	    if(direction !== 0) {
			Q.enqueue(e);  
		    return;
        }

	    switch(e.key) {
		case 'o':
		    prime = true;
		    solver.move(3); 
		    direction = new THREE.Vector3( 0, 1, 0);
		    return;
		case 'w':
		    direction = new THREE.Vector3( 0, 1, 0);
		    solver.move(2);
		    return;
		case 'l':
		    prime = true;
		    solver.move(5); 
		    direction = new THREE.Vector3( 0, 0, 1);
		    return;
		case 's':
		    direction = new THREE.Vector3( 0, 0, 1);
		    solver.move(4);
		    return;
		case ';':
		    prime = true;
		    solver.move(1);
		    direction = new THREE.Vector3( 1, 0, 0);
		    return;
		case 'd':
		    direction = new THREE.Vector3( 1, 0, 0);
		    solver.move(0);
		    return;
		case 'k':
		    prime = true;
		    solver.move(7);
		    direction = new THREE.Vector3(-1, 0, 0);
		    return;
		case 'a':
		    direction = new THREE.Vector3(-1, 0, 0);
		    solver.move(6);
		    return;
		case ',':
		    prime = true;
		    solver.move(9);
		    direction = new THREE.Vector3( 0,-1, 0);
		    return;
		case 'z':
		    direction = new THREE.Vector3( 0,-1, 0);
		    solver.move(8);
		    return;
		case 'p':
		    prime = true;
		    solver.move(11);
		    direction = new THREE.Vector3( 0, 0,-1);
		    return;
		case 'e':
		    direction = new THREE.Vector3( 0, 0,-1);
		    solver.move(10);
		    return;
		case 'm':
		    prime = true;
		    middle = true;
            solver.moveMiddle(0);
		    direction = new THREE.Vector3(-1, 0, 0);
            return;
		case 'c':
		    middle = true;
            solver.moveMiddle(1);
		    direction = new THREE.Vector3(-1, 0, 0);
		    return;
	    }
	    switch(e.keyCode) {
		case 33:
            solver.rotateCube(5);
		    direction = new THREE.Vector3( 0, 0, 1);
		    cubeRot = true;
		    return;
		case 34:
            solver.rotateCube(4);
		    direction = new THREE.Vector3( 0, 0,-1);
		    cubeRot = true;
		    return;
		case 37:
            solver.rotateCube(2);
		    direction = new THREE.Vector3( 0,-1, 0);
		    cubeRot = true;
		    return;
		case 38:
            solver.rotateCube(0);
		    direction = new THREE.Vector3(-1, 0, 0);
		    cubeRot = true;
		    return;
		case 39:
            solver.rotateCube(3);
		    direction = new THREE.Vector3( 0, 1, 0);
		    cubeRot = true;
		    return;
		case 40:
            solver.rotateCube(1);
		    direction = new THREE.Vector3( 1, 0, 0);
		    cubeRot = true;
		    return;
	    }
	}

	function moveSide() {
	    var side = new THREE.Group();
	    direction.applyQuaternion(orientation);
	    for(let i = 0; i < cube.children.length; i++)
		    if((!middle && Math.abs(cube.children[i].position.dot(direction) - WIDTH) < MARGIN) || (middle && Math.abs(cube.children[i].position.dot(direction) + WIDTH) >= MARGIN && Math.abs(cube.children[i].position.dot(direction) - WIDTH) >= MARGIN)) {   
		        side.attach(cube.children[i]);
		        i--;
		    }
	   
	    orientation.inverse();
	    direction.applyQuaternion(orientation);
	    orientation.inverse();

		side.rotateOnAxis(direction, (prime ? 1:-1)*Math.PI/MOVE_TIME/2);

	    while(side.children.length !== 0)
		    cube.attach(side.children[0]);

	    rotation++;
	    if(rotation === MOVE_TIME) { 
            rotation = 0;
            direction = 0;
            prime = false;
            middle = false;
            if(solving) {
                move++;
                if(move === solver.max) {
                    solving = false;
                    direction = 0;
                    move = 0;
                    solver.reset();
                }
                else
                    setDirection();
            }
            changeSpeed();
	    }
	}

	function cubeRotation() {
	    if(rotation === 0)
		    direction.applyQuaternion(orientation);
	    cube.rotateOnAxis(direction, Math.PI/MOVE_TIME/2);
	    
	    rotation++;
	    if(rotation === MOVE_TIME) {
            var q = new THREE.Quaternion();
            q.setFromAxisAngle(direction, -Math.PI/2);
            orientation.multiplyQuaternions(q,orientation);
             
            rotation = 0;
            direction = 0;
            cubeRot = false;
            changeSpeed();
	    }
	}

	function scramble() {
	    if(direction != 0) return;
	    for(let i = 0; i < 20; i++) {
            var index = Math.floor(6*Math.random());
            var neg   = Math.floor(2*Math.random());
            moveSideInstant(AXES[index],neg);
            index *= 2;
            if(neg)
                index++;
            solver.move(index);
        }
	    var button = document.getElementById('scramble');
	    button.blur();
	}

	function moveSideInstant(axis,neg) {
	    var side = new THREE.Group();
	    axis.applyQuaternion(orientation);
	    for(let i = 0; i < cube.children.length; i++)
            if(Math.abs(cube.children[i].position.dot(axis) - WIDTH) < MARGIN) {
                side.attach(cube.children[i]);
                i--;
            }
	   
	    orientation.inverse();
	    axis.applyQuaternion(orientation);
	    orientation.inverse();

		side.rotateOnAxis(axis, (neg ? 1:-1)*Math.PI/2);

	    while(side.children.length !== 0)
		    cube.attach(side.children[0]);
	}

	function isSolved() {
	    var normalMatrix = new THREE.Matrix3();
	    var worldNormal  = new THREE.Vector3();

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
	    if(solver.edges.whiteCross())
		    return;
	    solving = true;
	    solver.solveCross();
	    setDirection();
	}

	function setDirection() {
	    solver.move(solver.sol[move]);
	    switch(solver.sol[move]) {
		case 0:
		    direction = new THREE.Vector3( 1, 0, 0);
		    return;
		case 1:
		    prime = true;
		    direction = new THREE.Vector3( 1, 0, 0);
		    return;
		case 2:
		    direction = new THREE.Vector3( 0, 1, 0);
		    return;
		case 3:
		    prime = true;
		    direction = new THREE.Vector3( 0, 1, 0);
		    return;
		case 4:
		    direction = new THREE.Vector3( 0, 0, 1);
		    return;
		case 5:
		    prime = true;
		    direction = new THREE.Vector3( 0, 0, 1);
		    return;
		case 6:
		    direction = new THREE.Vector3(-1, 0, 0);
		    return;
		case 7:
		    prime = true;
		    direction = new THREE.Vector3(-1, 0, 0);
		    return;
		case 8:
		    direction = new THREE.Vector3( 0,-1, 0);
		    return;
		case 9:
		    prime = true;
		    direction = new THREE.Vector3( 0,-1, 0);
		    return;
		case 10:
		    direction = new THREE.Vector3( 0, 0,-1);
		    return;
		case 11:
		    prime = true;
		    direction = new THREE.Vector3( 0, 0,-1);
	    }
	}

	function showOptions() {
	    var op = document.getElementById('settings');
		op.style.display = op.style.display === 'none' ? 'block':'none';
	}

	function changeSpeed() {
	    if(rotation !== 0) return;
	    var s = document.getElementById('turnSpeed').value;
	    MOVE_TIME = Number(32-s);
	}

	function setMetric() {
	    var edges = solver.edges;
	    if(document.getElementById('htm').checked === 'checked')
			solver = new HTM_Solver();
	    else
			solver = new QTM_Solver();
	    solver.edges = edges;
	}

	function update() {
	    if(direction !== 0) {
		    if(cubeRot)
		        cubeRotation();
		    else
		        moveSide();
	    }
	    else {
            if(Q.empty()) {
                if(!solved && isSolved())
                    solved = true;
                if(solved && !isSolved())
                    solved = false;
            }
            else
                keyDown(Q.dequeue());
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
