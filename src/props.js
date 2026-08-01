import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, mesh, beam } from './materials.js';

/** Árvore de tronco fino e copa cheia, como as macieiras do desenho. */
export function createTree(scale = 1, withApples = false) {
  const tree = new THREE.Group();
  tree.add(mesh(new THREE.CylinderGeometry(0.13, 0.2, 2.5, 8), flat(PALETTE.trunk), 0, 1.25, 0));

  const branchGeometry = new THREE.CylinderGeometry(0.07, 0.1, 1.1, 6);
  const leafGeometry = new THREE.SphereGeometry(0.44, 10, 8);
  const appleGeometry = new THREE.SphereGeometry(0.16, 8, 7);

  const branches = 5;
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2 + 0.3;
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);

    // Galho saindo do topo do tronco, inclinado para fora.
    const branch = mesh(branchGeometry, flat(PALETTE.trunk), dirX * 0.34, 2.7, dirZ * 0.34);
    branch.rotation.set(dirZ * 0.62, 0, -dirX * 0.62);
    tree.add(branch);

    // Cada galho termina num tufo de folhas, e os tufos juntos fecham a copa.
    const tips = [
      [0.95, 3.15, 1.0],
      [0.55, 3.5, 0.82],
      [1.15, 3.45, 0.74],
    ];
    tips.forEach(([spread, y, size], j) => {
      const leaf = mesh(
        leafGeometry,
        flat(j === 1 ? PALETTE.leaf : PALETTE.leafDark),
        dirX * spread,
        y,
        dirZ * spread
      );
      leaf.scale.set(size * 1.2, size * 0.92, size * 1.2);
      tree.add(leaf);
    });

    // Miolo da copa, para não aparecer buraco entre os tufos.
    if (i === 0) {
      const core = mesh(leafGeometry, flat(PALETTE.leaf), 0, 3.35, 0);
      core.scale.set(1.7, 1.15, 1.7);
      tree.add(core);
    }

    if (withApples) {
      tree.add(
        mesh(appleGeometry, flat(PALETTE.flowerRed), dirX * 1.35, 3.1, dirZ * 1.35)
      );
    }
  }

  tree.scale.setScalar(scale);
  return tree;
}

/** Arbusto: bolhas verdes achatadas. */
export function createBush(scale = 1) {
  const bush = new THREE.Group();
  const geometry = new THREE.SphereGeometry(0.5, 14, 10);
  const blobs = [
    [0, 0.3, 0, 1],
    [0.44, 0.22, 0.08, 0.76],
    [-0.42, 0.2, -0.06, 0.7],
    [0.06, 0.24, 0.34, 0.6],
  ];
  for (const [x, y, z, s] of blobs) {
    const blob = mesh(geometry, flat(x === 0 ? PALETTE.leaf : PALETTE.leafDark), x, y, z);
    blob.scale.set(s * 1.15, s * 0.9, s * 1.15);
    bush.add(blob);
  }
  bush.scale.setScalar(scale);
  return bush;
}

/**
 * Balanço amarelo do quintal: dois cavaletes em A, uma barra ligando os topos e
 * o assento pendurado por duas cordas. O assento fica num pivô para balançar.
 */
export function createSwing() {
  const swing = new THREE.Group();
  const yellow = flat(PALETTE.flowerYellow);

  const height = 2.3;
  const halfWidth = 1.05;
  const spread = 0.85;

  // Cada perna vai do pé no chão até o topo do cavalete: assim o "A" aparece
  // tanto de frente quanto de lado, e as quatro pernas se encontram na barra.
  for (const sx of [-1, 1]) {
    const topo = new THREE.Vector3(sx * halfWidth, height, 0);
    for (const sz of [-1, 1]) {
      const pe = new THREE.Vector3(sx * (halfWidth + 0.34), 0, (sz * spread) / 2);
      swing.add(beam(pe, topo, 0.075, yellow));
    }
  }

  // Barra superior, ligando os topos dos dois cavaletes.
  const bar = mesh(
    new THREE.CylinderGeometry(0.075, 0.075, halfWidth * 2 + 0.3, 7),
    yellow,
    0,
    height,
    0
  );
  bar.rotation.z = Math.PI / 2;
  swing.add(bar);

  // Assento pendurado: fica num pivô na altura da barra para poder balançar.
  const seat = new THREE.Group();
  seat.position.set(0, height, 0);
  const ropeLength = 1.35;
  const ropeGeometry = new THREE.CylinderGeometry(0.028, 0.028, ropeLength, 5);
  for (const sx of [-1, 1]) {
    seat.add(mesh(ropeGeometry, flat(0xe6e6ec), sx * 0.3, -ropeLength / 2, 0));
  }
  seat.add(mesh(new THREE.BoxGeometry(0.78, 0.1, 0.36), flat(PALETTE.flowerRed), 0, -ropeLength, 0));
  swing.add(seat);

  swing.userData.seat = seat;
  swing.userData.phase = Math.random() * Math.PI * 2;
  return swing;
}

/** Vai e vem lento do assento. */
export function updateSwing(swing, time) {
  const seat = swing.userData.seat;
  if (seat) seat.rotation.x = Math.sin(time * 1.1 + swing.userData.phase) * 0.32;
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
  const geometry = new THREE.CircleGeometry(0.12, 6);
  const miolo = new THREE.CircleGeometry(0.045, 6);
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
    const centro = mesh(miolo, flat(PALETTE.flowerYellow), flower.position.x, 0.025, flower.position.z);
    centro.rotation.x = -Math.PI / 2;
    group.add(centro);
  }
  return group;
}
