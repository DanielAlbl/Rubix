const moves = [[  0,  5,  8,  4],
               [  1,  0,  3,  2],
               [  3,  4, 11,  7],
               [  2,  7, 10,  6],
               [ 11,  8,  9, 10],
               [  1,  6,  9,  5]];

const middles = [[ 3,  1,  9, 11],
                 [ 5,  4,  7,  6],
                 [ 0,  8, 10,  2]];
    
const centers = [[ 1,  5,  4,  2],
                 [ 0,  2,  3,  5],
                 [ 0,  4,  3,  1]];

const edgesToCenters = [[0,1], [1,5], [1,3], [1,2], 
	                    [0,2], [0,5], [3,5], [2,3], 
	                    [0,4], [4,5], [3,4], [2,4]];

var cycle4 = function(d,c,b,a,arr) {
    let temp = arr[a];
    arr[a] = arr[b];
    arr[b] = arr[c];
    arr[c] = arr[d];
    arr[d] = temp;
};

var inverse = function(m) {
	return m + (m % 2 ? -1 : 1);
};

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
    
	this.move = function(m, flip = true) {
        let i = Math.floor(m/2);
		if(flip) 
			this.orient(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        if(m % 2 === 0) 
            this.cycle4 (moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        else
            this.cycle4p(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
    };

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

    this.rotateCube = function(m) {
        this.move(m, false);
        this.moveMiddle(m, false);
        this.move(inverse(m+6), false);
    };

    this.bottomCross = function() {
        for(let i = 8; i < 12; i++)
            if(this.edges[i] !== this.solvedEdges[i-8])
				return false;
        return true;
    };
}

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

    this.move = function(m) {
        let i = Math.floor(m/2);
        if(m % 2 === 0)
            this.cycle4(centers[i][0],centers[i][1],centers[i][2],centers[i][3]);
        else
            this.cycle4p(centers[i][0],centers[i][1],centers[i][2],centers[i][3]);
    };

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


// Solver Functions
function correctBottomColor(i) {
	let e = this.edges.edges[i];
	let j = Math.floor(e/2);
	let centers = this.centers.centers;

	if(!this.edges.solvedEdges.includes(e)) return false;
	
	let tmp = true;
	if(i % 2)
		tmp = edgesToCenters[j].includes(centers[2]) || edgesToCenters[j].includes(centers[5]);
	else
		tmp = edgesToCenters[j].includes(centers[0]) || edgesToCenters[j].includes(centers[3]);
	
	return tmp === (e % 2 === 0);
}

function heuristic() {
	let m = 0, aligned = true;

	for(let i = 8; i < 12; i++) {
		if(!this.correctBottomColor(i))
			m++;
		else if(this.edges.edges[i] !== this.edges.solvedEdges[i-8])
			aligned = false;
	}

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

function solved() {
	this.edges.solvedEdges = this.centers.getSolvedEdges();
	return this.edges.bottomCross();
}

// Solver objects
function QTM_Solver() {
    this.edges = new Edges();
    this.centers = new Centers();

    this.mvs = [];
    this.sol = [];
    this.max = 10;

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

	this.kosher = function(ran,i) {
        if(i === 0)
            return true;
        let odd, moveType, repeatCount = 0, j = i-1;
        
		odd = ran % 2 !== 0;

        moveType = Math.floor((ran % 6) / 2);

        if(!odd && this.mvs[i-1] === ran+1)
            return false;
        if(odd && this.mvs[i-1] === ran-1)
            return false;

        while(Math.floor((this.mvs[j]%6)/2) === moveType && j != -1) {
            if(this.mvs[j] === ran)
                repeatCount++;
            if(repeatCount === 2)
                return false;
            if(odd && repeatCount === 1)
                return false;
            j--;
        }
        
        if(Math.floor((this.mvs[i-1]%6)/2) === moveType && this.mvs[i-1] > ran)
            return false;
        return true;
    };

	this.solveCrossRecursive = function(count = 0) {
        if(count < this.max && this.edges.bottomCross()) {
            this.max = count;
            for(let i = 0; i < this.max; i++)
                this.sol[i] = this.mvs[i];
            return true;
        }
        if(count+this.heuristic() >= this.max)
            return false;

        for(let i = 0; i < 12; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
                this.move(i);
                if(this.solveCrossRecursive(count+1)) {
                    this.move(inverse(i));
                    break;
                }
                this.move(inverse(i));
            }
        }
        this.mvs[count] = 0;
        return false;
    };
 
    this.solveCross = function(getEdges = true) {
		if(getEdges)
			this.edges.solvedEdges = this.centers.getSolvedEdges();
		this.solveCrossRecursive();
	}

    this.reset = function() {
        this.max = 10;
    };
}

function HTM_Solver() {
    this.edges = new Edges();
    this.centers = new Centers();

    this.mvs    = [];
    this.sol    = [];
    this.solHTM = [];
    this.max    = 8;
    
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

	this.kosher = function(ran,i) {
        if(i === 0)
            return true;
        // same side as last move
        if(Math.floor(ran/3) === Math.floor(this.mvs[i-1]/3))
            return false;
        // eliminate ambiguity for commutitive moves
        if(Math.floor((ran%9)/3) === Math.floor((this.mvs[i-1]%9)/3) && this.mvs[i-1] > ran)
            return false;
        
        return true;
    };
    
    this.solveCrossRecursive = function(count = 0) {
        if(count < this.max && this.edges.bottomCross()) {
            this.max = count;
            for(var i = 0; i < this.max; i++)
				this.solHTM[i] = this.mvs[i];
            return true;
        }
        if(count+this.heuristic() >= this.max)
            return false;

        for(let i = 0; i < 18; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
            this.move(i,false);
            if(this.solveCrossRecursive(count+1)) {
                let mod = i % 3;
                if(mod === 0)
                    this.move(i+2,false);
                else if(mod === 1)
                    this.move(i,false);
                else
                    this.move(i-2,false);
                break;
            }
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
        return false;
    };

    this.solveCross = function(getEdges = true) {
		if(getEdges)
			this.edges.solvedEdges = this.centers.getSolvedEdges();
        this.solveCrossRecursive();
        var side, type, j = 0;
        for(let i = 0; i < this.max; i++) {
            side = 2*Math.floor(this.solHTM[i]/3);
            type = this.solHTM[i] % 3;
            if(type === 0)
                this.sol[j] = side;
            else if(type === 1) {
                this.sol[j] = side;
                j++;
                this.sol[j] = side;
            }
            else
                this.sol[j] = side+1;
			j++;
        }
        this.max = j;
    };

    this.reset = function() {
        this.max = 8;
    };
}
