//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var pads = [];
var portals = {};
var polys = {};
var xportals = {};
var xpolys = {};
var version = 0;
var socketSyncs = [];
var sockets = [];
var commands = [];

for (var i=1;i<21;i++) {
pads.push(i);
xportals[i] = [];
xpolys[i] = [];
}


for (var i=1;i<21;i++) {
portals[i] = [];
polys[i] = [];
}


io.on('connection', function (socket) {
  socket.emit('all', {
	  pads: pads,
	  portals: xportals,
	  polys: xpolys,
	  version: 0
  });
  for (var i=0;i<commands.length;i++) {
	socket.emit(commands[i], messages[i]);
	}

    var index = sockets.length;
    sockets.push(socket);
    socketSyncs.push(version);
    

    socket.on('disconnect', function () {
        var index = sockets.indexOf(socket);
      sockets.splice(index, 1);
      socketSyncs.splice(index, 1);
    });

    socket.on('addpoly', function (msg) {
      var poly = msg.poly;
      var pad = msg.pad;
	  var meta = msg.meta;
      polys[pad].push({poly:poly, meta:meta});
      version++;
      socketSyncs[index]++;
      messages.push(msg);
      commands.push('addpoly');
      catchup();
    });

    socket.on('addportal', function (msg) {
      var fromPad = msg.fromPad;
      var toPad = msg.toPad;
      var id = msg.id;
      var fromSeg = msg.fromSeg;
      var toSeg = msg.toSeg;
      
      portals[fromPad].push({
          id: id, fromPad: fromPad, toPad: toPad, fromSeg: fromSeg, toSeg: toSeg, side: 0
      });
      portals[toPad].push({
          id: id, fromPad: toPad, toPad: fromPad, fromSeg: toSeg, toSeg: fromSeg, side: 1
      });
      
      version++;
      socketSyncs[index]++;
      messages.push(msg);
      commands.push('addportal');
      catchup();
    });

    socket.on('delportal', function (msg) {
      var id = msg.id;
      for (var pad in this.portals) {
        var pp = portals[pad];
        for (var i=0;i<pp.length;i++) {
            if (pp[i].id == id) {
                pp.splice(i, 1);
                i--;
            }
        }
        }
      
      version++;
      socketSyncs[index]++;
      messages.push(msg);
      commands.push('delportal');
      catchup();
    });

function catchup() {
	console.log(JSON.stringify(socketSyncs));
    for(var i=0;i<sockets.length;i++) {
        while(socketSyncs[i]<version) {
            sockets[i].emit(commands[socketSyncs[i]], messages[socketSyncs[i]]);
            socketSyncs[i]++;
        }
    }
    console.log("Synced to version: " + version);
}
    
  });
  

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Pad server listening at", addr.address + ":" + addr.port);
});
