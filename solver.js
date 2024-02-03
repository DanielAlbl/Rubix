"use strict";

// each row contains the edges that are moved
// for each move of the cube
const moves = [[  0,  5,  8,  4],   // R
               [  1,  0,  3,  2],   // U 
               [  3,  4, 11,  7],   // F
               [  2,  7, 10,  6],   // L 
               [ 11,  8,  9, 10],   // D
               [  1,  6,  9,  5]];  // F

// edges moved by middle moves
const middles = [[ 3,  1,  9, 11],  // M
                 [ 5,  4,  7,  6],  // E
                 [ 0,  8, 10,  2]]; // S
    
// centers moved by cube rotations
const centers = [[ 1,  5,  4,  2],  // X
                 [ 0,  2,  3,  5],  // Y
                 [ 0,  4,  3,  1]]; // Z

// map from edges to their 2 adjacent centers
const edgesToCenters = [[0,1], [1,5], [1,3], [1,2], 
	                    [0,2], [0,5], [3,5], [2,3], 
	                    [0,4], [4,5], [3,4], [2,4]];

// helper function that rotates 4 elements of an array
var cycle4 = function(d,c,b,a,arr) {
    let temp = arr[a];
    arr[a] = arr[b];
    arr[b] = arr[c];
    arr[c] = arr[d];
    arr[d] = temp;
};

// helper that toggles between numbers 2*m and 2*m + 1
var inverse = function(m) {
	return m + (m % 2 ? -1 : 1);
};

// "Class" for just the edges of a rubik's cube
function Edges() {
    this.edges = [];
	this.solvedEdges = [16, 18, 20, 22];
    
	for(let i = 0; i < 12; i++)
        this.edges.push(2*i);

    this.cycle4 = function(d,c,b,a) {
        cycle4(d,c,b,a,this.edges);
    };
    
	this.cycle4p = function(a,b,c,d) {
        cycle4(d,c,b,a,this.edges);
    };
    
	this.orient = function(a,b,c,d) {
		this.edges[a] = inverse(this.edges[a]);
		this.edges[b] = inverse(this.edges[b]);
		this.edges[c] = inverse(this.edges[c]);
		this.edges[d] = inverse(this.edges[d]);
    };
    
	// move 1 side of the cube
	// "flip" indicates whether to keep track of orientation of edges
	this.move = function(m, flip = true) {
        let i = Math.floor(m/2);
		if(flip) 
			this.orient(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        if(m % 2 === 0) 
            this.cycle4 (moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        else
            this.cycle4p(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
    };

	// make middle move
	// "flip" indicates whether to keep track of orientation of edges
    this.moveMiddle = function(m, flip = true) { 
        let i = Math.floor(m/2);
		if(flip) {
			let j = Math.floor((m+6) / 2);
			this.orient(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
			this.orient(moves[j][0],moves[j][1],moves[j][2],moves[j][3]);
		}
        if(m % 2 === 0) 
            this.cycle4 (middles[i][0],middles[i][1],middles[i][2],middles[i][3]);
        else
            this.cycle4p(middles[i][0],middles[i][1],middles[i][2],middles[i][3]);
    };

	// make cube rotation
    this.rotateCube = function(m) {
        this.move(m, false);
        this.moveMiddle(m, false);
        this.move(inverse(m+6), false);
    };

	// returns whether bottom cross is solved
    this.bottomCross = function() {
        for(let i = 8; i < 12; i++)
            if(this.edges[i] !== this.solvedEdges[i-8])
				return false;
        return true;
    };
}

// "Class" for just the center of a rubik's cube
function Centers() {
    this.centers = [];
    
	for (let i = 0; i < 6; i++)
        this.centers.push(i);
    
    this.cycle4 = function(a,b,c,d) {
        cycle4(a,b,c,d,this.centers);
    };

    this.cycle4p = function(a,b,c,d) {
        cycle4(d,c,b,a,this.centers);
    };

	// rotate centers along a given axis
	// this could be due to a middle move or cube rotation
    this.move = function(m) {
        let i = Math.floor(m/2);
        if(m % 2 === 0)
            this.cycle4(centers[i][0],centers[i][1],centers[i][2],centers[i][3]);
        else
            this.cycle4p(centers[i][0],centers[i][1],centers[i][2],centers[i][3]);
    };

	// get the 4 edges which must be in the 4 positions of the bottom cross
	this.getSolvedEdges = function() {
		let solvedEdges = [0, 0, 0, 0];
		for(let i = 0; i < 12; i++) {
			if(edgesToCenters[i].includes(this.centers[4])) {
				     if(edgesToCenters[i].includes(this.centers[0]))
					solvedEdges[0] = 2*i;
				else if(edgesToCenters[i].includes(this.centers[5]))
					solvedEdges[1] = 2*i;
				else if(edgesToCenters[i].includes(this.centers[3]))
					solvedEdges[2] = 2*i;
				else if(edgesToCenters[i].includes(this.centers[2]))
					solvedEdges[3] = 2*i;
			}
		}
		return solvedEdges;
	};
}


///////////// Solver Functions /////////////////

// returns whether a given edge on the bottom layer
// has the correct bottom color (other color may not be aligned)
function correctBottomColor(i) {
	let e = this.edges.edges[i];
	let j = Math.floor(e/2);
	let centers = this.centers.centers;

	// if edge does not contain bottom color
	if(!this.edges.solvedEdges.includes(e)) return false;
	
	// determines whether edge is oriented such that bottom color is facing down
	let tmp;
	if(i % 2)
		tmp = edgesToCenters[j].includes(centers[2]) || edgesToCenters[j].includes(centers[5]);
	else
		tmp = edgesToCenters[j].includes(centers[0]) || edgesToCenters[j].includes(centers[3]);
	
	return tmp === (e % 2 === 0);
}

// calculates a minimum (but not exact)
// number of moves before cross is solved
function heuristic() {
	let m = 0, aligned = true;

	for(let i = 8; i < 12; i++) {
		// count edge that don't have correct bottom color
		if(!this.correctBottomColor(i))
			m++;
		// keep track of alignment of other color of the edge
		else if(this.edges.edges[i] !== this.edges.solvedEdges[i-8])
			aligned = false;
	}

	// if at least 1 edge was not aligned
	// it must take at least another move to solve cross
	return aligned ? m : m+1;
}

function moveMiddle(m) {
	this.edges.moveMiddle(m);
	this.centers.move(m);
}

function rotateCube(m) {
	this.edges.rotateCube(m);
	this.centers.move(m);
}

// returns if bottom cross is solved
function solved() {
	this.edges.solvedEdges = this.centers.getSolvedEdges();
	return this.edges.bottomCross();
}

////////////// Solver objects ////////////

// Quarter turn metric solver
function QTM_Solver() {
    this.edges = new Edges();
    this.centers = new Centers();

    this.mvs = [];
    this.sol = [];
    this.min = 10;

    for(let i = 0; i < 20; i++) {
        this.mvs.push(0);
        this.sol.push(0);
    }

   	this.moveMiddle = moveMiddle;

	this.rotateCube = rotateCube;

    this.heuristic = heuristic;

	this.solved = solved;

	this.correctBottomColor = correctBottomColor;

	this.move = function(m) {
        this.edges.move(m);
    };

	// returns whether move "ran" can be added to moves in solution
	// as the ith move without causing redundancy
	this.kosher = function(ran,i) {
		// first move is always fine
        if(i === 0) return true;

        let odd, moveType, repeatCount = 1, j = i-1;
        
		odd = ran % 2 !== 0;

		// get axis of rotation of ran
        moveType = Math.floor((ran % 6) / 2);

		// making a move and it's inverse is a waste
		if(this.mvs[i-1] === inverse(ran)) return false;

		// loop through contiguous moves in ran's axis of rotation
		// since these are all commutative, we are eliminating redundancy
        while(j > -1 && Math.floor((this.mvs[j]%6)/2) === moveType) {
			// count moves equal to ran
            if(this.mvs[j] === ran) repeatCount++;
			// 3 x ran = rand inverse redundancy
            if(repeatCount === 3) return false;
			// 2 x ran inverse = 2 x ran redundancy
            if(odd && repeatCount === 2) return false;
            j--;
        }

		// for 2 moves on opposite sides of the cube, order doesn't matter
        return !(Math.floor((this.mvs[i - 1] % 6) / 2) === moveType && this.mvs[i - 1] > ran);
    };

	this.solveCrossRecursive = function(count = 0) {
		// if bottom cross is solved in fewer moves than current min
        if(count < this.min && this.edges.bottomCross()) {
			// set new min
            this.min = count;
			// set solution to current moves
            for(let i = 0; i < this.min; i++)
                this.sol[i] = this.mvs[i];
            return;
        }
		// return if heuristic says it's impossible to beat min moves from this position
        if(count+this.heuristic() >= this.min) return;

		// try all moves
        for(let i = 0; i < 12; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
                this.move(i);
				this.solveCrossRecursive(count+1);
                this.move(inverse(i));
            }
        }
        this.mvs[count] = 0;
    };
 
    this.solveCross = function(getEdges = true) {
		if(getEdges)
			this.edges.solvedEdges = this.centers.getSolvedEdges();
		this.solveCrossRecursive();
	}

    this.reset = function() {
        this.min = 10;
    };
}

// half turn metric solver
function HTM_Solver() {
    this.edges = new Edges();
    this.centers = new Centers();

    this.mvs    = [];
    this.sol    = [];
    this.solHTM = [];
    this.min    = 8;
    
    for(let i = 0; i < 20; i++) {
        this.mvs.push(0);
        this.solHTM.push(0);
        this.sol.push(0);
    }

    this.moveMiddle = moveMiddle; 

    this.rotateCube = rotateCube;

    this.heuristic = heuristic;
	
	this.solved = solved;

	this.correctBottomColor = correctBottomColor;

    this.move = function(m,quarter = true) {
        if(quarter) {
            this.edges.move(m);
            return;
        }
        let side = 2*Math.floor(m/3);
        let type = m % 3;
        if(type === 0)
            this.edges.move(side);
        else if(type === 1) {
            this.edges.move(side);
            this.edges.move(side);
        }
        else
            this.edges.move(side+1);
    };

	// returns whether move "ran" can be added to moves in solution
	// as the ith move without causing redundancy
	this.kosher = function(ran,i) {
        if(i === 0) return true;
        // same side as last move
        if(Math.floor(ran/3) === Math.floor(this.mvs[i-1]/3))
            return false;
        // eliminate ambiguity for commutative moves
        return !(Math.floor((ran % 9) / 3) === Math.floor((this.mvs[i - 1] % 9) / 3) && this.mvs[i - 1] > ran);
    };
    
    this.solveCrossRecursive = function(count = 0) {
		// if bottom cross is solved in fewer moves than current min
        if(count < this.min && this.edges.bottomCross()) {
			// set new min
            this.min = count;
			// set solution to current moves
            for(let i = 0; i < this.min; i++)
				this.solHTM[i] = this.mvs[i];
            return;
        }
		// return if heuristic says it's impossible to beat min moves from this position
        if(count+this.heuristic() >= this.min) return;

		// try all moves
        for(let i = 0; i < 18; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
				this.move(i,false);
				this.solveCrossRecursive(count+1);
				let mod = i % 3;
				if(mod === 0)
					this.move(i+2,false);
				else if(mod === 1)
					this.move(i,false);
				else
					this.move(i-2,false);
            }
        }
        this.mvs[count] = 0;
    };

    this.solveCross = function(getEdges = true) {
		if(getEdges)
			this.edges.solvedEdges = this.centers.getSolvedEdges();
        this.solveCrossRecursive();
		// convert htm moves to qtm 
        let side, type, j = 0;
        for(let i = 0; i < this.min; i++) {
            side = 2*Math.floor(this.solHTM[i]/3);
            type = this.solHTM[i] % 3;
			// single move
            if(type === 0)
                this.sol[j] = side;
			// double move
            else if(type === 1) {
                this.sol[j] = side;
                j++;
                this.sol[j] = side;
            }
			// inverse move
            else
                this.sol[j] = side+1;
			j++;
        }
        this.min = j;
    };

    this.reset = function() {
        this.min = 8;
    };
}
