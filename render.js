// This file contains functions for rendering to the page, as well as some logic.
// It relies on computations.js for a bunch of math and stuff.



document.addEventListener('DOMContentLoaded', () => {
  let canvas = document.getElementById('canvas');
  let setsInput = document.getElementById('sets-input');
  let pointsOutput = document.getElementById('points-output');
  let resetButton = document.getElementById('reset-button');
  let optionTverberg = document.getElementById('option-tverberg');
  let optionBirch = document.getElementById('option-birch');
  let optionSteps = document.getElementById('option-steps');
  let stepIntervalRange = document.getElementById('step-interval');
  let display = document.getElementById('display');

  let r, n, points, drag, draw;

  let refresh = () => {
    r = setsInput.value;
    if (optionTverberg.checked || optionSteps.checked) {
      n = 3*r - 2;
      pointsOutput.innerText = '3r - 2 = ' + n;
    }
    else { // birch is checked
      n = 3 * r;
      pointsOutput.innerText = '3r = ' + n;
    }

    points = randomPoints(n, p(100, 100), p(canvas.width - 100, canvas.height - 100));
    drag = new Drag(canvas, points);
    draw = new Draw(canvas.getContext('2d'), points, canvas.width, canvas.height);
  }
  refresh(); // initial set values
  setsInput.addEventListener('input', refresh); // set values when count is changed
  resetButton.addEventListener('click', refresh); // or when 'new points' is clicked
  optionTverberg.addEventListener('input', refresh); // or when the radio option is changed
  optionBirch.addEventListener('input', refresh);
  optionSteps.addEventListener('input', refresh);

  let stepInterval;
  let setStep = () => {
    stepInterval = 30000 / Math.pow(stepIntervalRange.value, 1.5);
  };
  setStep(); // set initial
  stepIntervalRange.addEventListener('input', setStep);



  const black = '#000000';
  const colors = makePalette();

  let lines = [], triangles = [], center = p(-100,-100), divider;

  let stepMode, lastStep, currentTime, pointFound, step;

  setInterval(function() { // render function, called every 16ms (60fps woo!)
    if (drag.recalcRequired) {
      if (optionTverberg.checked) {
        ({ lines, triangles, center } = tverbergPartition(points));
      }
      if (optionBirch.checked) {
        lines = [];
        center = centerOf(points);
        triangles = trianglesForPoints(points, center, []);
      }
      if (optionSteps.checked) { // tverberg steps
        stepMode = true;
        pointFound = false;
        step = { i: 0, a: 0, b: 1, c: 2, d: 3, j: 0 };
        lastStep = 0;
        
        lines = [];
        triangles = [];
        center = [];
        divider = null;
      }
      else {
        stepMode = false;
        display.innerText = '';
        divider = null;
      }

      drag.recalcRequired = false;
    }

    if (stepMode && !pointFound && step.a < n) {
      currentTime = Date.now();
      if (currentTime > lastStep + stepInterval) { // do a step every stepInterval ms
        lastStep = currentTime;
        let data = tverbergPartitionStep(points, step.i, step.a, step.b, step.c, step.d, step.j);
        lines = data.lines;
        if (data.divider) {
          let m = slope(data.divider[0], data.divider[1])
          let upper = lineIntersection(data.divider[0], m, p(0,0), 0);
          let lower = lineIntersection(data.divider[0], m, p(0,canvas.height), 0);
          divider = [upper, lower];
        }
        else {
          divider = null;
        }

        if (!data.valid) {
          step.j = n; // advance j to the end of its run, to jump forward
        }

        if (data.valid && step.j === n) {
          pointFound = true;
          ({ lines, triangles, center } = tverbergPartition(points));
          data.message = 'All halfspaces are valid for this point: solution found!';
        }
        
        display.innerText = data.message;
        
        incrementStep(step, n);
      }
    }

    draw.clear();
    triangles.forEach((tri, t) => draw.triangle(tri, colors[t]));
    lines.forEach((line, l) => draw.line(line, colors[triangles.length+l]));
    points.forEach((point) => draw.dot(point, black));
    draw.circle(center, 50, black);
    if (divider) draw.lineLiteral(divider, colors[2]);
  }, 16);
});



//// This class allows a set of points to be dragged around within the bounds of a canvas.
class Drag {
  constructor(canvas, points) {
    this.canvas = canvas;
    this.points = points;
    this.dragging = null;
    this.recalcRequired = true;

    this.canvas.addEventListener('mousedown', this.mouseDown);
    this.canvas.addEventListener('touchstart', this.mouseDown);

    this.canvas.addEventListener('mouseup', this.mouseUp);
    this.canvas.addEventListener('touchend', this.mouseUp);
    
    // for touch, we need to listen to touchMove consistently for touchStart to actually fire:
    this.canvas.addEventListener('touchmove', this.mouseMove);

    // Note: It's important that the methods in the Drag class are defined using arrow functions.
    // When they're passed as callbacks, their 'this' value must not be bound to the event's 'this'.
    // Arrow functions prevent the 'this' value from binding.
  }

  getMousePos = (event) => {
    if (event.changedTouches) event = event.changedTouches[0]; // for mobile, use first touch point

    let rect = this.canvas.getBoundingClientRect(); // absolute size of canvas
    let scaleX = this.canvas.width / rect.width;    // relationship bitmap vs. element for X
    let scaleY = this.canvas.height / rect.height;  // relationship bitmap vs. element for Y
  
    return {
      x: (event.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
      y: (event.clientY - rect.top) * scaleY   // been adjusted to be relative to element
    }
  }

  mouseDown = (event) => {
    event.preventDefault(); // when touch event, prevent mouse event followup
    let dist2Range = 20*20; // squared distance to a point to consider a touch
    if (event.type === 'touchstart') dist2Range = 50*50;

    let mouse = this.getMousePos(event);
    for (let i = 0; i < this.points.length; i++) {
      let dx = mouse.x - this.points[i].x,
          dy = mouse.y - this.points[i].y;
      let dist2 = dx * dx + dy * dy;
      if (dist2 < dist2Range) {
        this.dragging = this.points[i];
        this.canvas.addEventListener('mousemove', this.mouseMove);
        return;
      }
    }
    this.dragging = null; // nothing tapped: dragging nothing
  }

  mouseMove = (event) => {
    let mouse = this.getMousePos(event);
    this.dragging.x = mouse.x;
    this.dragging.y = mouse.y;
  }

  mouseUp = (event) => {
    this.dragging = null;
    this.recalcRequired = true;
    canvas.removeEventListener('mousemove', this.mouseMove);
  }
}



//// This class allows various things to be drawn to a 2D context, using a set of points.
class Draw {
  constructor(context, points, width, height) {
    this.ctx = context;
    this.points = points;
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  dot(point, color) {
    this.ctx.fillStyle = color;
  
    this.ctx.beginPath();
    this.ctx.ellipse(point.x, point.y, 10, 10, 0, 0, 2*Math.PI);
    this.ctx.fill();
  }
  star(center, size, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 6;

    const x = center.x, y = center.y;
    const starPoints = [
      [x - size*.5, y + size*.6],  // lower right
      [x + size*.7, y - size*.2], // upper left
      [x - size*.7, y - size*.2], // upper right
      [x + size*.5, y + size*.6],  // lower left
    ];

    this.ctx.beginPath();
    this.ctx.moveTo(x, y-size*.8); // start at top
    starPoints.forEach((p) => this.ctx.lineTo(...p));
    this.ctx.closePath();
    this.ctx.stroke();
  }
  circle(center, radius, color) {
    this.ctx.strokeStyle = color;
    this.ctx.setLineDash([12, 12]);
  
    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y, radius, radius, 0, 0, 2*Math.PI);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  line(lineRef, color) {
    let line = lineRef.map((p) => this.points[p]); // map reference points to real ones

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 6;
  
    this.ctx.beginPath();
    this.ctx.moveTo(line[0].x, line[0].y);
    this.ctx.lineTo(line[1].x, line[1].y);
    this.ctx.stroke();
  }

  lineLiteral(line, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 6;
  
    this.ctx.beginPath();
    this.ctx.moveTo(line[0].x, line[0].y);
    this.ctx.lineTo(line[1].x, line[1].y);
    this.ctx.stroke();
  }

  triangle(triangleRef, color) {
    let triangle = triangleRef.map((p) => this.points[p]); // map reference points to real ones
  
    this.ctx.beginPath();
    this.ctx.moveTo(triangle[0].x, triangle[0].y);
    this.ctx.lineTo(triangle[1].x, triangle[1].y);
    this.ctx.lineTo(triangle[2].x, triangle[2].y);
    this.ctx.closePath();
  
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 6;
    this.ctx.stroke();
  
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.1;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
}



//// Function 
function incrementStep(step, n) {
  if (step.a >= n) return; // final end state

  if (step.j < n) { // always increment j if possible
    step.j++;       // we allow j to equal n as a signal value
  }
  else if (step.i < n) { // comparing each point i with every other point j
    step.i++;
    step.j = 0;
  }
  else { // comparing each set of four points a, b, c, d with every other point j
    step.j = 0;
    step.d++;
    while ((step.b >= n || step.c >= n || step.d >= n) && step.a !== n) { // ensure kill at a === n 
      if (step.b === n) {
        step.a++;
        step.b = step.a + 1;
        step.c = step.b + 1;
        step.d = step.c + 1;
      }
      if (step.c === n) {
        step.b++;
        step.c = step.b + 1;
        step.d = step.c + 1;
      }
      if (step.d === n) {
        step.c++;
        step.d = step.c + 1;
      }
    }
  }
}



//// Functions for generating color
function makePalette() { // create a set of colors
  const saturation = 1;
  const lightnesses = [.5, .3, .8]; // 3 levels of lightness
  const hues = [0, 25, 50, 145, 190, 210, 260, 280, 295, 320]; // 10 hues
  return lightnesses.map((lightness) =>
    hues.map((hue) => '#' + [
      fColor(0, hue, saturation, lightness),
      fColor(8, hue, saturation, lightness),
      fColor(4, hue, saturation, lightness)
    ].map((val) => hexColor(val)).join(''))
  ).reduce((all, cur) => all.concat(cur), []); // 30 total colors, so up to, r = 30, n = 88
}
function fColor(n, H, S, L) { // function that generates values R, G, B
  let a = S * Math.min(L, 1-L);
  let k = (n + H/30) % 12;
  return L - a * Math.max(Math.min(k-3, 9-k, 1), -1);
}
function hexColor(val) { // 2-digit hex from [0, 1] RGB component
  let str = Math.floor(val*255).toString(16);
  if (str.length === 2) return str;
  else return '0' + str;
}
