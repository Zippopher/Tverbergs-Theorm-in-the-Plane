// Various functions for doing computations on points.
// These functions are called from render.js.

function p(x, y) { // create a point
  return { x: x, y: y };
}

// get a set of random points
function randomPoints(count, min, max) {
  let points = [];
  for (let i = 0; i < count; i++) {
    points.push(p(randRange(min.x, max.x), randRange(min.y, max.y)));
  }
  return points;
}

function randRange(min, max) {
  return Math.random() * (max-min) + min;
}

// center of a set of points (not a member of the set)
function centerOf(points) {
  let sum = points.reduce((sum, point) => p(sum.x+point.x, sum.y+point.y), p(0, 0));
  return p(sum.x/points.length, sum.y/points.length);
}

// angle from a to b
function angle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}
// returns a function for comparing points based on angle from a given center point
function angleCompareFunction(center) {
  return function(a, b) {
    let angleA = angle(center, a), angleB = angle(center, b);
    if (angleA > angleB) return 1;
    if (angleA < angleB) return -1;
    return 0;
  }
}

// intersection of two line segments from four points
function intersect(a, b, c, d) {
  let center = centerOf([a, b, c, d]);

  let i;
  i = lineIntersection(a, slope(a,b), c, slope(c,d));
  if (inRect(i, a, b) && inRect(i, c, d)) return i;

  i = lineIntersection(a, slope(a,c), b, slope(b,d));
  if (inRect(i, a, c) && inRect(i, b, d)) return i;

  i = lineIntersection(a, slope(a,d), b, slope(b,c));
  if (inRect(i, a, d) && inRect(i, b, c)) return i;

  return null; // if there's no intersection at all
}

// intersection of two lines defined by point p with slope m, and point q with slope n
function lineIntersect(p, m, q, n) {
  let x = (q.y - p.y - m*q.x + n*p.x) / (m - n);
  let y = m*(x - p.x) - p.y; // point slope form
  return p(x, y);
}

function slope(p, q) {
  return (p.y - q.y) / (p.x - q.x);
}

// if i is within the bounds of the quadrilateral bounded by a, b
function inRect(i, a, b) {
  let left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  let top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  return i.x > left && i.x < right && i.y > top && i.y < bottom;
}
// if i is withint the triangle formed by a, b, c
function inTriangle(i, a, b, c) {
  return orient(i, a, b) === orient(i, b, c) === orient(i, c, a);
}
// returns 1 for a ccw triangle, -1 for cw, and 0 for collinear
function orient(a, b, c) {
  let det = det([[a.x-c.x, a.y-c.y], [b.x-c.x, b.y-c.y]]);
  if (det > 0) return 1;
  if (det < 0) return -1;
  return 0;
}
function det(matrix) {
  if (matrix.length === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return matrix.reduce((sum, vec, i) =>
    sum + (i%2*-2 + 1) * vec[0] * det(matrix.filter((vec, j) => i!==j).map((vec) => vec.slice(1))),
  0);
}
