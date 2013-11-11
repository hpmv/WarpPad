
      //what is step?
      var steps = 20;
      var step = Math.PI/steps;
      
      
      var convolvedPts = [];
      
      var DELTA_WIDTH = 0.3;
      var MAX_WIDTH = 7;
      var strokeWidth = 0.2;
      var convolve = function(){

        console.log("convolving");
        if(curStroke.length < 4){
          convolvedPts = [];
          return;
        }

        strokeWidth = 0.5;
        var conv = [];
        conv.push(curStroke[0]);
        conv.push(curStroke[1]);

        var i = 0;
        var aIn = 0;
        var curPoint = new Vec2(curStroke[0], curStroke[1]);
        var next = new Vec2(curStroke[2], curStroke[3]);
         
        var tan = next.sub(curPoint);
       
        var rad = tan.rotate(-Math.PI/2).normalize().scale(strokeWidth);
        var length = curStroke.length;
        while (i < curStroke.length/2){

          
          //console.log(strokeWidth);
          rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);

          var pt = curPoint.add(rad);
          conv.push(pt.x);
          conv.push(pt.y);

          var rado = rad.rotate(Math.PI/2.0);
          
          var tToR = tan.to(rado);
          //console.log("mew");
          //console.log(rado.x);
          //console.log(rado.y);
          //console.log(tToR);
          if(-step/2 < tToR && tToR < step/2){
              i+=1;
              strokeWidth = Math.min(DELTA_WIDTH * Math.min(i*2, length - i*2 + 2), MAX_WIDTH);
              curPoint = new Vec2(curStroke[i*2], curStroke[i*2+1]);
              if(i < curStroke.length/2 -1 ){
                tan = new Vec2(curStroke[(i+1)*2], curStroke[(i+1)*2 + 1]).sub(curPoint);
            }
          
              //rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);
          } else if(tToR <= -step/2){
            //rad = rad.rotate(-step);
            aIn = aIn - 1;
            if (aIn < 0) {
              aIn = aIn + 2*steps;
            }
          } else {
            aIn = aIn + 1;
            if (aIn > 2*steps-1) {
              aIn = aIn - 2*steps;
            }
            //rad = rad.rotate(step);
          }

        }

      

        
        // other dir
        conv.push(curStroke[curStroke.length - 2]);
        conv.push(curStroke[curStroke.length - 1]);


        var i = curStroke.length/2 - 1;
        var aIn = 0;
        var curPoint = new Vec2(curStroke[curStroke.length-2], curStroke[curStroke.length-1]);
        var next = new Vec2(curStroke[curStroke.length-4], curStroke[curStroke.length-3]);
         
        var tan = next.sub(curPoint);
       
        var rad = tan.rotate(-Math.PI/2).normalize().scale(strokeWidth);
         
        while (i >= 0){
          
          rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);

          var pt = curPoint.add(rad);
          conv.push(pt.x);
          conv.push(pt.y);

          var rado = rad.rotate(Math.PI/2.0);
          
          var tToR = tan.to(rado);
          //console.log("mew");
          //console.log(rado.x);
          //console.log(rado.y);
          //console.log(tToR);
          if(-step/2 < tToR && tToR < step/2){

              i-=1;
              curPoint = new Vec2(curStroke[i*2], curStroke[i*2+1]);
              if(i > 0 ){
                tan = new Vec2(curStroke[(i-1)*2], curStroke[(i-1)*2 + 1]).sub(curPoint);
            }
          
              //rad = tan.rotate(-Math.PI/2 - step * aIn).normalize().scale(strokeWidth);
          } else if(tToR <= -step/2){
            //rad = rad.rotate(-step);
            aIn = aIn - 1;
            if (aIn < 0) {
              aIn = aIn + 2*steps;
            }
          } else {
            aIn = aIn + 1;
            if (aIn > 2*steps-1) {
              aIn = aIn - 2*steps;
            }
            //rad = rad.rotate(step);
          }

        }

        conv.push(conv[0]);
        conv.push(conv[1]);

        convolvedPts = conv;


      }      
      setInterval(convolve,1);

      function writeMessage(message) {
        text.setText(message);
        layer.draw();
      }
      var stage = new Kinetic.Stage({
        container: 'markerboard',
        width: 800,
        height: 600
      });
      var layer = new Kinetic.Layer();
      var savedLayer = new Kinetic.Layer();
            

      
      var text = new Kinetic.Text({
        x: 10,
        y: 10,
        fontFamily: 'Calibri',
        fontSize: 24,
        text: '',
        fill: 'black'
      });

      var canvas = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: stage.getWidth(),
        height: stage.getHeight(),
        fill: 'white',
        stroke: 'white',
        strokeWidth: 0,
      });




      var rectangle = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4,
      });
      var down = false;
      var curStroke = [];
      var strokes = [];
      var curShape =undefined;
      var debugMew = undefined;


      beginStroke = function() {
        writeMessage('Mousedown mew');
        down = true;
        curStroke = [];
        curShape = new Kinetic.Line({
        points: [1, 0],
        stroke: 'red',
        strokeWidth: 2,
        lineJoin: 'round',
        /*
         * line segments with a length of 33px
         * with a gap of 10px
         */
        
        });
        
      };


      window.onmousedown = beginStroke;


     

 

      endStroke = function() {
        writeMessage('Mousedup mew');
        down = false;
        if(curShape != undefined){
          curShape.remove();

        }

        
        if (convolvedPts.length > 4) {
          var shape =new Kinetic.Polygon({
              points: convolvedPts,
              lineJoin: 'round',
              fill: '#f92672',
              /*
               * line segments with a length of 33px
               * with a gap of 10px
               */
            
            });    

          layer.add(shape);
          curStroke = [];
          layer.batchDraw();
        
       }
          
      };

    
    var collectPoints = function (){
        
        if(down == true){
          writeMessage('drawing mew');

         
          curStroke.push(e.layerX + 10);
          curStroke.push(e.layerY);
          if(curShape != undefined){
           curShape.remove();
          }
        
          if(convolvedPts.length > 4){

            curShape = new Kinetic.Polygon({
              points: convolvedPts,
             
              fill: '#ae81ff',
              /*
               * line segments with a length of 33px
               * with a gap of 10px
               */
            
            });




            savedLayer.add(curShape);
            savedLayer.batchDraw();
          }
        }
        
    }
     


      window.onmouseup = endStroke;
     

      layer.add(text);
      layer.add(canvas);
      
      stage.add(layer);

      stage.add(savedLayer);
      savedLayer.draw();
