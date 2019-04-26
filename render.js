// This file contains functions for rendering to the page, as well as some logic.
// It relies on computations.js for a bunch of math and stuff.

const black = '#000000';
const colors = makePalette();

// Currently, this is where everything is happening (this function runs on page load).
// Right now all I'm doing is getting r-1 triangles that should intersect, based on Birch's paper:
// - Generate a set of random points.
// - Get their center of mass, sort them by angle with regard to that center.
// - Split them into r-1 triangles (the last subset would be a single point).
// - Draw each of those triangles.
// - Draw the points, and the center of mass.

// The next step is to actually get full intersections working.
// I think I can brute force it by trying each point as the individual one, then if none are found,
//  go through each set of four points to find an intersection that fits.
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  let r = 10; // set to however many subsets you want
  let n = 3*r - 2;

  ctx.lineWidth = 6;

  let points = randomPoints(n, p(100, 100), p(1800, 1000)); // n points 
  let center = centerOf(points);
  points.sort(angleCompareFunction(center));

  let triCount = r - 1; // in a real case, this might be r-2
  for (let t = 0; t < triCount; t++) {
    drawTriangle(ctx, points.filter((p, i) => i%(r-1) === t), colors[t]);
  }

  points.forEach((point, i) => drawDot(ctx, point, black));
  drawStar(ctx, center, 10, black);
});



function drawDot(ctx, point, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, 10, 10, 0, 0, 2*Math.PI);
  ctx.fill();
}
function drawStar(ctx, center, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  let x = center.x, y = center.y;
  const points = [
    [x-size*.5, y+size*.8],  // lower right
    [x+size*.75, y-size*.1], // upper left
    [x-size*.75, y-size*.1], // upper right
    [x+size*.5, y+size*.8],  // lower left
  ];
  ctx.moveTo(x, y-size*.65); // start at top
  points.forEach((p) => ctx.lineTo(...p));
  ctx.closePath();
  ctx.stroke();
}

function drawTriangle(ctx, points, color) {
  strokeTriangle(ctx, points, color);
  fillTriangle(ctx, points, color, 0.1);
}
function strokeTriangle(ctx, points, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.closePath();
  ctx.stroke();
}
function fillTriangle(ctx, points, color, alpha) { // with translucent color
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPalette(ctx) {
  colors.forEach((color, i) => dot(ctx, 100 + 100*(i%10), 100 + 100*Math.floor(i/10), color));
}



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
