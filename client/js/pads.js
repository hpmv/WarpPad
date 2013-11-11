var APP_KEY="b85bfb4e8c9bc47f35d2";
var pusher = new Pusher(APP_KEY);
var channel = pusher.subscribe('master_channel');
var URL="localhost:3000/";
console.log(pusher.connection.state);
channel.bind('padadded', function(data) {
	alert("received push");
	console.log(data);
	// UPDATE THE PADS LIST
});

for (var i=1; i<=20; i++){
	var channel = pusher.subscribe(i.toString());
	channel.bind('update', function(data) {
		console.log(data);
		var action=data['action'];
		if (action=="create"){
			PadManager.prototype.addPolygon(data['polygon'],{meta:{color:data['color']}});
		}
			
	});
	channel.bind('portal_update', function(data) {
		console.log(data);
		var action=data['action'];
		if (action=="create"){
			PadManager.prototype.addPortal(data['pad1'], data['pad2'], data['portal1'], data['portal2'], data['name']);
		}
	});
}

function PadManager() {
    this.pads = [];
    this.portals = {};
    this.polys = {};
    this.version = -1;
    this.nextPortalId = 1; // TODO: use server.
    this.nextPadId = 1; // TODO: use server.
}





PadManager.prototype.newPad = function() {
/*
    var id;
    $.ajax({
      url: "/newpad"
    }).done(function(response) {
      id = response.pad;
    });
	*/
	var id=this.nextPadId;
	this.nextPadId+=1;
    this.pads.push(id);
    this.portals[id] = [];
    this.polys[id] = [];
    return id;
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
        ctx.fillStyle = meta.fill;
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
	var this_=this;
    this.polys[pad].push({poly: poly, meta: meta});
	alert("yo");
    $.ajax({
        url: URL+"pads/"+pad,
        type: "patch",
        data: {poly: poly, color: meta['fill'],pad:pad,version:this._version,action:"create"}
    }).done(function(data){
        
    });
}

PadManager.prototype.addPortal = function(fromPad, toPad, fromSeg, toSeg, id) {
    var this_ = this;
	if (id===undefined) id=Math.random().toString(36).substring(7);;
    $.post(URL+"pads/portals/new",
        {name:id, pad1: fromPad, pad2: toPad, version:this_.version, portal1:JSON.stringify(fromSeg), portal2:JSON.stringify(toSeg), action:"create"},
        function(data){
        });
    this.portals[fromPad].push({
        id: id, fromPad: fromPad, toPad: toPad, fromSeg: fromSeg, toSeg: toSeg, side: 0
    });
    this.portals[toPad].push({
        id: id, fromPad: toPad, toPad: fromPad, fromSeg: toSeg, toSeg: fromSeg, side: 1
    });
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
	var this_ = this;
    $.ajax({
        url: URL+"pads/portals/new",
        type: "post",
        data: {removeid:id, action:"delete"}
    });
}

function PadEnvironment(padManager, homePad, width, height) {
    this.manager = padManager;
    this.eye = null;
    this.homePad = homePad;
    this.regions = [];
    this.width = width;
    this.height = height;
    this.depth = 2;
    this.transform = Mat2h.identity();
}

PadEnvironment.prototype.getViewport = function() {
    var screen = [new Vec2(0, 0), new Vec2(0, this.height), new Vec2(this.width, this.height), new Vec2(this.width, 0)];
    return this.transform.mulPolys([screen]);
}

PadEnvironment.prototype.updatePortaling = function() {
    this.regions = renderEverything(this.manager, this.homePad, this.eye, this.getViewport(), this.depth);
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
    var BIG = 1000;
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
	alert("yo");
    for (var i=0;i<this.regions.length;i++) {
        var region = this.regions[i];
        var clipped = intersectPolygon(region.clip, [poly]);
        if (clipped.length > 0) {
            var newPoly = region.inverseTransform.mulPolys(clipped);
            this.manager.addPolygon(region.pad, newPoly, meta);
        }
    }
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
    manager.renderPolygons(pad, null, ctx);
    
    texture.needsUpdate = true;
    return texture;
}