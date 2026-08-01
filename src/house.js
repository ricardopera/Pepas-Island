import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, mesh, roundedRectShape, extrude } from './materials.js';
import { roofTexture } from './textures.js';

const roofMaterials = new Map();
function roofMaterial(color) {
  let material = roofMaterials.get(color);
  if (!material) {
    const map = roofTexture(color);
    map.repeat.set(0.34, 0.3);
    material = new THREE.MeshLambertMaterial({ map });
    roofMaterials.set(color, material);
  }
  return material;
}

/** Janela de quatro vidros com moldura branca, igual às das casas do desenho. */
function createWindow(width = 0.9, height = 1.0) {
  const group = new THREE.Group();
  const frame = mesh(
    new THREE.BoxGeometry(width, height, 0.12),
    flat(PALETTE.windowFrame)
  );
  group.add(frame);

  const paneW = (width - 0.26) / 2;
  const paneH = (height - 0.28) / 2;
  const paneGeometry = new THREE.PlaneGeometry(paneW, paneH);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const pane = mesh(
        paneGeometry,
        flat(PALETTE.windowGlass),
        sx * (paneW / 2 + 0.045),
        sy * (paneH / 2 + 0.045),
        0.07
      );
      group.add(pane);
    }
  }
  return group;
}

/** Floreira sob a janela, como na casa lilás. */
function createFlowerBox(width = 1.0) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.BoxGeometry(width, 0.24, 0.22), flat(0xf3c98a)));

  const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 5);
  const petalGeometry = new THREE.CircleGeometry(0.09, 6);
  const colors = [PALETTE.flowerRed, PALETTE.flowerYellow, 0xf27ab8];
  const count = 3;
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1) - 0.5) * (width - 0.24);
    group.add(mesh(stemGeometry, flat(PALETTE.leafDark), x, 0.24, 0.02));
    const petal = mesh(petalGeometry, flat(colors[i % colors.length]), x, 0.4, 0.06);
    group.add(petal);
    group.add(mesh(new THREE.CircleGeometry(0.03, 6), flat(PALETTE.flowerYellow), x, 0.4, 0.07));
  }
  return group;
}

/** Antena de TV no telhado — detalhe presente em todas as casas das ilhas. */
function createAntenna() {
  const group = new THREE.Group();
  const rod = new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6);
  group.add(mesh(rod, flat(0x3a3a44), 0, 0.75));
  const bar = new THREE.CylinderGeometry(0.028, 0.028, 0.9, 6);
  for (let i = 0; i < 3; i++) {
    const cross = mesh(bar, flat(0x3a3a44), 0, 0.85 + i * 0.28, 0);
    cross.rotation.z = Math.PI / 2;
    group.add(cross);
  }
  return group;
}

/** Trepadeira com flores vermelhas, como na casa rosa da família Pig. */
function createVine(width, height) {
  const group = new THREE.Group();
  const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, height, 5);
  group.add(mesh(stemGeometry, flat(PALETTE.leafDark), 0, height / 2, 0));

  const leafGeometry = new THREE.CircleGeometry(0.16, 6);
  const flowerGeometry = new THREE.CircleGeometry(0.11, 6);
  const branches = 6;
  for (let i = 0; i < branches; i++) {
    const t = i / (branches - 1);
    const y = 0.35 + t * (height - 0.6);
    const x = (i % 2 ? 1 : -1) * (0.25 + t * width * 0.42);
    const branch = mesh(
      new THREE.CylinderGeometry(0.035, 0.035, Math.abs(x) * 1.1, 5),
      flat(PALETTE.leafDark),
      x / 2,
      y,
      0
    );
    branch.rotation.z = Math.PI / 2 - Math.sign(x) * 0.35;
    group.add(branch);
    group.add(mesh(leafGeometry, flat(PALETTE.leaf), x * 0.6, y + 0.16, 0.03));
    group.add(mesh(flowerGeometry, flat(PALETTE.flowerRed), x, y + 0.05, 0.04));
  }
  return group;
}

/**
 * Casa de duas águas com paredes chapadas, telhado de telhas e janelinhas brancas.
 * A frente da casa aponta para +Z.
 */
export function createHouse(style, options = {}) {
  const {
    width = 4.2,
    depth = 3.4,
    wallHeight = 4.6,
    roofHeight = 2.4,
    antenna = true,
    chimney = false,
    flowerBoxes = false,
    vine = false,
    archedDoor = false,
  } = options;

  const house = new THREE.Group();
  const halfW = width / 2;
  const halfD = depth / 2;

  const walls = mesh(
    new THREE.BoxGeometry(width, wallHeight, depth),
    flat(style.wall),
    0,
    wallHeight / 2,
    0
  );
  walls.castShadow = true;
  house.add(walls);

  // Telhado: prisma triangular com beiral saliente nos quatro lados.
  const overhang = 0.32;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfW - overhang, 0);
  roofShape.lineTo(halfW + overhang, 0);
  roofShape.lineTo(0, roofHeight);
  roofShape.closePath();
  const roofGeometry = extrude(roofShape, depth + overhang * 2);
  roofGeometry.translate(0, 0, -halfD - overhang);
  const roof = mesh(roofGeometry, roofMaterial(style.roof), 0, wallHeight, 0);
  roof.castShadow = true;
  house.add(roof);

  // Frontão: fecha o triângulo entre parede e telhado.
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-halfW, 0);
  gableShape.lineTo(halfW, 0);
  gableShape.lineTo(0, roofHeight);
  gableShape.closePath();
  const gable = extrude(gableShape, depth);
  gable.translate(0, 0, -halfD);
  house.add(mesh(gable, flat(style.wall), 0, wallHeight, 0));

  // Janelas: duas no andar de cima, duas embaixo, ao lado da porta.
  const windowY = [wallHeight * 0.72, wallHeight * 0.3];
  const windowX = [-width * 0.24, width * 0.24];
  for (const y of windowY) {
    for (const x of windowX) {
      const isGroundDoorSide = y === windowY[1] && x > 0;
      if (isGroundDoorSide) continue;
      const win = createWindow(width * 0.24, wallHeight * 0.2);
      win.position.set(x, y, halfD + 0.01);
      house.add(win);
      if (flowerBoxes) {
        const box = createFlowerBox(width * 0.3);
        box.position.set(x, y - wallHeight * 0.12, halfD + 0.06);
        house.add(box);
      }
    }
  }

  // Janelas laterais e dos fundos: nenhuma parede fica vazia.
  const sideWindow = createWindow(depth * 0.26, wallHeight * 0.2);
  sideWindow.rotation.y = -Math.PI / 2;
  sideWindow.position.set(-halfW - 0.01, wallHeight * 0.55, 0);
  house.add(sideWindow);

  for (const y of windowY) {
    const back = createWindow(width * 0.24, wallHeight * 0.2);
    back.rotation.y = Math.PI;
    back.position.set(y === windowY[0] ? 0 : width * 0.24, y, -halfD - 0.01);
    house.add(back);
  }

  // Porta.
  const doorW = width * 0.22;
  const doorH = wallHeight * 0.38;
  const doorGroup = new THREE.Group();
  const doorShape = archedDoor
    ? roundedRectShape(doorW, doorH, doorW * 0.34)
    : roundedRectShape(doorW, doorH, 0.04);
  const doorGeometry = extrude(doorShape, 0.12);
  doorGroup.add(mesh(doorGeometry, flat(style.door), 0, 0, -0.02));
  doorGroup.add(
    mesh(new THREE.SphereGeometry(0.07, 8, 6), flat(PALETTE.gold), doorW * 0.3, 0, 0.12)
  );
  doorGroup.position.set(width * 0.26, doorH / 2, halfD + 0.02);
  house.add(doorGroup);

  if (antenna) {
    const ant = createAntenna();
    ant.position.set(0, wallHeight + roofHeight, 0);
    house.add(ant);
  }

  if (chimney) {
    const stack = mesh(
      new THREE.BoxGeometry(0.5, 1.5, 0.5),
      flat(style.trim === 0xffffff ? 0xe0e0e8 : style.trim),
      -width * 0.28,
      wallHeight + roofHeight * 0.55,
      0
    );
    house.add(stack);
    house.add(
      mesh(new THREE.BoxGeometry(0.62, 0.16, 0.62), flat(0xc8c8d2), -width * 0.28, wallHeight + roofHeight * 0.55 + 0.8, 0)
    );
  }

  if (vine) {
    const v = createVine(width * 0.5, wallHeight * 0.8);
    v.position.set(-width * 0.12, 0, halfD + 0.05);
    house.add(v);
  }

  house.userData.totalHeight = wallHeight + roofHeight;
  return house;
}
