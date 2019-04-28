
//// Various functions for doing computations on points.
//// These functions are called from render.js.



  ///////////////////////////////////
 //// Generic utility functions ////
///////////////////////////////////
function randRange(min, max) {
  return Math.random() * (max-min) + min;
}

// integer list of range [a, b)
function listFrom(a, b) {
  return Array(b-a).fill(0).map((_, i) => i+a);
}

// rotates a list by offset, so [1, 2, 3] rotated by 1 is [2, 3, 1]
function rotate(list, offset) {
  return list.map((_,i) => list[(i + offset + list.length) % list.length]);
}

// generic compare for sort function
function compare(a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

// if i is within the bounds of the quadrilateral bounded by a, b
function inRect(i, a, b) {
  let left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  let top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y);
  return i.x > left && i.x < right && i.y > top && i.y < bottom;
}
// if i is within the triangle formed by a, b, c
function inTriangle(i, a, b, c) {
  return orient(i, a, b) === orient(i, b, c) === orient(i, c, a);
}

// returns 1 for a ccw triangle, -1 for cw, and 0 for collinear
function orient(a, b, c) {
  let det = determinant([[a.x-c.x, a.y-c.y], [b.x-c.x, b.y-c.y]]);
  if (det > 0) return 1;
  if (det < 0) return -1;
  return 0;
}
function determinant(matrix) {
  if (matrix.length === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return matrix.reduce((sum, vec, i) =>
    sum + (i%2*-2 + 1) * vec[0] * det(matrix.filter((vec, j) => i!==j).map((vec) => vec.slice(1))),
  0);
}





  /////////////////////////////////////
 //// Geometric utility functions ////
/////////////////////////////////////

// create a point
function p(x, y) {
  return { x: x, y: y };
}

// get count random points between min and max
function randomPoints(count, min, max) {
  let points = [];
  for (let i = 0; i < count; i++) {
    points.push(p(randRange(min.x, max.x), randRange(min.y, max.y)));
  }
  return points;
}

function slope(p, q) {
  return (p.y - q.y) / (p.x - q.x);
}

function angle(a, b) { // from a to b
  return Math.atan2(b.y - a.y, b.x - a.x);
}

// center of a set of points (not a member of the set)
function centerOf(points) {
  let sum = points.reduce((sum, point) => p(sum.x+point.x, sum.y+point.y), p(0, 0));
  return p(sum.x/points.length, sum.y/points.length);
}

// given four points, return the two line semgents which intersect, and their intersection
function segmentIntersect(a, b, c, d) {
  let center = centerOf([a, b, c, d]);

  let i;
  i = lineIntersection(a, slope(a,b), c, slope(c,d));
  if (inRect(i, a, b) && inRect(i, c, d)) return { intersection: i, segments: [[a,b], [c,d]] };

  i = lineIntersection(a, slope(a,c), b, slope(b,d));
  if (inRect(i, a, c) && inRect(i, b, d)) return { intersection: i, segments: [[a,c], [b,d]] };

  i = lineIntersection(a, slope(a,d), b, slope(b,c));
  if (inRect(i, a, d) && inRect(i, b, c)) return { intersection: i, segments: [[a,d], [b,c]] };

  return null; // if there's no intersection at all
}
// intersection of two lines defined by point p with slope m, and point q with slope n
function lineIntersect(p, m, q, n) {
  let x = (q.y - p.y - m*q.x + n*p.x) / (m - n);
  let y = m*(x - p.x) - p.y; // point slope form
  return p(x, y);
}





  /////////////////////////////////////
 //// Tverberg-specific functions ////
/////////////////////////////////////

// iterate through points, for each point p:
//  - check whether all halfspaces with a boundary through p contain 1/3 of the points
//  - do this by checking each line that goes through p and another point, on both sides
//     - each side should have at least n/3+1 and less than 2n/3 (or around there?)
// if one matches, exit and get r-1 triangles based on the matching point as a center
// if none match, we need to form a center point using two crossing line segments
// iterate through sets of four points and find an intersection p
//  - if the intersection doesn't exist, move on
//  - if it does, then check all halfspaces through p like before
// when one is found, exit, and get r-2 triangles from the remaining points based on that center
// but I'm not sure how to guarantee that we'll definitely find a valid center
function tverbergPartition(points) {
  let n = points.length;
  let lowerLimit = (n-1) / 3; // at least a third of points other than i

  for (let i = 0; i < n; i++) { // test each point i
    let pointValid = true;
    for (let j = 0; j < n; j++) { // along with another point j
      if (j === i) continue;
      // count the points which are on the left of the line ij:
      let countOnLeft = points.filter((p) => orient(points[i], points[j], p) > 0).length;
      let countOnRight = n - countOnLeft - 2; // total - left - (i and j)
      // i isn't factored into the midpoint metric
      // and assume j isn't on either side, since we're testing worst case of the line position

      // check whether the halfspaces in either direction of ij have sufficient points
      if (countOnLeft < lowerLimit || countOnRight < lowerLimit) {
        pointValid = false;
        break; // if they don't, then break; move on to the next i
      }
    }
    if (pointValid) { // if a point has all large enough halfspaces
      return {
        lines: [],
        triangles: trianglesForPoints(points, points[i], [i]), // center i, don't include i
      };
    }
  }

  // TODO: test all intersection points

  return { // no triangles :(
    lines: [],
    triangles: [],
  };
}


// splits n points into subsets of triangles, each one's points spread out by n/3
// n is the count of points, minus the count of except (points not to include in any triangles)
function trianglesForPoints(points, center, except) {
  let indices = listFrom(0, points.length); // indices referencing each point
  except.forEach((e) => indices.splice(e, 1)); // remove exceptions from indices
  // sort remaining indices by angle from the center to the index's corresponding point:
  indices.sort((iA, iB) => compare(angle(center, points[iA]), angle(center, points[iB])));

  let triCount = Math.floor(indices.length / 3);
  return listFrom(0, triCount).map((t) => indices.filter((referenceIndex, literalIndex) => {
    return literalIndex % triCount === t; // take 3 points which are triCount apart
  }).slice(0,3)); // limit to 3
}
