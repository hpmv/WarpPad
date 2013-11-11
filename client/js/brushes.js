//what is step?
var steps = 20;
var step = Math.PI / steps;



var DELTA_WIDTH = 0.3;
var MAX_WIDTH = 7;
var strokeWidth = 0.2;



var convolve = function (stroke) {
    //console.log("convolving");
    if (stroke.length < 4) {
        return [];
    }

    strokeWidth = 0.5;
    var conv = [];
    conv.push(stroke[0]);
    conv.push(stroke[1]);

    var i = 0;
    var aIn = 0;
    var curPoint = new Vec2(stroke[0], stroke[1]);
    var next = new Vec2(stroke[2], stroke[3]);

    var tan = next.sub(curPoint);

    var rad = tan.rotate(-Math.PI / 2).normalize().scale(strokeWidth);
    var length = stroke.length;
    while (i < stroke.length / 2) {


        //console.log(strokeWidth);
        rad = tan.rotate(-Math.PI / 2 - step * aIn).normalize().scale(strokeWidth);

        var pt = curPoint.add(rad);
        conv.push(pt.x);
        conv.push(pt.y);

        var rado = rad.rotate(Math.PI / 2.0);

        var tToR = tan.to(rado);
        //console.log("mew");
        //console.log(rado.x);
        //console.log(rado.y);
        //console.log(tToR);
        if (-step / 2 < tToR && tToR < step / 2) {
            i += 1;
            strokeWidth = Math.min(DELTA_WIDTH * Math.min(i * 2, length - i * 2 + 2), MAX_WIDTH);
            curPoint = new Vec2(stroke[i * 2], stroke[i * 2 + 1]);
            if (i < stroke.length / 2 - 1) {
                tan = new Vec2(stroke[(i + 1) * 2], stroke[(i + 1) * 2 + 1]).sub(curPoint);
            }

            //rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);
        } else if (tToR <= -step / 2) {
            //rad = rad.rotate(-step);
            aIn = aIn - 1;
            if (aIn < 0) {
                aIn = aIn + 2 * steps;
            }
        } else {
            aIn = aIn + 1;
            if (aIn > 2 * steps - 1) {
                aIn = aIn - 2 * steps;
            }
            //rad = rad.rotate(step);
        }

    }




    // other dir
    conv.push(stroke[stroke.length - 2]);
    conv.push(stroke[stroke.length - 1]);


    var i = stroke.length / 2 - 1;
    var aIn = 0;
    var curPoint = new Vec2(stroke[stroke.length - 2], stroke[stroke.length - 1]);
    var next = new Vec2(stroke[stroke.length - 4], stroke[stroke.length - 3]);

    var tan = next.sub(curPoint);

    var rad = tan.rotate(-Math.PI / 2).normalize().scale(strokeWidth);

    while (i >= 0) {

        rad = tan.rotate(-Math.PI / 2 - step * aIn).normalize().scale(strokeWidth);

        var pt = curPoint.add(rad);
        conv.push(pt.x);
        conv.push(pt.y);

        var rado = rad.rotate(Math.PI / 2.0);

        var tToR = tan.to(rado);
        //console.log("mew");
        //console.log(rado.x);
        //console.log(rado.y);
        //console.log(tToR);
        if (-step / 2 < tToR && tToR < step / 2) {

            i -= 1;
            curPoint = new Vec2(stroke[i * 2], stroke[i * 2 + 1]);
            if (i > 0) {
                tan = new Vec2(stroke[(i - 1) * 2], stroke[(i - 1) * 2 + 1]).sub(curPoint);
            }

            //rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);
        } else if (tToR <= -step / 2) {
            //rad = rad.rotate(-step);
            aIn = aIn - 1;
            if (aIn < 0) {
                aIn = aIn + 2 * steps;
            }
        } else {
            aIn = aIn + 1;
            if (aIn > 2 * steps - 1) {
                aIn = aIn - 2 * steps;
            }
            //rad = rad.rotate(step);
        }

    }

    conv.push(conv[0]);
    conv.push(conv[1]);

    return conv;


}

 


function SmartPressureBrush() {
    this.curStroke = [];
    this.convolved = [];
    this.timer = null;
    this.begin = function (x, y) {
        this.curStroke = [x, y];
        var this_ = this;
        this.timer = setInterval(function() {
            this_.convolved = convolve(this_.curStroke);
        }, 100);
     
    };
    this.addPoint = function(x, y) {
        this.curStroke.push(x, y);
    };
    this.getCurrentPoly = function() {
        return this.convolved;
    };
    
    this.end = function() {
        clearInterval(this.timer);
        this.timer = null;
        var convolved = convolve(this.curStroke);
        console.log(this.curStroke.length);
        console.log(convolved.length);
        this.curStroke = [];
        this.convolved = [];
        return convolved;
    };
}
