// TODO check these comments:
// Assuming that polygon vertices are in clockwise order

type Vector = {
  x: number;
  y: number;
};

type Edge = {
  index: number;
  inwardNormal: Vector;
  outwardNormal: Vector;
  vertex1: Vector;
  vertex2: Vector;
};

type OffsetEdge = {
  vertex1: Vector;
  vertex2: Vector;
};

type Polygon = {
  edges: Edge[];
  offsetEdges?: OffsetEdge[];
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  vertices: Vector[];
};

const TWO_PI = Math.PI * 2;

// See http://paulbourke.net/geometry/pointlineplane/
function inwardEdgeNormal(vertex1: Vector, vertex2: Vector): Vector {
  // Assuming that polygon vertices are in clockwise order
  const dx = vertex2.x - vertex1.x;
  const dy = vertex2.y - vertex1.y;
  const edgeLength = Math.sqrt(dx * dx + dy * dy);

  return {
    x: -dy / edgeLength,
    y: dx / edgeLength,
  };
}

function outwardEdgeNormal(vertex1: Vector, vertex2: Vector): Vector {
  var n = inwardEdgeNormal(vertex1, vertex2);

  return {
    x: -n.x,
    y: -n.y,
  };
}

function createPolygon(vertices: Vector[]): Polygon {
  const edges: Edge[] = [];
  let minX = vertices.length > 0 ? vertices[0].x : undefined;
  let minY = vertices.length > 0 ? vertices[0].y : undefined;
  let maxX = minX;
  let maxY = minY;

  for (let i = 0; i < vertices.length; i++) {
    const vertex1 = vertices[i];
    const vertex2 = vertices[(i + 1) % vertices.length];

    const outwardNormal = outwardEdgeNormal(vertex1, vertex2);

    const inwardNormal = inwardEdgeNormal(vertex1, vertex2);

    const edge: Edge = {
      vertex1,
      vertex2,
      index: i,
      outwardNormal,
      inwardNormal,
    };

    edges.push(edge);

    const x = vertices[i].x;
    const y = vertices[i].y;
    minX = Math.min(x, minX);
    minY = Math.min(y, minY);
    maxX = Math.max(x, maxX);
    maxY = Math.max(y, maxY);
  }

  const polygon: Polygon = {
    vertices,
    edges,
    minX,
    minY,
    maxX,
    maxY,
  };

  return polygon;
}

// based on http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/, edgeA => "line a", edgeB => "line b"

function edgesIntersection(edgeA: Edge | OffsetEdge, edgeB: Edge | OffsetEdge) {
  const den =
    (edgeB.vertex2.y - edgeB.vertex1.y) * (edgeA.vertex2.x - edgeA.vertex1.x) -
    (edgeB.vertex2.x - edgeB.vertex1.x) * (edgeA.vertex2.y - edgeA.vertex1.y);

  if (den == 0) {
    return null; // lines are parallel or coincident
  }

  const ua =
    ((edgeB.vertex2.x - edgeB.vertex1.x) * (edgeA.vertex1.y - edgeB.vertex1.y) -
      (edgeB.vertex2.y - edgeB.vertex1.y) *
        (edgeA.vertex1.x - edgeB.vertex1.x)) /
    den;

  const ub =
    ((edgeA.vertex2.x - edgeA.vertex1.x) * (edgeA.vertex1.y - edgeB.vertex1.y) -
      (edgeA.vertex2.y - edgeA.vertex1.y) *
        (edgeA.vertex1.x - edgeB.vertex1.x)) /
    den;

  // Edges are not intersecting but the lines defined by them are
  const isIntersectionOutside = ua < 0 || ub < 0 || ua > 1 || ub > 1;

  return {
    x: edgeA.vertex1.x + ua * (edgeA.vertex2.x - edgeA.vertex1.x),
    y: edgeA.vertex1.y + ua * (edgeA.vertex2.y - edgeA.vertex1.y),
    isIntersectionOutside,
  };
}

function appendArc(
  arcSegments: number,
  vertices: Vector[],
  center: Vector,
  radius: number,
  startVertex: Vector,
  endVertex: Vector,
  isPaddingBoundary: boolean
) {
  var startAngle = Math.atan2(
    startVertex.y - center.y,
    startVertex.x - center.x
  );
  var endAngle = Math.atan2(endVertex.y - center.y, endVertex.x - center.x);

  if (startAngle < 0) {
    startAngle += TWO_PI;
  }

  if (endAngle < 0) {
    endAngle += TWO_PI;
  }

  const angle =
    startAngle > endAngle
      ? startAngle - endAngle
      : startAngle + TWO_PI - endAngle;
  const angleStep = (isPaddingBoundary ? -angle : TWO_PI - angle) / arcSegments;

  vertices.push(startVertex);

  for (let i = 1; i < arcSegments; ++i) {
    const angle = startAngle + angleStep * i;

    const vertex = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };

    vertices.push(vertex);
  }

  vertices.push(endVertex);
}

function createOffsetEdge(edge: Edge, dx: number, dy: number): OffsetEdge {
  return {
    vertex1: {
      x: edge.vertex1.x + dx,
      y: edge.vertex1.y + dy,
    },
    vertex2: {
      x: edge.vertex2.x + dx,
      y: edge.vertex2.y + dy,
    },
  };
}

function createMarginPolygon(
  polygon: Polygon,
  offset: number,
  arcSegments: number
): Polygon {
  const offsetEdges: OffsetEdge[] = [];

  for (let i = 0; i < polygon.edges.length; i++) {
    const edge = polygon.edges[i];
    const dx = edge.outwardNormal.x * offset;
    const dy = edge.outwardNormal.y * offset;
    offsetEdges.push(createOffsetEdge(edge, dx, dy));
  }

  const vertices: Vector[] = [];

  for (let i = 0; i < offsetEdges.length; i++) {
    const thisEdge = offsetEdges[i];
    const prevEdge =
      offsetEdges[(i + offsetEdges.length - 1) % offsetEdges.length];
    const vertex = edgesIntersection(prevEdge, thisEdge);

    if (vertex && (!vertex.isIntersectionOutside || arcSegments < 1)) {
      vertices.push({
        x: vertex.x,
        y: vertex.y,
      });
    } else {
      const arcCenter = polygon.edges[i].vertex1;

      appendArc(
        arcSegments,
        vertices,
        arcCenter,
        offset,
        prevEdge.vertex2,
        thisEdge.vertex1,
        false
      );
    }
  }

  const marginPolygon = createPolygon(vertices);

  marginPolygon.offsetEdges = offsetEdges;

  return marginPolygon;
}

function createPaddingPolygon(
  polygon: Polygon,
  offset: number,
  arcSegments: number
): Polygon {
  const offsetEdges: OffsetEdge[] = [];

  for (let i = 0; i < polygon.edges.length; i++) {
    const edge = polygon.edges[i];
    const dx = edge.inwardNormal.x * offset;
    const dy = edge.inwardNormal.y * offset;
    offsetEdges.push(createOffsetEdge(edge, dx, dy));
  }

  const vertices: Vector[] = [];

  for (let i = 0; i < offsetEdges.length; i++) {
    const thisEdge = offsetEdges[i];
    const prevEdge =
      offsetEdges[(i + offsetEdges.length - 1) % offsetEdges.length];
    const vertex = edgesIntersection(prevEdge, thisEdge);
    if (vertex && (!vertex.isIntersectionOutside || arcSegments < 1)) {
      vertices.push({
        x: vertex.x,
        y: vertex.y,
      });
    } else {
      const arcCenter = polygon.edges[i].vertex1;

      appendArc(
        arcSegments,
        vertices,
        arcCenter,
        offset,
        prevEdge.vertex2,
        thisEdge.vertex1,
        true
      );
    }
  }

  const paddingPolygon = createPolygon(vertices);

  paddingPolygon.offsetEdges = offsetEdges;

  return paddingPolygon;
}

export default function offsetPolygon(
  vertices: Vector[],
  offset: number,
  arcSegments: number = 0
): Vector[] {
  const polygon = createPolygon(vertices);

  if (offset > 0) {
    return createMarginPolygon(polygon, offset, arcSegments).vertices;
  } else {
    return createPaddingPolygon(polygon, -offset, arcSegments).vertices;
  }
}
