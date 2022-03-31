/**
 *
 * Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
 * THREE.js rework by thrax
 *
 * # class CSG
 * Holds a binary space partition tree representing a 3D solid. Two solids can
 * be combined using the `union()`, `subtract()`, and `intersect()` methods.
 *
 * Differences Copyright 2020-2021 Sean Bradley : https://sbcode.net/threejs/
 * - Started with CSGMesh.js and csg-lib.js from https://github.com/manthrax/THREE-CSGMesh
 * - Converted to TypeScript by adding type annotations to all variables
 * - Converted var to const and let
 * - Some Refactoring
 * - support for three r130

---------------------------------------------------------------------------------------------------

Return a new CSG solid representing space in either this solid or in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.union(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |       +----+
    +----+--+    |       +----+       |
         |   B   |            |       |
         |       |            |       |
         +-------+            +-------+

Return a new CSG solid representing space in this solid but not in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.subtract(B)

    +-------+            +-------+
    |       |            |       |
    |   A   |            |       |
    |    +--+----+   =   |    +--+
    +----+--+    |       +----+
         |   B   |
         |       |
         +-------+

Return a new CSG solid representing space both this solid and in the
solid `csg`. Neither this solid nor the solid `csg` are modified.

    A.intersect(B)

    +-------+
    |       |
    |   A   |
    |    +--+----+   =   +--+
    +----+--+    |       +--+
         |   B   |
         |       |
         +-------+

*/

import * as THREE from '../../build/three.module.js';

var CSG = /** @class */ (function () {
    function CSG() {
        this.polygons = [];
    }
    CSG.prototype.clone = function () {
        var csg = new CSG();
        csg.polygons = this.polygons.map(function (p) {
            return p.clone();
        });
        return csg;
    };
    CSG.prototype.toPolygons = function () {
        return this.polygons;
    };
    CSG.prototype.union = function (csg) {
        var a = new Node(this.clone().polygons);
        var b = new Node(csg.clone().polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        return CSG.fromPolygons(a.allPolygons());
    };
    CSG.prototype.subtract = function (csg) {
        var a = new Node(this.clone().polygons);
        var b = new Node(csg.clone().polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    };
    CSG.prototype.intersect = function (csg) {
        var a = new Node(this.clone().polygons);
        var b = new Node(csg.clone().polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    };
    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    CSG.prototype.inverse = function () {
        var csg = this.clone();
        csg.polygons.map(function (p) {
            p.flip();
        });
        return csg;
    };
    // Construct a CSG solid from a list of `Polygon` instances.
    CSG.fromPolygons = function (polygons) {
        var csg = new CSG();
        csg.polygons = polygons;
        return csg;
    };
    CSG.fromGeometry = function (geom, objectIndex) {
        var polys = [];
        var posattr = geom.attributes.position;
        var normalattr = geom.attributes.normal;
        var uvattr = geom.attributes.uv;
        var colorattr = geom.attributes.color;
        var index;
        if (geom.index) {
            index = geom.index.array;
        }
        else {
            index = new Array((posattr.array.length / posattr.itemSize) | 0);
            for (var i = 0; i < index.length; i++)
                index[i] = i;
        }
        var triCount = (index.length / 3) | 0;
        polys = new Array(triCount);
        for (var i = 0, pli = 0, l = index.length; i < l; i += 3, pli++) {
            var vertices = new Array(3);
            for (var j = 0; j < 3; j++) {
                var vi = index[i + j];
                var vp = vi * 3;
                var vt = vi * 2;
                var x = posattr.array[vp];
                var y = posattr.array[vp + 1];
                var z = posattr.array[vp + 2];
                var nx = normalattr.array[vp];
                var ny = normalattr.array[vp + 1];
                var nz = normalattr.array[vp + 2];
                var u = uvattr.array[vt];
                var v = uvattr.array[vt + 1];
                vertices[j] = new Vertex({
                    x: x,
                    y: y,
                    z: z
                }, {
                    x: nx,
                    y: ny,
                    z: nz
                }, {
                    x: u,
                    y: v,
                    z: 0
                }, colorattr &&
                    {
                        x: colorattr.array[vt],
                        y: colorattr.array[vt + 1],
                        z: colorattr.array[vt + 2]
                    });
            }
            polys[pli] = new Polygon(vertices, objectIndex);
        }
        return CSG.fromPolygons(polys);
    };
    CSG.ttvv0 = new THREE.Vector3();
    CSG.tmpm3 = new THREE.Matrix3();
    CSG.fromMesh = function (mesh, objectIndex) {
        var csg = CSG.fromGeometry(mesh.geometry, objectIndex);
        CSG.tmpm3.getNormalMatrix(mesh.matrix);
        for (var i = 0; i < csg.polygons.length; i++) {
            var p = csg.polygons[i];
            for (var j = 0; j < p.vertices.length; j++) {
                var v = p.vertices[j];
                v.pos.copy(CSG.ttvv0
                    .copy(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z))
                    .applyMatrix4(mesh.matrix));
                v.normal.copy(CSG.ttvv0
                    .copy(new THREE.Vector3(v.normal.x, v.normal.y, v.normal.z))
                    .applyMatrix3(CSG.tmpm3));
            }
        }
        return csg;
    };
    CSG.nbuf3 = function (ct) {
        return {
            top: 0,
            array: new Float32Array(ct),
            write: function (v) {
                this.array[this.top++] = v.x;
                this.array[this.top++] = v.y;
                this.array[this.top++] = v.z;
            }
        };
    };
    CSG.nbuf2 = function (ct) {
        return {
            top: 0,
            array: new Float32Array(ct),
            write: function (v) {
                this.array[this.top++] = v.x;
                this.array[this.top++] = v.y;
            }
        };
    };
    CSG.toMesh = function (csg, toMatrix, toMaterial) {
        var ps = csg.polygons;
        var geom;
        var triCount = 0;
        ps.forEach(function (p) { return (triCount += p.vertices.length - 2); });
        geom = new THREE.BufferGeometry();
        var vertices = CSG.nbuf3(triCount * 3 * 3);
        var normals = CSG.nbuf3(triCount * 3 * 3);
        var uvs = CSG.nbuf2(triCount * 2 * 3);
        var colors;
        var grps = [];
        ps.forEach(function (p) {
            var pvs = p.vertices;
            var pvlen = pvs.length;
            if (p.shared !== undefined) {
                if (!grps[p.shared])
                    grps[p.shared] = [];
            }
            if (pvlen && pvs[0].color !== undefined) {
                if (!colors)
                    colors = CSG.nbuf3(triCount * 3 * 3);
            }
            for (var j = 3; j <= pvlen; j++) {
                p.shared !== undefined &&
                    grps[p.shared].push(vertices.top / 3, vertices.top / 3 + 1, vertices.top / 3 + 2);
                vertices.write(pvs[0].pos);
                vertices.write(pvs[j - 2].pos);
                vertices.write(pvs[j - 1].pos);
                normals.write(pvs[0].normal);
                normals.write(pvs[j - 2].normal);
                normals.write(pvs[j - 1].normal);
                uvs.write(pvs[0].uv);
                uvs.write(pvs[j - 2].uv);
                uvs.write(pvs[j - 1].uv);
                colors &&
                    (colors.write(pvs[0].color) ||
                        colors.write(pvs[j - 2].color) ||
                        colors.write(pvs[j - 1].color));
            }
        });
        geom.setAttribute('position', new THREE.BufferAttribute(vertices.array, 3));
        geom.setAttribute('normal', new THREE.BufferAttribute(normals.array, 3));
        geom.setAttribute('uv', new THREE.BufferAttribute(uvs.array, 2));
        colors &&
            geom.setAttribute('color', new THREE.BufferAttribute(colors.array, 3));
        if (grps.length) {
            var index = [];
            var gbase = 0;
            for (var gi = 0; gi < grps.length; gi++) {
                geom.addGroup(gbase, grps[gi].length, gi);
                gbase += grps[gi].length;
                index = index.concat(grps[gi]);
            }
            geom.setIndex(index);
        }
        var inv = new THREE.Matrix4().copy(toMatrix).invert();
        geom.applyMatrix4(inv);
        geom.computeBoundingSphere();
        geom.computeBoundingBox();
        var m = new THREE.Mesh(geom, toMaterial);
        m.matrix.copy(toMatrix);
        m.matrix.decompose(m.position, m.quaternion, m.scale);
        m.rotation.setFromQuaternion(m.quaternion);
        m.updateMatrixWorld();
        m.castShadow = m.receiveShadow = true;
        return m;
    };
    return CSG;
}());

// # class Vector
// Represents a 3D vector.
//
// Example usage:
//
//     new CSG.Vector(1, 2, 3);
var Vector = /** @class */ (function () {
    function Vector(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector.prototype.copy = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    };
    Vector.prototype.clone = function () {
        return new Vector(this.x, this.y, this.z);
    };
    Vector.prototype.negate = function () {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    };
    Vector.prototype.add = function (a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        return this;
    };
    Vector.prototype.sub = function (a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        return this;
    };
    Vector.prototype.times = function (a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this;
    };
    Vector.prototype.dividedBy = function (a) {
        this.x /= a;
        this.y /= a;
        this.z /= a;
        return this;
    };
    Vector.prototype.lerp = function (a, t) {
        return this.add(tv0.copy(a).sub(this).times(t));
    };
    Vector.prototype.unit = function () {
        return this.dividedBy(this.length());
    };
    Vector.prototype.length = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    Vector.prototype.normalize = function () {
        return this.unit();
    };
    Vector.prototype.cross = function (b) {
        var a = this;
        var ax = a.x, ay = a.y, az = a.z;
        var bx = b.x, by = b.y, bz = b.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    };
    Vector.prototype.dot = function (b) {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    };
    return Vector;
}());

//Temporaries used to avoid internal allocation..
var tv0 = new Vector(0, 0, 0);
var tv1 = new Vector(0, 0, 0);
// # class Vertex
// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.
var Vertex = /** @class */ (function () {
    function Vertex(pos, normal, uv, color) {
        this.pos = new Vector().copy(pos);
        this.normal = new Vector().copy(normal);
        this.uv = new Vector().copy(uv);
        this.uv.z = 0;
        color && (this.color = new Vector().copy(color));
    }
    Vertex.prototype.clone = function () {
        return new Vertex(this.pos, this.normal, this.uv, this.color);
    };
    // Invert all orientation-specific data (e.g. vertex normal). Called when the
    // orientation of a polygon is flipped.
    Vertex.prototype.flip = function () {
        this.normal.negate();
    };
    // Create a new vertex between this vertex and `other` by linearly
    // interpolating all properties using a parameter of `t`. Subclasses should
    // override this to interpolate additional properties.
    Vertex.prototype.interpolate = function (other, t) {
        return new Vertex(this.pos.clone().lerp(other.pos, t), this.normal.clone().lerp(other.normal, t), this.uv.clone().lerp(other.uv, t), this.color && other.color && this.color.clone().lerp(other.color, t));
    };
    return Vertex;
}());

// # class Plane
// Represents a plane in 3D space.
var Plane = /** @class */ (function () {
    function Plane(normal, w) {
        this.normal = normal;
        this.w = w;
    }
    Plane.prototype.clone = function () {
        return new Plane(this.normal.clone(), this.w);
    };
    Plane.prototype.flip = function () {
        this.normal.negate();
        this.w = -this.w;
    };
    // Split `polygon` by this plane if needed, then put the polygon or polygon
    // fragments in the appropriate lists. Coplanar polygons go into either
    // `coplanarFront` or `coplanarBack` depending on their orientation with
    // respect to this plane. Polygons in front or in back of this plane go into
    // either `front` or `back`.
    Plane.prototype.splitPolygon = function (polygon, coplanarFront, coplanarBack, front, back) {
        var COPLANAR = 0;
        var FRONT = 1;
        var BACK = 2;
        var SPANNING = 3;
        // Classify each point as well as the entire polygon into one of the above
        // four classes.
        var polygonType = 0;
        var types = [];
        for (var i = 0; i < polygon.vertices.length; i++) {
            var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
            var type = t < -Plane.EPSILON ? BACK : t > Plane.EPSILON ? FRONT : COPLANAR;
            polygonType |= type;
            types.push(type);
        }
        // Put the polygon in the correct list, splitting it when necessary.
        switch (polygonType) {
            case COPLANAR:
                ;
                (this.normal.dot(polygon.plane.normal) > 0
                    ? coplanarFront
                    : coplanarBack).push(polygon);
                break;
            case FRONT:
                front.push(polygon);
                break;
            case BACK:
                back.push(polygon);
                break;
            case SPANNING:
                var f = [], b = [];
                for (var i = 0; i < polygon.vertices.length; i++) {
                    var j = (i + 1) % polygon.vertices.length;
                    var ti = types[i], tj = types[j];
                    var vi = polygon.vertices[i], vj = polygon.vertices[j];
                    if (ti != BACK)
                        f.push(vi);
                    if (ti != FRONT)
                        b.push(ti != BACK ? vi.clone() : vi);
                    if ((ti | tj) == SPANNING) {
                        var t = (this.w - this.normal.dot(vi.pos)) /
                            this.normal.dot(tv0.copy(vj.pos).sub(vi.pos));
                        var v = vi.interpolate(vj, t);
                        f.push(v);
                        b.push(v.clone());
                    }
                }
                if (f.length >= 3)
                    front.push(new Polygon(f, polygon.shared));
                if (b.length >= 3)
                    back.push(new Polygon(b, polygon.shared));
                break;
        }
    };
    // `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
    // point is on the plane.
    Plane.EPSILON = 1e-5;
    Plane.fromPoints = function (a, b, c) {
        var n = tv0.copy(b).sub(a).cross(tv1.copy(c).sub(a)).normalize();
        return new Plane(n.clone(), n.dot(a));
    };
    return Plane;
}());

// # class Polygon
// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).
var Polygon = /** @class */ (function () {
    function Polygon(vertices, shared) {
        this.vertices = vertices;
        this.shared = shared;
        this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }
    Polygon.prototype.clone = function () {
        return new Polygon(this.vertices.map(function (v) { return v.clone(); }), this.shared);
    };
    Polygon.prototype.flip = function () {
        this.vertices.reverse().map(function (v) { return v.flip(); });
        this.plane.flip();
    };
    return Polygon;
}());

// # class Node
// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.
var Node = /** @class */ (function () {
    function Node(polygons) {
        this.polygons = [];
        if (polygons)
            this.build(polygons);
    }
    Node.prototype.clone = function () {
        var node = new Node();
        node.plane = this.plane && this.plane.clone();
        node.front = this.front && this.front.clone();
        node.back = this.back && this.back.clone();
        node.polygons = this.polygons.map(function (p) { return p.clone(); });
        return node;
    };
    // Convert solid space to empty space and empty space to solid space.
    Node.prototype.invert = function () {
        for (var i = 0; i < this.polygons.length; i++)
            this.polygons[i].flip();
        this.plane && this.plane.flip();
        this.front && this.front.invert();
        this.back && this.back.invert();
        var temp = this.front;
        this.front = this.back;
        this.back = temp;
    };
    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    Node.prototype.clipPolygons = function (polygons) {
        if (!this.plane)
            return polygons.slice();
        var front = [];
        var back = [];
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], front, back, front, back);
        }
        if (this.front)
            front = this.front.clipPolygons(front);
        if (this.back)
            back = this.back.clipPolygons(back);
        else
            back = [];
        return front.concat(back);
    };
    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    Node.prototype.clipTo = function (bsp) {
        this.polygons = bsp.clipPolygons(this.polygons);
        if (this.front)
            this.front.clipTo(bsp);
        if (this.back)
            this.back.clipTo(bsp);
    };
    // Return a list of all polygons in this BSP tree.
    Node.prototype.allPolygons = function () {
        var polygons = this.polygons.slice();
        if (this.front)
            polygons = polygons.concat(this.front.allPolygons());
        if (this.back)
            polygons = polygons.concat(this.back.allPolygons());
        return polygons;
    };
    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    Node.prototype.build = function (polygons) {
        if (!polygons.length)
            return;
        if (!this.plane)
            this.plane = polygons[0].plane.clone();
        var front = [];
        var back = [];
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
        }
        if (front.length) {
            if (!this.front)
                this.front = new Node();
            this.front.build(front);
        }
        if (back.length) {
            if (!this.back)
                this.back = new Node();
            this.back.build(back);
        }
    };
    Node.fromJSON = function (json) {
        return CSG.fromPolygons(json.polygons.map(function (p) {
            return new Polygon(p.vertices.map(function (v) { return new Vertex(v.pos, v.normal, v.uv); }), p.shared);
        }));
    };
    return Node;
}());

export { CSG, Vertex, Vector, Polygon, Plane }
