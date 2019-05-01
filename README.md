# Visualization of Tverbergs Theorem in the Plane
An end of Semester Project for CSE 4704 (Spring 2019)

This project is to present a visual reference of Tverberg's Theorem in a 2-dimensional plane.

## Tverberg's Theorem
Tverberg's Theorem states that sufficiently many points in d-dimensional Euclidean space can be partitioned into subsets with intersecting convex hulls. Specifically, for any set of `(d+1)(r-1)+1`
points there exists a point x (not necessarily one of the given points) and a partition of the given points into r subsets, such that x belongs to the convex hull of all of the subsets.

## Our Project
Our visualization works in 2D, so for a given number of sets r, a set of `3r-2` points is generated, and they're divided into a partition that fulfills Tverberg's theorem for that set of points.  We determined that dimensions beyond 2D as well as the topological view of the Tverberg Theorem to be beyond the scope of our project given the terminology of "In the Plane," as well as the associated complexity of the topological view.

## How it Works
So far, this works for sets of points where a single point in the set is the intersection of all convex hulls. In this case, the subsets consist of one subset of size 1 (the afformentioned point) and all other subsets are specific sets of 3. The subsets of 3 each have a triangle for their convex hull, and these triangles are chosen such that their intersection contains the single point.

The point in the subset of 1 is determined by iterating the points, and checking whether all halfspaces through that point contain at least 1/3 of the other points in the set. This determines whether the point can be in the intersection of the triangular convex hulls of the other points. This algorithm is based the method for partitioning 3n points into n subsets of 3 which have an intersection of convex hulls, from Birch's paper "On 3n Points in a Plane".

There are some sets though where no single point in the set can be in the intersection of all other convex hulls. In 2D, the Tverberg partition in this case is two sets of size 2, and the rest of size 3. This results in the intersection of the convex hulls being the intersection of the two lines (from the subsets of 2). That intersection point is within the triangle formed by each subset of 3.

To implement this, we need to iterate through every set of four points, get the intersection of the two line segments formed by those points, and check whether that intersection point can be in the intersection of the triangles formed by the other potential subsets, using the same method as above.
