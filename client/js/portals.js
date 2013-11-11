function Intersection(alphaP, alphaQ) {
    this.alphaP = alphaP;
    this.alphaQ = alphaQ;
}

function intersect(p1, p2, q1, q2) {
    var wec_p1 = Vec2.out(p1.sub(q1), q2.sub(q1));
    var wec_p2 = Vec2.out(p2.sub(q1), q2.sub(q1));
    if (wec_p1 * wec_p2 <= 0) {
        var wec_q1 = Vec2.out(q1.sub(p1), p2.sub(p1));
        var wec_q2 = Vec2.out(q2.sub(p1), p2.sub(p1));
        if (wec_q1 * wec_q2 <= 0) {
            return new Intersection(
                wec_p1 / (wec_p1 - wec_p2),
                wec_q1 / (wec_q1 - wec_q2));
        }
    }
    return null;
}

function intersectForPoint(p1, p2, q1, q2) {
    var wec_p1 = Vec2.out(p1.sub(q1), q2.sub(q1));
    var wec_p2 = Vec2.out(p2.sub(q1), q2.sub(q1));
    if (wec_p1 * wec_p2 <= 0) {
        var wec_q1 = Vec2.out(q1.sub(p1), p2.sub(p1));
        var wec_q2 = Vec2.out(q2.sub(p1), p2.sub(p1));
        if (wec_q1 * wec_q2 <= 0) {
            var r = wec_p1 / (wec_p1 - wec_p2);
            var x = p1.x * (1 - r) + p2.x * r;
            var y = p1.y * (1 - r) + p2.y * r;
            return new Vec2(x, y);
        }
    }
    return null;
}

function collapseEndpoints(ep) {
    if (ep.length == 0) {
        return ep;
    }
    var result = [ep[0]];
    var last = ep[0];
    var epsilon = 1e-5;
    for (var i = 1; i < ep.length; i++) {
        if (Math.abs(ep[i] - last) < epsilon) continue;
        result.push(ep[i]);
        last = ep[i];
    }
    return result;
}

function getAllEndpoints(segments, eye) {
    var endpoints = [];
    for (var i = 0; i < segments.length; i++) {
        var a = segments[i].a;
        var b = segments[i].b;
        endpoints.push(argAngle(eye, a));
        endpoints.push(argAngle(eye, b));
    }
    for (var i = 0; i < segments.length; i++) {
        for (var j = 0; j < i; j++) {
            var intersection = intersectForPoint(segments[i].a, segments[i].b, segments[j].a, segments[j].b);
            if (intersection) {
                endpoints.push(argAngle(eye, intersection));
            }
        }
    }
    endpoints.sort(function (a, b) { return a - b });
    endpoints = collapseEndpoints(endpoints);
    return endpoints;
}


// Return the wanted indices, not segs!
function filterSegments(segments, frustum) {
    var goodSegs = [];
    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var aArg = argAngle(frustum.eye, seg.a);
        var bArg = argAngle(frustum.eye, seg.b);
        
        var span = bArg - aArg;
        if (span < 0) span += Math.PI * 2;
        if (span > Math.PI) {
            var fromArg = bArg;
            var toArg = aArg;
        } else {
            var fromArg = aArg;
            var toArg = bArg;
        }
        
        if (frustum.containsAngle(aArg) || frustum.containsAngle(bArg)
            || angleBetween(fromArg, toArg, frustum.from) || angleBetween(fromArg, toArg, frustum.to)) {
            goodSegs.push(i);
        }
    }
    return goodSegs;
}

function intersectFirstSegment(segments, eye, dir, minT) {
    if (minT === undefined) {
        minT = 0;
    }
    var min = null;
    var minIndex = -1;
    var d = new Vec2(Math.cos(dir), Math.sin(dir));
    for (var i = 0; i < segments.length; i++) {
        var a = segments[i].a;
        var b = segments[i].b;
        var mat = new Mat2(
            b.x - a.x, -d.x,
            b.y - a.y, -d.y);
        var vec = new Vec2(
            eye.x - a.x,
            eye.y - a.y);
        var sol = mat.inv().mulVec(vec);
        var alpha = sol.x;
        var t = sol.y;
        if (t >= minT && alpha >= 0 && alpha <= 1) {
            if (min === null || t < min) {
                min = t;
                minIndex = i;
            }
        }
    }
    return minIndex;
}

function intersectOneSegment(segment, eye, dir) {
    var d = new Vec2(Math.cos(dir), Math.sin(dir));
    var a = segment.a;
    var b = segment.b;
    var mat = new Mat2(
        b.x - a.x, -d.x,
        b.y - a.y, -d.y);
    var vec = new Vec2(
        eye.x - a.x,
        eye.y - a.y);
    var sol = mat.inv().mulVec(vec);
    var alpha = sol.x;
    var t = sol.y;
    return t;
}

function getAllEndpointsFrustum(segments, frustum) {
    var eye = frustum.eye;
    var endpoints = [];
    function push(ang) {
        if (frustum.containsAngle(ang)) {
            endpoints.push(ang);
        }
    }
    for (var i = 0; i < segments.length; i++) {
        var a = segments[i].a;
        var b = segments[i].b;
        push(argAngle(eye, a));
        push(argAngle(eye, b));
    }
    for (var i = 0; i < segments.length; i++) {
        for (var j = 0; j < i; j++) {
            var intersection = intersectForPoint(segments[i].a, segments[i].b, segments[j].a, segments[j].b);
            if (intersection) {
                push(argAngle(eye, intersection));
            }
        }
        var intersection = intersectForPoint(segments[i].a, segments[i].b, frustum.seg.a, frustum.seg.b);
        if (intersection) {
            push(argAngle(eye, intersection));
        }
    }
    endpoints.push(frustum.from);
    endpoints.push(frustum.to);
    endpoints.sort(function (a, b) {
        var diff = a - b;
        if (diff < 0) {
            diff += Math.PI * 2;
        }
        if (diff >= Math.PI) {
            diff -= Math.PI * 2;
        }
        return diff;
    });
    endpoints = collapseEndpoints(endpoints);
    return endpoints;
}


function getAllIntervalSegmentIndices(endpoints, segments, eye) {
    var indices = [];
    for (var i = 0; i < endpoints.length; i++) {
        if (i == endpoints.length - 1) {
            var dir = (endpoints[i] + endpoints[0]) / 2 - Math.PI;
        } else {
            var dir = (endpoints[i] + endpoints[i + 1]) / 2;
        }
        indices.push(intersectFirstSegment(segments, eye, dir));
    }
    return indices;
}

function getAllIntervalSegmentIndicesFrustum(endpoints, segments, frustum) {
    var indices = [];
    for (var i = 0; i < endpoints.length - 1; i++) {
        var from = endpoints[i];
        var to = endpoints[i + 1];
        if (to < from) {
            to += 2 * Math.PI;
        }
        var dir = (from + to) / 2;
        var minT = intersectOneSegment(frustum.seg, frustum.eye, dir);
        indices.push(intersectFirstSegment(segments, frustum.eye, dir, minT));
    }
    return indices;
}

function coalesceAdjacentIntervals(endpoints, indices) {
    if (endpoints.length == 0) {
        return {
            endpoints: endpoints,
            indices: indices
        };
    }
    var newep = [];
    var newindices = [];
    var current = indices[endpoints.length - 1];
    for (var i = 0; i < endpoints.length; i++) {
        if (indices[i] != current) {
            newep.push(endpoints[i]);
            newindices.push(indices[i]);
            current = indices[i];
        }
    }
    return {
        endpoints: newep,
        indices: newindices
    };
}

function coalesceAdjacentIntervalsFrustum(endpoints, indices) {
    var newep = [endpoints[0]];
    var newindices = [indices[0]];
    var current = indices[0];
    for (var i = 1; i < indices.length; i++) {
        if (indices[i] != current) {
            newep.push(endpoints[i]);
            newindices.push(indices[i]);
            current = indices[i];
        }
    }
    newep.push(endpoints[endpoints.length - 1]);
    return {
        endpoints: newep,
        indices: newindices
    };
}


function IntervalInfo() {
    this.from = 0;
    this.to = 0;
    this.index = -1;
    this.t1 = 0;
    this.t2 = 0;
}

function computeIntervalInfo(segments, eye) {
    var endpoints = getAllEndpoints(segments, eye);
    var indices = getAllIntervalSegmentIndices(endpoints, segments, eye);
    var coalese = coalesceAdjacentIntervals(endpoints, indices);
    endpoints = coalese.endpoints;
    indices = coalese.indices;

    var intervals = [];
    for (var i = 0; i < endpoints.length; i++) {
        var interval = new IntervalInfo();
        interval.from = endpoints[i];
        interval.to = endpoints[(i + 1) % endpoints.length];
        interval.index = indices[i];
        if (interval.index != -1) {
            interval.t1 = intersectOneSegment(segments[interval.index], eye, interval.from);
            interval.t2 = intersectOneSegment(segments[interval.index], eye, interval.to);
        }
        intervals.push(interval);
    }
    return intervals;
}

function computeIntervalInfoFrustum(segments, frustum) {
    var endpoints = getAllEndpointsFrustum(segments, frustum);
    var indices = getAllIntervalSegmentIndicesFrustum(endpoints, segments, frustum);
    var coalese = coalesceAdjacentIntervalsFrustum(endpoints, indices);
    endpoints = coalese.endpoints;
    indices = coalese.indices;

    var intervals = [];
    for (var i = 0; i < endpoints.length - 1; i++) {
        var interval = new IntervalInfo();
        interval.from = endpoints[i];
        interval.to = endpoints[i + 1];
        interval.index = indices[i];
        if (interval.index != -1) {
            interval.t1 = intersectOneSegment(segments[interval.index], frustum.eye, interval.from);
            interval.t2 = intersectOneSegment(segments[interval.index], frustum.eye, interval.to);
        }
        intervals.push(interval);
    }
    return intervals;
}

var CLIPPER_SCALE = 10000;

function toClipperPolygons(poly) {
    var result = [];
    for (var i = 0; i < poly.length; i++) {
        var p = [];
        for (var j = 0; j < poly[i].length; j++) {
            p.push({ X: poly[i][j].x * CLIPPER_SCALE, Y: poly[i][j].y * CLIPPER_SCALE });
        }
        result.push(p);
    }
    return result;
}

function fromClipperPolygons(poly) {
    var result = [];
    for (var i = 0; i < poly.length; i++) {
        var p = [];
        for (var j = 0; j < poly[i].length; j++) {
            p.push(new Vec2(poly[i][j].X / CLIPPER_SCALE, poly[i][j].Y / CLIPPER_SCALE));
        }
        result.push(p);
    }
    return result;
}

function getBigIntervalTargetPolygon(interval, eye) {
    var BIG = 10000;
    var a = new Vec2(eye.x + interval.t1 * Math.cos(interval.from), eye.y + interval.t1 * Math.sin(interval.from));
    var b = new Vec2(eye.x + interval.t2 * Math.cos(interval.to), eye.y + interval.t2 * Math.sin(interval.to));
    var a_far = new Vec2(eye.x + BIG * Math.cos(interval.from), eye.y + BIG * Math.sin(interval.from));
    var b_far = new Vec2(eye.x + BIG * Math.cos(interval.to), eye.y + BIG * Math.sin(interval.to));
    return [a, a_far, b_far, b];
}

function subtractPolygon(subject, clip) {
    var cpr = new ClipperLib.Clipper();
    cpr.AddPolygons(toClipperPolygons(clip), ClipperLib.PolyType.ptClip);
    cpr.AddPolygons(toClipperPolygons(subject), ClipperLib.PolyType.ptSubject);
    var result = new ClipperLib.Polygons();
    cpr.Execute(ClipperLib.ClipType.ctDifference, result,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero);
    return fromClipperPolygons(result);
}

function getIntervalPolys(intervals, eye) {
    var polys = [];
    var indices = [];
    for (var i = 0; i < intervals.length; i++) {
        if (intervals[i].index != -1) {
            polys.push(getBigIntervalTargetPolygon(intervals[i], eye));
            indices.push(i);
        }
    }
    return {
        polys: polys,
        indices: indices
    };
}

function intersectPolygon(poly1, poly2) {
    var cpr = new ClipperLib.Clipper();
    cpr.AddPolygons(toClipperPolygons(poly1), ClipperLib.PolyType.ptClip);
    cpr.AddPolygons(toClipperPolygons(poly2), ClipperLib.PolyType.ptSubject);
    var result = new ClipperLib.Polygons();
    cpr.Execute(ClipperLib.ClipType.ctIntersection, result,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero);
    return fromClipperPolygons(result);
}





function Region(localClip, clip, pad, transform, inverseTransform, frustum) {
    this.localClip = localClip;
    this.clip = clip;
    this.pad = pad;
    this.transform = transform;
    this.inverseTransform = inverseTransform;
    this.frustum = frustum;
}


function renderEverything(padService, homePad, eye, viewport, depth) {
    var result = [];
    if (depth == 0) {
        //result.push({ poly: padService.clipContents(homePad, viewport), transform: Mat2h.identity() });
        result.push(new Region(viewport, viewport, homePad, Mat2h.identity(), Mat2h.identity(), null));
        return;
    }
    var portals = padService.getPortals(homePad);
    var segments = [];
    for (var i = 0; i < portals.length; i++) {
        segments.push(portals[i].fromSeg);
    }
    var intervals = computeIntervalInfo(segments, eye);
    var stuff = getIntervalPolys(intervals, eye);
    var intervalPolys = stuff.polys;
    var polyIndices = stuff.indices;
    var homeClip = subtractPolygon(viewport, intervalPolys);
    //result.push({ poly: padService.clipContents(homePad, homeClip), transform: Mat2h.identity() });
    result.push(new Region(homeClip, homeClip, homePad, Mat2h.identity(), Mat2h.identity(), null));
    for (var i = 0; i < intervalPolys.length; i++) {
        var interval = intervals[polyIndices[i]];
        var foreignClip = intersectPolygon(viewport, [intervalPolys[i]]);
        var frustum = Frustum.fromInterval(interval, eye);
        var portal = portals[interval.index];
        var targetPad = portal.toPad;
        var targetSeg = portal.toSeg;
        var sourceSeg = segments[interval.index];
        var s2tMat = Mat2h.homography(sourceSeg, targetSeg);

        var targetFrustum = s2tMat.mulFrustum(frustum);
        var targetViewport = s2tMat.mulPolys(foreignClip);

        renderFrustum(padService, targetPad, targetFrustum, targetViewport, portal.id, 1 - portal.side, s2tMat.inv(), result, depth - 1);
    }
    return result;

}

function renderFrustum(padService, pad, frustum, viewport, comeFromPortalID, portalSide, transform, result, depth) {
    var eye = frustum.eye;
    if (depth == 0) {
        //result.push({ poly: padService.clipContents(pad, viewport), transform: transform });
        result.push(new Region(viewport, transform.mulPolys(viewport), pad, transform, transform.inv(), transform.mulFrustum(frustum)));
        return;
    }
    var portals = padService.getPortals(pad);
    var segments = [];
    for (var i = 0; i < portals.length; i++) {
        segments.push(portals[i].fromSeg);
    }
    var filter = filterSegments(segments, frustum);

    (function applyFilter() {
        var newPortals = [];
        var newSegs = [];
        for (var i = 0; i < filter.length; i++) {
            var portal = portals[filter[i]];
            if (portal.id == comeFromPortalID && portal.side == portalSide) continue;
            newPortals.push(portal);
            newSegs.push(segments[filter[i]]);
        }
        portals = newPortals;
        segments = newSegs;
    })();

    var intervals = computeIntervalInfoFrustum(segments, frustum);
    var stuff = getIntervalPolys(intervals, eye);
    var intervalPolys = stuff.polys;
    var polyIndices = stuff.indices;
    var homeClip = subtractPolygon(viewport, intervalPolys);
    //result.push({ poly: padService.clipContents(pad, homeClip), transform: transform });
    result.push(new Region(homeClip, transform.mulPolys(homeClip), pad, transform, transform.inv(), transform.mulFrustum(frustum)));
    for (var i = 0; i < intervalPolys.length; i++) {
        var interval = intervals[polyIndices[i]];
        var foreignClip = intersectPolygon(viewport, [intervalPolys[i]]);
        var frustum = Frustum.fromInterval(interval, eye);
        var portal = portals[interval.index];
        var targetPad = portal.toPad;
        var targetSeg = portal.toSeg;
        var sourceSeg = segments[interval.index];
        var s2tMat = Mat2h.homography(sourceSeg, targetSeg);

        var targetFrustum = s2tMat.mulFrustum(frustum);
        var targetViewport = s2tMat.mulPolys(foreignClip);

        renderFrustum(padService, targetPad, targetFrustum, targetViewport, portal.id, 1 - portal.side, transform.mulMat(s2tMat.inv()), result, depth - 1);
    }

}

