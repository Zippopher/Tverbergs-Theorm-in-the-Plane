// This file contains functions for rendering to the page, as well as some logic.
// It relies on computations.js for a bunch of math and stuff.




let dragging = null; // point currently being dragged
let recalcRequired = true; // set when point is moved, unset after a calculation



document.addEventListener('DOMContentLoaded', () => {
  let canvas = document.getElementById('canvas');

  let r = 4; // set to however many subsets you want
  let n = 3*r - 2;
  let points = randomPoints(n, p(100, 100), p(canvas.width - 100, canvas.height - 100));
  
  let drag = new Drag(canvas, points);
  let draw = new Draw(canvas.getContext('2d'), points, canvas.width, canvas.height);

  const black = '#000000';
  const colors = makePalette();

  let lines = [], triangles = [];

  setInterval(function() { // render function, called every 16ms
    if (drag.recalcRequired) {
      ({ lines, triangles } = tverbergPartition(points));
      drag.recalcRequired = false;
    }
    draw.clear();
    triangles.forEach((tri, t) => draw.triangle(tri, colors[t]));
    lines.forEach((line) => draw.line(line, black));
    points.forEach((point) => draw.dot(point, black));
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
    this.canvas.addEventListener('mouseup', this.mouseUp);
    // Note: It's important that the methods in the Drag class are defined using arrow functions.
    // When they're passed as callbacks, their 'this' value must not be bound to the event's 'this'.
    // Arrow functions prevent the 'this' value from binding.
  }

  getMousePos = (event) => {
    let rect = this.canvas.getBoundingClientRect(); // absolute size of canvas
    let scaleX = this.canvas.width / rect.width;    // relationship bitmap vs. element for X
    let scaleY = this.canvas.height / rect.height;  // relationship bitmap vs. element for Y
  
    return {
      x: (event.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (event.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
  }

  mouseDown = (event) => {
    let mouse = this.getMousePos(event);
    for (let i = 0; i < this.points.length; i++) {
      let dx = mouse.x - this.points[i].x,
          dy = mouse.y - this.points[i].y;
      let dist2 = dx * dx + dy * dy;
      if (dist2 < 150) { // distance less than 10 -> distance squared less than 100, plus padding
        this.dragging = this.points[i];
        this.canvas.addEventListener('mousemove', this.mouseMove);
        return;
      }
    }
    this.dragging = null; // dragging nothing
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
      [x - size*.5,  y + size*.8],  // lower right
      [x + size*.75, y - size*.1], // upper left
      [x - size*.75, y - size*.1], // upper right
      [x + size*.5,  y + size*.8],  // lower left
    ];

    this.ctx.beginPath();
    this.ctx.moveTo(x, y-size*.65); // start at top
    starPoints.forEach((p) => this.ctx.lineTo(...p));
    this.ctx.closePath();
    this.ctx.stroke();
  }

  line(lineRef, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 6;
  
    this.ctx.beginPath();
    this.ctx.moveTo(this.points[lineRef[0]]);
    this.ctx.lineTo(this.points[lineRef[1]]);
    this.ctx.strokePath();
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
