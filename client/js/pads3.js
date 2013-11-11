
var eyeImg = new Image();
eyeImg.src = 'img/eye.png';

function PadManager(username) {
    this.username = username;
    this.pads = [];
    this.portals = {};
    this.polys = {};
    this.version = -1;
    this.nextPortalId = 1; // TODO: use server.
    this.suppress = false;
    this.socket = null;
}

var endpoint = 'http://localhost:3000';

PadManager.prototype.initialize = function(callback, redrawCallback) {
    var this_ = this;
    this.socket = io.connect(endpoint);
    this.socket.on('all', function(data) {
        this_.pads = data.pads;
        this_.portals = data.portals;
        this_.polys = data.polys;
        this_.versions = data.versions;
        callback();
    });
    this.socket.on('addpoly', function(data) {
        this_.suppress = true;
        this_.addPolygon(data.pad, Mat2h.identity().mulPolys(data.poly), data.meta);
        this_.suppress = false;
        redrawCallback(false);
    });
    this.socket.on('addportal', function(data) {
        this_.suppress = true;
        this_.addPortal(data.fromPad, data.toPad, Mat2h.identity().mulSeg(data.fromSeg), Mat2h.identity().mulSeg(data.toSeg), data.id);
        this_.suppress = false;
        redrawCallback(true);
    });
    this.socket.on('delportal', function(data) {
        this_.suppress = true;
        this_.deletePortal(data.id);
        this_.suppress = false;
        redrawCallback(true);
    });
}

PadManager.prototype.getPortals = function(pad) {
    return this.portals[pad];
}

PadManager.prototype.clipPolygons = function(pad, clip) {
    var result = [];
    var polys = this.polys[pad];
    for (var i=0;i<polys.length;i++) {
        var poly = polys[i].poly;
        var meta = polys[i].meta;
        var clipped = intersectPolygon(clip, poly);
        if (clipped.length > 0)
        result.push({
            poly: clipped,
            meta: meta
        });
    }
    return result;
}

PadManager.prototype.renderPolygons = function(pad, clip, ctx) {
    var polys = this.polys[pad];
    for (var i=0;i<polys.length;i++) {
        var poly = polys[i].poly;
        var meta = polys[i].meta;
        if ('_context' in ctx) {
            ctx._context.fillStyle = meta.fill;
        } else {
            ctx.fillStyle = meta.fill;
        }
        ctx.beginPath();
        var clipped = clip? intersectPolygon(clip, poly) : poly;
        for (var j=0;j<clipped.length;j++) {
            for (var k=0;k<clipped[j].length;k++) {
                var point = clipped[j][k];
                if (!k) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

PadManager.prototype.addPolygon = function(pad, poly, meta) {
    this.polys[pad].push({poly: poly, meta: meta});
    if (!this.suppress) {
        this.socket.emit('addpoly', {
            pad: pad, poly: poly, meta: meta
        });
    }
}

PadManager.prototype.addPortal = function(fromPad, toPad, fromSeg, toSeg) {
    var id = this.username + this.nextPortalId++; // TODO: use server
    this.portals[fromPad].push({
        id: id, fromPad: fromPad, toPad: toPad, fromSeg: fromSeg, toSeg: toSeg, side: 0
    });
    this.portals[toPad].push({
        id: id, fromPad: toPad, toPad: fromPad, fromSeg: toSeg, toSeg: fromSeg, side: 1
    });
    if (!this.suppress) {
        this.socket.emit('addportal', {
            id: id, fromPad: fromPad, toPad: toPad, fromSeg: fromSeg, toSeg: toSeg
        });
    }
    return id;
}

PadManager.prototype.deletePortal = function(id) {
    for (var pad in this.portals) {
        var portals = this.portals[pad];
        for (var i=0;i<portals.length;i++) {
            if (portals[i].id == id) {
                portals.splice(i, 1);
                i--;
            }
        }
    }
    if (!this.suppress) {
        this.socket.emit('delportal', {
            id: id
        });
    }
}

function PadEnvironment(padManager, homePad, width, height) {
    this.manager = padManager;
    this.eye = null;
    this.homePad = homePad;
    this.regions = [];
    this.width = width;
    this.height = height;
    this.depth = 5;
    this.transform = Mat2h.identity();
}

PadEnvironment.prototype.getViewport = function() {
    var screen = [new Vec2(0, 0), new Vec2(0, this.height), new Vec2(this.width, this.height), new Vec2(this.width, 0)];
    return this.transform.inv().mulPolys([screen]);
}

PadEnvironment.prototype.updatePortaling = function() {
    if (this.eye == null) {
        this.regions = [new Region(this.getViewport(), this.getViewport(), this.homePad, Mat2h.identity(), Mat2h.identity(), null)];
    } else {
        this.regions = renderEverything(this.manager, this.homePad, this.eye, this.getViewport(), this.depth);
    }
}

function arrayContains(arr, ele) {
    for (var i=0;i<arr.length;i++) {
        if(arr[i]==ele) return true;
    }
    return false;
}

PadEnvironment.prototype.renderContents = function(ctx, pads) {
    // todo: optimize and correct
    ctx.clearRect(0, 0, 800, 600);
    ctx.save();
    var baseTransform = this.transform;
    ctx.transform(baseTransform.a11, baseTransform.a21, baseTransform.a12, baseTransform.a22, baseTransform.x, baseTransform.y);
    for (var i=0;i<this.regions.length;i++) {
        //if (!arrayContains(pads, region.pad)) continue;
        var region = this.regions[i];
        var t = region.transform;
        
        ctx.save();
        ctx.transform(t.a11, t.a21, t.a12, t.a22, t.x, t.y);
        this.manager.renderPolygons(region.pad, region.localClip, ctx);
        ctx.restore();
    }
    ctx.restore();
}

PadEnvironment.prototype.renderFrustumsAndPortals = function(ctx) {
    // todo: correct
    ctx.clearRect(0, 0, 800, 600);
    ctx.save();
    var baseTransform = this.transform;
    ctx.transform(baseTransform.a11, baseTransform.a21, baseTransform.a12, baseTransform.a22, baseTransform.x, baseTransform.y);
    for (var i=0;i<this.regions.length;i++) {
        var region = this.regions[i];
        if (region.frustum != null) {
            this.renderFrustum(ctx, region.frustum);
        }
    }
    for (var i=0;i<this.regions.length;i++) {
        var region = this.regions[i];
        if (region.frustum != null) {
            this.renderPortal(ctx, region.frustum);
        }
    }
    ctx.restore();
}

PadEnvironment.prototype.renderFrustum = function(ctx, frustum) {
    var BIG = 10000;
    var pp = frustum.seg.a;
    var pf = offsetPoint(frustum.eye, frustum.from, BIG);
    var qp = frustum.seg.b;
    var qf = offsetPoint(frustum.eye, frustum.to, BIG);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#cccccc";
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(pf.x, pf.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(qp.x, qp.y);
    ctx.lineTo(qf.x, qf.y);
    ctx.stroke();
}



PadEnvironment.prototype.renderEye = function(ctx){
    if(this.eye != null){
        
        var newE = this.transform.mulVec(this.eye);
        //eyeImg.onload = function(){
                ctx.drawImage(eyeImg,newE.x - 23,newE.y - 20);
        //}
    }
    
}

PadEnvironment.prototype.renderPortal = function(ctx, frustum) {
    var pp = frustum.seg.a;
    var qp = frustum.seg.b;
    ctx.strokeStyle = "#ff88ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(qp.x, qp.y);
    ctx.stroke();
}

PadEnvironment.prototype.addPolygon = function(poly, meta) {
    poly = this.transform.inv().mulPoly(poly);
    for (var i=0;i<this.regions.length;i++) {
        var region = this.regions[i];
        var clipped = intersectPolygon(region.clip, [poly]);
        if (clipped.length > 0) {
            var newPoly = region.inverseTransform.mulPolys(clipped);
            this.manager.addPolygon(region.pad, newPoly, meta);
        }
    }
}

PadEnvironment.prototype.setEye = function(eye) {
    this.eye = (eye == null? null : this.transform.inv().mulVec(eye));
}

function getPadTexture(manager, pad) {
    var canvas = document.createElement('canvas');
    var texture = new THREE.Texture(canvas)
    canvas.width = 200;
    canvas.height = 150;
    var ctx = canvas.getContext('2d');
    ctx.rect(0, 0, 200, 150);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.rect(0, 0, 200, 150);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.transform(0.25, 0, 0, 0.25, 0, 0);
    manager.renderPolygons(pad, [[new Vec2(0, 0), new Vec2(0, 600), new Vec2(800, 600), new Vec2(800, 0)]], ctx);
    
    texture.needsUpdate = true;
    return texture;
}