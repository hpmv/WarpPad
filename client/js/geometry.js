function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

Vec2.prototype.add = function (b) {
    return new Vec2(this.x + b.x, this.y + b.y);
}

Vec2.prototype.sub = function (b) {
    return new Vec2(this.x - b.x, this.y - b.y);
}

Vec2.prototype.mul = function (sc) {
    return new Vec2(this.x * sc, this.y * sc);
}

Vec2.prototype.div = function (sc) {
    return new Vec2(this.x / sc, this.y / sc);
}

Vec2.prototype.neg = function () {
    return new Vec2(-this.x, -this.y);
}

Vec2.dot = function (a, b) {
    return a.x * b.x + a.y * b.y;
}

Vec2.out = function (a, b) {
    return a.x * b.y - a.y * b.x;
}

Vec2.prototype.copy = function () {
    return new Vec2(this.x, this.y);
}


Vec2.prototype.rotate = function(rad){
var tempX = this.x*Math.cos(rad) - this.y *Math.sin(rad);
var tempY = this.x*Math.sin(rad) + this.y *Math.cos(rad);
return new Vec2(tempX, tempY);

}

Vec2.prototype.abs = function () {
 return Math.sqrt(Vec2.dot(this, this));
}


Vec2.prototype.normalize = function() {
  var len = this.abs();
  if (len == 0) {
    return new Vec2(0, 0);
  }
  var tempX = this.x/len;
  var tempY = this.y/len;
  return new Vec2(tempX, tempY);
}

Vec2.prototype.scale = function(k) {
  return new Vec2(this.x *k, this.y *k);
}

Vec2.prototype.angle = function(){
//console.log(this.x);
//console.log(this.y);
return Math.atan2(this.x, this.y);
}

Vec2.prototype.to = function(other){
var res = other.angle() - this.angle();
if (res < - Math.PI){
  res = res + 2*Math.PI;
} else if (res >= Math.PI){
  res = res - 2*Math.PI;
}
return res;
}

function Segment(a, b) {
    this.a = a;
    this.b = b;
}

Segment.prototype.copy = function () {
    return new Segment(this.a.copy(), this.b.copy());
}

function Mat2(a, b, c, d) {
    this.a11 = a;
    this.a12 = b;
    this.a21 = c;
    this.a22 = d;
}

Mat2.prototype.det = function () {
    return this.a11 * this.a22 - this.a12 * this.a21;
}

Mat2.prototype.inv = function () {
    var k = 1 / this.det();
    return new Mat2(k * this.a22, k * -this.a12, k * -this.a21, k * this.a11);
}

Mat2.prototype.mulVec = function (v) {
    return new Vec2(
        this.a11 * v.x + this.a12 * v.y,
        this.a21 * v.x + this.a22 * v.y);
}

Mat2.prototype.mulMat = function (m) {
    return new Mat2(
        this.a11 * m.a11 + this.a12 * m.a21,
        this.a11 * m.a12 + this.a12 * m.a22,
        this.a21 * m.a21 + this.a22 * m.a21,
        this.a21 * m.a12 + this.a22 * m.a22);
}

function Mat2h(a11, a12, a21, a22, x, y) {
    this.a11 = a11;
    this.a12 = a12;
    this.a21 = a21;
    this.a22 = a22;
    this.x = x;
    this.y = y;
}

Mat2h.prototype.mulMat = function (m) {
    return new Mat2h(
        this.a11 * m.a11 + this.a12 * m.a21,
        this.a11 * m.a12 + this.a12 * m.a22,
        this.a21 * m.a11 + this.a22 * m.a21,
        this.a21 * m.a12 + this.a22 * m.a22,
        this.a11 * m.x + this.a12 * m.y + this.x,
        this.a21 * m.x + this.a22 * m.y + this.y);
}

Mat2h.prototype.mulVec = function (v) {
    return new Vec2(
        this.a11 * v.x + this.a12 * v.y + this.x,
        this.a21 * v.x + this.a22 * v.y + this.y);
}

Mat2h.prototype.mulSeg = function(s) {
    return new Segment(
        this.mulVec(s.a), this.mulVec(s.b));
}

Mat2h.prototype.inv = function () {
    var r = 1 / (this.a11 * this.a22 - this.a12 * this.a21);
    return new Mat2h(
        this.a22 * r,
        -this.a12 * r,
        -this.a21 * r,
        this.a11 * r,
        (this.a12 * this.y - this.a22 * this.x) / r,
        (this.a21 * this.x - this.a11 * this.y) / r);
}

Mat2h.prototype.mulNorm = function (v) {
    return new Vec2(
        this.a11 * v.x + this.a12 * v.y,
        this.a21 * v.x + this.a22 * v.y);
}

Mat2h.prototype.mulFrustum = function (f) {
    return new Frustum(
        this.mulVec(f.eye),
        this.mulVec(f.seg.a),
        this.mulVec(f.seg.b));
}

Mat2h.prototype.mulPoly = function (p) {
    var newP = [];
    for (var i = 0; i < p.length; i++) {
        newP.push(this.mulVec(p[i]));
    }
    return newP;
}

Mat2h.prototype.mulPolys = function (p) {
    var newP = [];
    for (var i = 0; i < p.length; i++) {
        newP.push(this.mulPoly(p[i]));
    }
    return newP;
}

Mat2h.translate = function (v) {
    return new Mat2h(1, 0, 0, 1, v.x, v.y);
}

Mat2h.vecRotate = function (v) {
    return new Mat2h(v.x, -v.y, v.y, v.x, 0, 0);
}

Mat2h.identity = function () {
    return new Mat2h(1, 0, 0, 1, 0, 0);
}

// Given two segments, return a rigid transform that takes one to the other
Mat2h.homography = function (from, to) {
    var T1 = Mat2h.translate(from.a.neg());
    var T2 = Mat2h.translate(to.a);
    var R1 = Mat2h.vecRotate(from.b.sub(from.a));
    var R2 = Mat2h.vecRotate(to.b.sub(to.a));
   
    return T2.mulMat(R2.mulMat(R1.inv().mulMat(T1)));
}

function Frustum(eye, p, q) {
    this.eye = eye;
    this.seg = new Segment(p, q);
    this.from = argAngle(eye, p);
    this.to = argAngle(eye, q);
    var span = this.to - this.from;
    if (span < 0) span += Math.PI * 2;
    if (span > Math.PI) {
        var temp = this.from;
        this.from = this.to;
        this.to = temp;
    }
}

Frustum.fromInterval = function (interval, eye) {
    var frustum = new Frustum(eye,
        offsetPoint(eye, interval.from, interval.t1),
        offsetPoint(eye, interval.to, interval.t2));
    return frustum;
}

function angleBetween(from, to, ang) {
    if (to > from) {
        return to >= ang && from <= ang;
    } else {
        return (to >= ang && from - 2 * Math.PI <= ang)
            || (to + 2 * Math.PI >= ang && from <= ang);
    }
}

Frustum.prototype.containsAngle = function (ang) {
    return angleBetween(this.from, this.to, ang);
}

function offsetPoint(from, angle, dist) {
    return new Vec2(from.x + dist * Math.cos(angle), from.y + dist * Math.sin(angle));
}

function argAngle(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
}

