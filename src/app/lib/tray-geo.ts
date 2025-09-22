import { trayChamfer, traySizes, trayWidth } from "./constants";

export function genTrayGeometric() {
  const sizes = traySizes;
  const width = trayWidth;
  const chamfer = trayChamfer;

  const legSize = chamfer / Math.SQRT2;

  const halfX = sizes.x / 2;
  const halfY = sizes.y / 2;
  const halfZ = sizes.z / 2;

  const midY = width / 2;
  const topY = sizes.y - width / 2;

  const chamferCut = chamfer - width * Math.SQRT2;
  const offset = (width * (Math.SQRT2 + 1)) / 4;

  const geometriesData: [
    [number, number, number],
    [number, number, number],
    number?
  ][] = [
    // floor
    [
      [sizes.x - legSize * 2, width, sizes.z],
      [0, midY, 0],
    ],
    [
      [legSize, width, sizes.z - legSize * 2],
      [-halfX + legSize / 2, midY, 0],
    ],
    [
      [legSize, width, sizes.z - legSize * 2],
      [halfX - legSize / 2, midY, 0],
    ],
    [
      [chamfer, width, chamfer],
      [-halfX + legSize, midY, -halfZ + legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [-halfX + legSize, midY, halfZ - legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [halfX - legSize, midY, -halfZ + legSize],
      Math.PI / 4,
    ],
    [
      [chamfer, width, chamfer],
      [halfX - legSize, midY, halfZ - legSize],
      Math.PI / 4,
    ],

    // second layer
    [
      [width * 2, width, sizes.z - legSize * 2],
      [-halfX + width * 2, midY + width, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, midY + width, -halfZ + width * 2],
    ],
    [
      [width * 2, width, chamferCut],
      [
        -halfX + legSize / 2 + width / Math.SQRT2 + width / 2,
        midY + width,
        halfZ - (legSize / 2 + width / Math.SQRT2 + width / 2),
      ],
      Math.PI / 4,
    ],
    [
      [width * 2, width, chamferCut],
      [
        -halfX + legSize / 2 + width / Math.SQRT2 + width / 2,
        midY + width,
        -halfZ + legSize / 2 + width / Math.SQRT2 + width / 2,
      ],
      -Math.PI / 4,
    ],
    [
      [width * 2, width, sizes.z - legSize * 2],
      [halfX - width * 2, midY + width, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, midY + width, halfZ - width * 2],
    ],
    [
      [width * 2, width, chamferCut],
      [
        halfX - (legSize / 2 + width / Math.SQRT2 + width / 2),
        midY + width,
        halfZ - (legSize / 2 + width / Math.SQRT2 + width / 2),
      ],
      -Math.PI / 4,
    ],
    [
      [width * 2, width, chamferCut],
      [
        halfX - (legSize / 2 + width / Math.SQRT2 + width / 2),
        midY + width,
        -halfZ + legSize / 2 + width / Math.SQRT2 + width / 2,
      ],
      Math.PI / 4,
    ],

    // vertical walls
    [
      [width, sizes.y - width * 3, sizes.z - legSize * 2],
      [-halfX + width * 1.5, midY + halfY, 0],
    ],
    [
      [sizes.x - legSize * 2, sizes.y - width * 3, width],
      [0, midY + halfY, -halfZ + width * 1.5],
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        -halfX + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
        midY + halfY,
        halfZ - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
      ],
      Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        -halfX + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
        midY + halfY,
        -halfZ + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
      ],
      -Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, sizes.z - legSize * 2],
      [halfX - width * 1.5, midY + halfY, 0],
    ],
    [
      [sizes.x - legSize * 2, sizes.y - width * 3, width],
      [0, midY + halfY, halfZ - width * 1.5],
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        halfX - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
        midY + halfY,
        halfZ - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
      ],
      -Math.PI / 4,
    ],
    [
      [width, sizes.y - width * 3, chamferCut],
      [
        halfX - (legSize / 2 + width / (2 * Math.SQRT2) + width / 2),
        midY + halfY,
        -halfZ + legSize / 2 + width / (2 * Math.SQRT2) + width / 2,
      ],
      Math.PI / 4,
    ],

    // top
    [
      [width * 2, width, sizes.z - legSize * 2],
      [-halfX + width, topY, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, topY, -halfZ + width],
    ],
    [
      [width * 2, width, sizes.z - legSize * 2],
      [halfX - width, topY, 0],
    ],
    [
      [sizes.x - legSize * 2, width, width * 2],
      [0, topY, halfZ - width],
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [-halfX + legSize / 2 + offset, topY, halfZ - (legSize / 2 + offset)],
      Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [-halfX + legSize / 2 + offset, topY, -halfZ + (legSize / 2 + offset)],
      -Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [halfX - legSize / 2 - offset, topY, halfZ - (legSize / 2 + offset)],
      -Math.PI / 4,
    ],
    [
      [width * (1 + Math.SQRT2 - 1 / Math.SQRT2), width, chamfer],
      [halfX - legSize / 2 - offset, topY, -halfZ + (legSize / 2 + offset)],
      Math.PI / 4,
    ],
  ];
  return geometriesData;
}
