// Turtle Graphics module for <canvas id="..." width=... height=...></canvas>
// This is pseudo 3D: each turtle moves in 3D space, but it is projected on
// the x,y-plane, and order along the z-coordinate is based on time rather
// than space, i.e. the most recent passage over an x,y-point is drawn last,
// regardsless of its z-coordinate.
//
// Usage example
//   <script type="text/javascript" src="turtle-graphics.js"></script>
//   ...
//   <canvas id="TGspace" width="400" height="300"></canvas>
//   <script>
//   with ( TurtleGraphics ) {
//     SetDefaults({ canvasID: 'TGspace', unit = 30 });
//     var turtle = new Turtle();
//     with ( turtle ) {
//       DrawTurtle('blue');
//       Move(1); Turn(90); Move(1);
//       DrawTurtle('red');
//     }
//   }
//
// N.B. On a canvas x+ is to the right, and y+ is down (not up).
// For the turtle state, x+ is down on the canvas, y+ is to the right.
// Thus turtle position [a, b, c] is at canvas position (b, a).
// We start the turtle heading to the right.  This creates the
// impression that x+ is to the right and y+ is above.
//
// Author: Tom Verhoeff (Eindhoven University of Techology, Netherlands)
// Contact information: <T.Verhoeff@tue.nl>
// License: GPL version 3

var TurtleGraphics; // the single identifier needed in the global scope

if ( ! TurtleGraphics ) {
  TurtleGraphics = { };
}

// Define private constants, variables, and functions via a closure, and
// export public entities to global variable TurtleGraphics.
(function () {

// Define private constants

// A vector in 3D space is stored as a 3-element array.
// The following constants are to index a vector.
var /* const */ x = 0;
var /* const */ y = 1;
var /* const */ z = 2;

var /* const */ Degree = Math.PI / 180.0; // conversion factor for degrees to radians

// Define private variables

var defaults = [ { canvasID: 'TGspace', unit: 30 } ]; // organized as stack

// Define private functions

function cloneObject(source) {
  for (i in source) {
    if (typeof source[i] == 'object') {
      this[i] = new cloneObject(source[i]);
    }
    else {
      this[i] = source[i];
    }
  }
}

function top(a) {
  // Return what is on top of stack a
  // Requires: a is a non-empty array
  // Ensures: result = last (topmost) element
  return a[a.length - 1];
}

function linear(a, u, b, v) {
  // Return linear combination of u and v
  // Requires: u, v are vectors, a is a number
  // Ensures: result = a * u + b * v
  var result = [ ];
  for (var c = x; c <= z; ++c) {
    result[c] = a * u[c] + b * v[c];
  }
  return result;
}

function cross(u, v) {
  // Return cross product of u and v
  // Requires: u, v are vectors
  // Ensures: result = cross product of u and v
  var result = [ ];
  for (var c = x; c <= z; ++c) {
    result[c] = u[(c+1)%3] * v[(c+2)%3] - u[(c+2)%3] * v[(c+1)%3];
  }
  return result;
}

function rotateNormal(u, v, w, alpha) {
  // Return rotation of u in direction of v about w over alpha
  // Requires: u, v, w are vectors; alpha is angle in radians
  //   u, v, w are orthonormal
  // Ensures: result = u rotated in direction of v about w over alpha
  return linear(Math.cos(alpha), u, Math.sin(alpha), v);
}


// Define functions to be made public

// Constructor for Turtle objects
function Turtle() {
  // Construct new turtle.
  // Optional argument is passed to Init()
  // Define public properties
  this.log = '';
  this.logging = false;
  
  // Initialize (define and initialize remaining public properties
  if ( arguments.length >= 1 ) {
    this.Init(arguments[0]);
  }
  else {
    this.Init();
  }
}

// Define shared properties of all Turtle objects
Turtle.prototype.Degree = Degree;


// Define public methods of Turtle objects

Turtle.prototype.Home = function () {
  // Put turtle in initial state
  with ( this ) {
    if ( logging ) {
      log += 'Home();\n';
    }
    position = home;
    heading = [0.0, 1.0, 0.0]; // to the right; in turtle space x+ direction
    normal = [0.0, 0.0, 1.0]; // in z+ direction
  }
};

Turtle.prototype.Init = function () {
  // Initialize the turtle.
  // Optional argument is object with some initial values:
  //   options.origin = string of the form /(t|m|b)(l|c|r)/
  //     t = top, m = middle, b = bottom, l = left, c = center, r = right
  //   options.unit = unit length in pixels
  //   options.canvasID = id of canvas element for drawing
  var options = { };
  if ( arguments.length >= 1 ) {
    options = arguments[0];
  }
  //writeObject('option = ', option);
  this.unit = top(defaults).unit; // position scaling to define the unit length
  if ( options.unit ) {
    this.unit = options.unit;
  }
  this.canvasID = top(defaults).canvasID;
  if ( options.canvasID ) {
    this.canvasID = options.canvasID;
  }
  this.context = document.getElementById(this.canvasID).getContext('2d');
  //writeObject(this.context.canvas, 'canvas'); // test
  //writeObject(this.context, 'context'); // test
  with ( this.context ) {
    var x0 = canvas.height / 2;
    var y0 = canvas.width / 2;
    if ( options.origin ) {
      for (var i = 0; i != options.origin.length; ++i) {
      switch ( options.origin.charAt(i) ) {
        case 't': x0 = 0.0; break;
        case 'm': x0 = canvas.height / 2; break;
        case 'b': x0 = canvas.height; break;
        case 'l': y0 = 0.0; break;
        case 'c': y0 = canvas.width / 2; break;
        case 'r': y0 = canvas.width; break;
      }
    }
  }
  this.home = [x0, y0, 0.0]; // its origin
  this.position = [ ]; // set by Home()
  this.heading = [ ]; // set by Home()
  this.normal = [ ]; // set by Home()
  this.pen = true; // active
  this.penStyle = 'black';
  this.penWidth = 2;
  this.Home();
  this.logging = true;
  //writeObject(this, 'this');
  }
}

Turtle.prototype.Clean = function () {
  // Clean the canvas
  // Optional second argument is color
  with ( this ) {
    if ( logging ) {
      var arg = '';
      if ( arguments.length >= 1 ) {
        arg = '\'' + arguments[0] + '\'';
      }
      log += 'Clean(' + arg + ');\n';
    }
    if ( arguments.length >= 1 ) {
      Clear(canvasID, arguments[0]);
    }
    else {
      Clear(canvasID);
    }
  }
}

Turtle.prototype.PenActive = function (b) {
  with ( this ) {
    if ( logging ) {
      log += 'PenActive(' + b + ');\n';
    }
    pen = b;
  }
}

Turtle.prototype.PenDown = function () {
  with ( this ) {
    if ( logging ) {
      log += 'PenDown();\n';
    }
    pen = true;
  }
}

Turtle.prototype.PenUp = function () {
  with ( this ) {
    if ( logging ) {
      log += 'PenUp();\n';
    }
    pen = false;
  }
}

Turtle.prototype.SetPenWidth = function (w) {
  with ( this ) {
    if ( logging ) {
      log += 'SetPenWidth(' + w + ');\n';
    }
    penWidth = w;
  }
}

Turtle.prototype.SetPenStyle = function (c) {
  with ( this ) {
    if ( logging ) {
      log += 'SetPenStyle(\'' + c + '\');\n';
    }
    penStyle = c;
  }
}

Turtle.prototype.Move = function (d) {
  with ( this ) {
    if ( logging ) {
      log += 'Move(' + d + ');\n';
    }
    var newposition = linear(1, position, d * unit, heading);
    if ( pen ) {
      with ( context ) {
        save();
        lineCap = 'round';
        lineJoin = 'round';
        lineWidth = penWidth;
        strokeStyle = penStyle;
        beginPath();
        moveTo(position[y], position[x]);
        lineTo(newposition[y], newposition[x]);
        stroke();
        restore();
      }
    }
    position = newposition;
  }
}

Turtle.prototype.Turn = function (phi) {
  with ( this ) {
    if ( logging ) {
      log += 'Turn(' + phi + ');\n';
    }
    var alpha = phi * Degree;
    var left = cross(normal, heading);
    var newheading = rotateNormal(heading, left, normal, alpha);
    heading = newheading;
  }
}

Turtle.prototype.Roll = function (psi) {
  with ( this ) {
    if ( logging ) {
      log += 'Roll(' + psi + ');\n';
    }
    var alpha = psi * Degree;
    var right = cross(heading, normal);
    var newnormal = rotateNormal(normal, right, heading, alpha);
    normal = newnormal;
  }
}

Turtle.prototype.Dive = function (theta) {
  with ( this ) {
    if ( logging ) {
      log += 'Dive(' + theta + ');\n';
    }
    var alpha = theta * Degree;
    var left = cross(normal, heading);
    var newnormal = rotateNormal(normal, heading, left, alpha);
    normal = newnormal;
    heading = cross(left, normal);
  }
}

Turtle.prototype.Segment = function (d, psi, phi) {
  with ( this ) {
    Move(d);
    Roll(psi);
    Turn(phi);
  }
}

Turtle.prototype.DrawTurtle = function (c) {
  // Draw turle (as triangle with fin tail; right wing filled with c)
  with ( this ) {
    if ( logging ) {
      log += 'DrawTurtle(\'' + c + '\');\n';
    }
    turtle = this;
    var left = cross(normal, heading);
    var alpha = 30 * Degree; // half nose angle
    var ca = Math.cos(alpha);
    var sa = Math.sin(alpha);
    var h = unit; // hypothenuse
    var a = 2/3 * h * ca; // distance from center to tip of nose
    
    var nose = linear(1, position, a, heading);
    var back = linear(1, nose, -h * ca, heading);
    var port = linear(1, back,  h * sa, left); // port-side tip
    var star = linear(1, back, -h * sa, left); // starboard-side tip
    var fin  = linear(1, back,  h * sa, normal); // fin tip

    function drawWings() {
      with ( turtle ) with ( context ) {
        // starboard wing
        beginPath();
        moveTo(nose[y], nose[x]);
        lineTo(back[y], back[x]);
        lineTo(star[y], star[x]);
        closePath();
        fillStyle = c;
        fill();
        
        // port wing
        beginPath();
        moveTo(nose[y], nose[x]);
        lineTo(back[y], back[x]);
        lineTo(port[y], port[x]);
        closePath();
        fillStyle = 'white';
        fill();
        
        // wing decorations
        if ( normal[z] >= 0 ) { // eyes on top
          save();
          lineWidth = 2;
          beginPath ();
          moveTo(position[y] + a/2 * heading[y] + (star[y] - back[y]) / 7,
            position[x] + a/2 * heading[x] + (star[x] - back[x]) / 7);
          lineTo(position[y] + a/2 * heading[y] + (star[y] - back[y]) / 7,
            position[x] + a/2 * heading[x] + (star[x] - back[x]) / 7);
          strokeStyle = 'white';
          stroke()
          beginPath ();
          moveTo(position[y] + a/2 * heading[y] + (port[y] - back[y]) / 7,
            position[x] + a/2 * heading[x] + (port[x] - back[x]) / 7);
          lineTo(position[y] + a/2 * heading[y] + (port[y] - back[y]) / 7,
            position[x] + a/2 * heading[x] + (port[x] - back[x]) / 7);
          strokeStyle = c;
          stroke()
          restore();
        }
        else { // arrow head on the bottom
          // fin is down, draw cross hair
          beginPath();
          moveTo(position[y], position[x]);
          //lineTo(position[y] + unit/6 * left[y],
          //  position[x] + unit/6 * left[x]);
          lineTo(position[y] + (port[y] - nose[y]) / 5,
            position[x] + (port[x] - nose[x]) / 5);
          strokeStyle = c;
          stroke();
          beginPath();
          moveTo(position[y], position[x]);
          //lineTo(position[y] - unit/6 * left[y],
          //  position[x] - unit/6 * left[x]);
          lineTo(position[y] + (star[y] - nose[y]) / 5,
            position[x] + (star[x] - nose[x]) / 5);
          strokeStyle = 'white';
          stroke();
        }
        
        // startboard wing's edge
        beginPath();
        moveTo(nose[y], nose[x]);
        lineTo(star[y], star[x]);
        lineTo(back[y], back[x]);
        strokeStyle = 'white';
        stroke();
        
        // port wing's edge
        beginPath();
        moveTo(nose[y], nose[x]);
        lineTo(port[y], port[x]);
        lineTo(back[y], back[x]);
        strokeStyle = c;
        stroke();
      }
    }
    
    function drawFinFace(fc) {
      with ( turtle ) with ( context ) {
        beginPath();
        moveTo(position[y], position[x]);
        lineTo(fin [y], fin [x]);
        lineTo(back[y], back[x]);
        closePath();
        fillStyle = fc;
        fill();
      }
    }
    
    function drawFinEdge(fc) {
      with ( turtle ) with ( context ) {
        beginPath();
        moveTo(position[y], position[x]);
        lineTo(fin [y], fin [x]);
        lineTo(back[y], back[x]);
        closePath();
        strokeStyle = fc;
        stroke();
      }
    }
    
    function drawFin() {
      with ( turtle ) with ( context ) {
        if ( left[z] >= 0 ) {
          drawFinFace('white');
          drawFinEdge(c);
        }
        else {
          drawFinEdge('white');
          drawFinFace(c);
        }
      }
    }
  
    with ( context ) {
      save();
      lineWidth = 1;
      lineCap = 'round';
      lineJoin = 'round';
    
      if ( normal[z] >= 0 ) {
        // fin is up, draw it last
        drawWings();
        drawFin();
      }
      else {
        // fin is down, draw it first
        drawFin();
        drawWings();
      }
      
      restore();
    }
  }
}

// Define abbreviated public methods for Turtle objects
Turtle.prototype.PA = Turtle.prototype.PenActive;
Turtle.prototype.PD = Turtle.prototype.PenDown;
Turtle.prototype.PU = Turtle.prototype.PenUp;
Turtle.prototype.M = Turtle.prototype.Move;
Turtle.prototype.T = Turtle.prototype.Turn;
Turtle.prototype.R = Turtle.prototype.Roll;
Turtle.prototype.D = Turtle.prototype.Dive;
Turtle.prototype.S = Turtle.prototype.Segment;
Turtle.prototype.DT = Turtle.prototype.DrawTurtle;


// Define functions to be made public (continued)

function Clear(sp) {
  // Clear canvas with ID sp.
  // Optional second argument is color.
  with ( document.getElementById(sp).getContext('2d') ) {
    canvas.width = canvas.width; // clear the canvas
    if ( arguments.length >= 2 ) {
      fillStyle = arguments[1];
      fillRect(0, 0, canvas.width, canvas.height);
    }
  }
}

function SetDefaults(def) {
  // Set defaults in def (other defaults are unaffected)
  for (var p in def) {
    top(defaults)[p] = def[p];
  }
}

function GetDefaults() {
  // Return current defaults
  return top(defaults);
}

function PushDefaults(def) {
  // Push new defaults def, making them active
  // Requires: def = object with properties canvasID and unit
  defaults.push(new cloneObject(top(defaults))); // first, copy top
  SetDefaults(def); // then update with values from parameter
}

function PopDefaults() {
  // Pop defaults, making the underlying defaults active again
  // Requires: defaults.length > 1
  if ( defaults.length > 1 ) {
    defaults.pop();
  }
}

function Test() {
  var result = '';
  result += cross([0, 0, 1], [1, 0, 0]) + '\n';
  result += obj2Str('defaults = ', top(defaults)) + '\n';
  SetDefaults({ canvasID: 'TGexample1' });
  result += obj2Str('defaults = ', top(defaults)) + '\n';
  PushDefaults({ canvasID: 'TGexample2' });
  result += obj2Str('defaults = ', top(defaults)) + '\n';
  PopDefaults();
  result += obj2Str('defaults = ', top(defaults)) + '\n';
  return result;
}

// Export public functions
TurtleGraphics.Turtle = Turtle;
TurtleGraphics.Clear = Clear;
TurtleGraphics.SetDefaults = SetDefaults;
TurtleGraphics.GetDefaults = GetDefaults;
TurtleGraphics.PushDefaults = PushDefaults;
TurtleGraphics.PopDefaults = PopDefaults;
TurtleGraphics.Test = Test;

})();
