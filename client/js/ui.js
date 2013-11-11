function UIStates() {
}

UIStates.VIEWING = 1;
UIStates.VIEWING_COMMUNITY = 2;
UIStates.CREATING_FIRST_SELF_PORTAL = 3;
UIStates.CREATING_SECOND_SELF_PORTAL = 4;
UIStates.CREATING_CROSS_PORTAL_CHOOSING_PAD = 5;
UIStates.CREATING_FIRST_CROSS_PORTAL = 6;
UIStates.CREATING_SECOND_CROSS_PORTAL = 7;


function PadManager() {
    this.homePad = null;
    this.getPortals = function(pad) {
        
    };
    
}

function PortalElement(){
    this.gatePosts = [];
    this.circles = [];
    this.line = undefined;
    this.timer = null;
    this.selected = false;
    this.begin = function (x, y) {
        this.curStroke = [x, y];
        var this_ = this;
    };
    this.addPoint = function(x, y) {
        
        this.gatePosts.push(new Vec2(x, y));
        var circle = new Kinetic.Circle({
            x: x,
            y: y,
            radius: 10,
            fill: 'blue',
            stroke: 'black',
            strokeWidth: 4
        });
        
        this.circles.push(circle);
        
        this.gatePosts.push(new Vec2(x, y));
        var circleTwo = new Kinetic.Circle({
            x: x,
            y: y,
            radius: 10,
            fill: 'blue',
            stroke: 'black',
            strokeWidth: 4
        });
        
        this.circles.push(circleTwo);
        
        
        var line =  new Kinetic.Line({
            points: [this.gatePosts[0].x, this.gatePosts[0].y, this.gatePosts[1].x, this.gatePosts[1].y],
            strokeWidth: 5,
            lineJoin: 'round',
            stroke:'blue'
            /*
             * line segments with a length of 33px
             * with a gap of 10px
             */
        });
        this.line = line;
        
    };
    
    this.setSecondPoint = function(a, b) {
        this.gatePosts[1] = new Vec2(a, b);
        this.circles[1] = new Kinetic.Circle({
            x: a,
            y: b,
            radius: 10,
            fill: 'blue',
            stroke: 'black',
            strokeWidth: 4
        });
        
        
        this.line = new Kinetic.Line({
            points: [this.gatePosts[0].x, this.gatePosts[0].y, this.gatePosts[1].x, this.gatePosts[1].y],
            strokeWidth: 5,
            lineJoin: 'round',
            stroke: 'blue',
            /*
             * line segments with a length of 33px
             * with a gap of 10px
             */
        });
    }
    
    
    this.finishPortal = function(){
        var this_ = this;
        //add listeners to all UI elements
          this.line.on('mouseup', function() {
                this_.selected = !this_.selected;
                console.log(this_.selected);
                this_.recolor();
        
            });
          this.circles[0].on('mouseup', function() {
                this_.selected = !this_.selected;
                console.log(this_.selected);
                this_.recolor();
        
            });
        
          this.circles[1].on('mouseup', function() {
                this_.selected = !this_.selected;
                console.log(this_.selected);
                this_.recolor();
        
            });
        
        
    } 
    
    this.getWidth = function(){
        if(this.gatePosts.length != 2){
            return 0;
        }
        return this.gatePosts[0].sub(this.gatePosts[1]).abs();
        
        
    }
    
    this.copy = function(){
        var portal = new PortalElement();
        portal.gatePosts[0] = this.gatePosts[0];
        portal.gatePosts[1] = this.gatePosts[1];
        portal.circles[0] = this.circles[0];
        portal.circles[1] = this.circles[1];
        return portal;
    }
    
    this.recolor = function(){
        var color = (this.selected)? "red":"blue";
        
        this.line.setStroke(color);
        this.circles[0].setFill(color);
        this.circles[1].setFill(color);
        
        
        
    }
    
    
    this.delete = function() {
        this.line.remove();
        this.gatePosts[0].remove();
        this.gatePosts[1].remove();
        
    }
    
    
    
}


function renderPad(){}