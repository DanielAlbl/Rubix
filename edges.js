const moves = [[  0,  5,  8,  4],
               [  1,  0,  3,  2],
               [  3,  4, 11,  7],
               [  2,  7, 10,  6],
               [ 11,  8,  9, 10],
               [  1,  6,  9,  5]];

function Edges() {
    this.edges = [];
    for(var i = 0; i < 12; i++)
        this.edges.push(2*i);
    this.cycle4  = function(d,c,b,a) {
        temp          = this.edges[a];
        this.edges[a] = this.edges[b];
        this.edges[b] = this.edges[c];
        this.edges[c] = this.edges[d];
        this.edges[d] = temp;
    };
    this.cycle4p = function(a,b,c,d) {
        temp          = this.edges[a];
        this.edges[a] = this.edges[b];
        this.edges[b] = this.edges[c];
        this.edges[c] = this.edges[d];
        this.edges[d] = temp;
    };
    this.orient = function(a,b,c,d) {
        if (this.edges[a] % 2 == 0)
            this.edges[a]++;
        else
            this.edges[a]--;
        if (this.edges[b] % 2 == 0)
            this.edges[b]++;
        else
            this.edges[b]--;
        if (this.edges[c] % 2 == 0)
            this.edges[c]++;
        else
            this.edges[c]--;
        if (this.edges[d] % 2 == 0)
            this.edges[d]++;
        else
            this.edges[d]--;
    };
    this.move = function(m) {
        var i = Math.floor(m/2);
        this.orient(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        if(m % 2 === 0) 
            this.cycle4 (moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
        else
            this.cycle4p(moves[i][0],moves[i][1],moves[i][2],moves[i][3]);
    };
    this.whiteCross = function() {
        for(var i = 8; i < 12; i++)
            if(this.edges[i] !== 2*i)
                return false;
        return true;
    };
}

function QTM_Solver() {
    this.cube = new Edges();
    this.mvs  = [];
    this.sol  = [];
    this.max  = 9;
    for(var i = 0; i < 20; i++) {
        this.mvs.push(0);
        this.sol.push(0);
    }
    this.move = function(m) {
        this.cube.move(m);
    }
    this.kosher = function(ran,i) {
        if(i === 0)
            return true;
        var odd, moveType, repeatCount = 0, j = i-1;
        
        if(ran % 2 === 0)
            odd = false;
        else
            odd = true;

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

    this.heuristic = function() {
        var m = 0, aligned = true;
        for(var i = 8; i < 12; i++) {
            if(this.cube.edges[i] < 16 && (Math.floor(this.cube.edges[i]/2)+i+this.cube.edges[i])%2 === 0)
                m++;
            else if(this.cube.edges[i] !== 2*i)
                aligned = false;
        }
        if(!aligned)
            m++;
        return m;
    };
 
    this.solveCross = function(count = 0) {
        if(count < this.max && this.cube.whiteCross()) {
            this.max = count;
            for(var i = 0; i < this.max; i++)
                this.sol[i] = this.mvs[i];
            return true;
        }
        if(count+this.heuristic() >= this.max)
            return false;

        for(var i = 0; i < 12; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
                this.move(i);
                if(this.solveCross(count+1)) {
                    if(i % 2 === 0)
                        this.move(i+1);
                    else
                        this.move(i-1);
                    break;
                }
                if(i % 2 === 0)
                    this.move(i+1);
                else
                    this.move(i-1);
            }
        }
        this.mvs[count] = 0;
        return false;
    };
    
    this.reset = function() {
        this.max = 9;
    };
}

function HTM_Solver() {
    this.cube   = new Edges();
    this.mvs    = [];
    this.sol    = [];
    this.solHTM = [];
    this.max    = 8;
    
    for(var i = 0; i < 20; i++) {
        this.mvs.push(0);
        this.solHTM.push(0);
        this.sol.push(0);
    }
    
    this.move = function(m,quarter = true) {
    
        if(quarter) {
            this.cube.move(m);
            return;
        }
        var side = 2*Math.floor(m/3);
        var type = m % 3;
        if(type === 0)
            this.cube.move(side);
        else if(type === 1) {
            this.cube.move(side);
            this.cube.move(side);
        }
        else
            this.cube.move(side+1);
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
    
    this.heuristic = function() {
        var m = 0, aligned = true;
        for(var i = 8; i < 12; i++) {
            if(this.cube.edges[i] < 16 && (Math.floor(this.cube.edges[i]/2)+i+this.cube.edges[i])%2 === 0)
                m++;
            else if(this.cube.edges[i] !== 2*i)
                aligned = false;
        }
        if(!aligned)
            m++;
        return m;
    };
    
    this.solveCrossRecursive = function(count = 0) {
        if(count < this.max && this.cube.whiteCross()) {
            this.max = count;
            for(var i = 0; i < this.max; i++)
                this.solHTM[i] = this.mvs[i];
            return true;
        }
        if(count+this.heuristic() >= this.max)
            return false;

        for(var i = 0; i < 18; i++) {
            if(this.kosher(i,count)) {
                this.mvs[count] = i;
                this.move(i,false);
                if(this.solveCrossRecursive(count+1)) {
                    var mod = i % 3;
                    if(mod === 0)
                        this.move(i+2,false);
                    else if(mod === 1)
                        this.move(i,false);
                    else
                        this.move(i-2,false);
                    break;
                }
                var mod = i % 3;
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

    this.solveCross = function() {
        this.solveCrossRecursive();
        var side, type, j = 0;
        for(var i = 0; i < this.max; i++) {
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
        console.log(this.max);
        this.max = j;
    };

    this.reset = function() {
        this.max = 8;
    };
}

