import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, mesh } from './materials.js';

/** Árvore de copa em folhas ovais, como a macieira ao lado da casa rosa. */
export function createTree(scale = 1, withApples = false) {
  const tree = new THREE.Group();
  const trunk = mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 2.6, 7),
    flat(PALETTE.trunk),
    0,
    1.3,
    0
  );
  tree.add(trunk);

  const branchGeometry = new THREE.CylinderGeometry(0.09, 0.12, 1.3, 6);
  const leafGeometry = new THREE.SphereGeometry(0.42, 8, 6);
  const appleGeometry = new THREE.SphereGeometry(0.14, 7, 6);

  const branches = 4;
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2 + 0.4;
    const lean = 0.7;
    const branch = mesh(branchGeometry, flat(PALETTE.trunk), 0, 2.4, 0);
    branch.rotation.set(Math.cos(angle) * lean, 0, Math.sin(angle) * -lean);
    branch.position.set(Math.sin(angle) * 0.35, 2.5, Math.cos(angle) * 0.35);
    tree.add(branch);

    for (let j = 0; j < 3; j++) {
      const spread = 0.75 + j * 0.32;
      const leaf = mesh(
        leafGeometry,
        flat(j % 2 ? PALETTE.leaf : PALETTE.leafDark),
        Math.sin(angle) * spread,
        2.9 + j * 0.26 + Math.cos(angle * 2) * 0.15,
        Math.cos(angle) * spread
      );
      leaf.scale.set(1.25, 0.85, 1.25);
      tree.add(leaf);
      if (withApples && j === 1) {
        tree.add(
          mesh(
            appleGeometry,
            flat(PALETTE.flowerRed),
            Math.sin(angle) * spread * 1.05,
            2.72 + j * 0.26,
            Math.cos(angle) * spread * 1.05
          )
        );
      }
    }
  }

  tree.scale.setScalar(scale);
  return tree;
}

/** Arbusto: bolhas verdes achatadas. */
export function createBush(scale = 1) {
  const bush = new THREE.Group();
  const geometry = new THREE.SphereGeometry(0.5, 8, 6);
  const blobs = [
    [0, 0.32, 0, 1],
    [0.42, 0.24, 0.1, 0.78],
    [-0.4, 0.22, -0.08, 0.72],
  ];
  for (const [x, y, z, s] of blobs) {
    const blob = mesh(geometry, flat(x === 0 ? PALETTE.leaf : PALETTE.leafDark), x, y, z);
    blob.scale.set(s * 1.15, s * 0.9, s * 1.15);
    bush.add(blob);
  }
  bush.scale.setScalar(scale);
  return bush;
}

/** Balanço amarelo do quintal, como na ilha da casa lilás. */
export function createSwing() {
  const swing = new THREE.Group();
  const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6);
  const yellow = flat(PALETTE.flowerYellow);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = mesh(legGeometry, yellow, sx * 0.85, 1.05, sz * 0.5);
      leg.rotation.set(sz * 0.22, 0, -sx * 0.36);
      swing.add(leg);
    }
  }
  const bar = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6), yellow, 0, 2.05, 0);
  bar.rotation.z = Math.PI / 2;
  swing.add(bar);

  const seat = new THREE.Group();
  const ropeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 4);
  for (const sx of [-1, 1]) {
    seat.add(mesh(ropeGeometry, flat(0xe0e0e6), sx * 0.28, -0.6, 0));
  }
  seat.add(mesh(new THREE.BoxGeometry(0.72, 0.1, 0.34), flat(PALETTE.flowerRed), 0, -1.2, 0));
  seat.position.set(0, 2.05, 0);
  swing.add(seat);
  swing.userData.seat = seat;
  return swing;
}

/** Pequeno cais de madeira: marca onde o barco atraca. */
export function createDock(length = 2.6) {
  const dock = new THREE.Group();
  // Tábua corrida, com ripas por cima para dar textura sem virar uma escada.
  const base = mesh(
    new THREE.BoxGeometry(1.0, 0.14, length),
    flat(PALETTE.woodDark),
    0,
    0,
    length / 2 - 0.4
  );
  dock.add(base);

  const plankGeometry = new THREE.BoxGeometry(0.94, 0.07, 0.3);
  const planks = Math.round(length / 0.4);
  for (let i = 0; i < planks; i++) {
    dock.add(mesh(plankGeometry, flat(PALETTE.woodDeck), 0, 0.09, -0.2 + i * 0.4));
  }

  const postGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
  for (const sx of [-1, 1]) {
    dock.add(mesh(postGeometry, flat(PALETTE.woodDark), sx * 0.38, -0.7, length - 0.75));
  }
  return dock;
}

/** Flores minúsculas espalhadas na grama. */
export function createFlowerPatch(radius, count = 26, rng = Math.random) {
  const group = new THREE.Group();
  const geometry = new THREE.CircleGeometry(0.09, 5);
  const colors = [PALETTE.flowerYellow, 0xffffff, 0xf6a0c8];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const distance = Math.sqrt(rng()) * radius;
    const flower = mesh(
      geometry,
      flat(colors[Math.floor(rng() * colors.length)]),
      Math.cos(angle) * distance,
      0.02,
      Math.sin(angle) * distance
    );
    flower.rotation.x = -Math.PI / 2;
    group.add(flower);
  }
  return group;
}
