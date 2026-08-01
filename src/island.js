import * as THREE from 'three';
import { PALETTE, HOUSE_STYLES } from './palette.js';
import { flat, mesh } from './materials.js';
import { createHouse } from './house.js';
import { createTree, createBush, createSwing, createDock, createFlowerPatch } from './props.js';
import { createCharacter } from './character.js';

/** Gerador determinístico: o arquipélago é sempre o mesmo a cada partida. */
export function makeRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function domeHeight(radius, height, distance) {
  const t = Math.min(1, distance / radius);
  return height * Math.sqrt(Math.max(0, 1 - t * t));
}

/**
 * Ilha em forma de calota verde sobre o mar, com casa, quintal e moradores.
 * `config` descreve tudo o que a ilha tem; a posição fica em `config.position`.
 */
export function createIsland(config) {
  const {
    position,
    radius = 11,
    height = 1.7,
    houseStyle = 'amarela',
    houseOptions = {},
    houseAngle = 0,
    trees = 1,
    apples = false,
    bushes = 1,
    swing = false,
    seed = 1,
  } = config;

  const rng = makeRng(seed);
  const island = new THREE.Group();
  island.position.set(position[0], 0, position[1]);

  // Calota de grama.
  const domeGeometry = new THREE.SphereGeometry(radius, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeometry.scale(1, height / radius, 1);
  const dome = mesh(domeGeometry, flat(PALETTE.grass));
  dome.receiveShadow = true;
  island.add(dome);

  // Faixa de grama logo abaixo da linha d'água: quando a onda baixa, o que
  // aparece continua sendo verde de grama, e não a base escura.
  island.add(
    mesh(new THREE.CylinderGeometry(radius, radius * 0.99, 1.4, 40), flat(PALETTE.grass), 0, -0.7, 0)
  );

  // Base submersa, para a ilha não parecer um adesivo sobre a água.
  island.add(
    mesh(
      new THREE.CylinderGeometry(radius * 0.99, radius * 0.82, 6, 40),
      flat(PALETTE.grassDark),
      0,
      -4.2,
      0
    )
  );

  island.add(createFlowerPatch(radius * 0.85, 30, rng));

  // Casa.
  const style = HOUSE_STYLES[houseStyle] ?? HOUSE_STYLES.amarela;
  const house = createHouse(style, houseOptions);
  const houseDistance = radius * 0.3;
  const houseX = Math.sin(houseAngle) * houseDistance;
  const houseZ = Math.cos(houseAngle) * houseDistance;
  house.position.set(houseX, domeHeight(radius, height, houseDistance) - 0.15, houseZ);
  house.rotation.y = houseAngle;
  island.add(house);

  // Quintal.
  for (let i = 0; i < trees; i++) {
    const angle = houseAngle + Math.PI * (0.55 + rng() * 0.5) * (i % 2 ? 1 : -1);
    const distance = radius * (0.42 + rng() * 0.22);
    const tree = createTree(0.85 + rng() * 0.4, apples);
    tree.position.set(
      Math.sin(angle) * distance,
      domeHeight(radius, height, distance) - 0.1,
      Math.cos(angle) * distance
    );
    island.add(tree);
  }

  const dockAngle = Math.atan2(-position[0], -position[1]);

  for (let i = 0; i < bushes; i++) {
    // Longe do cais: é onde ficam o passageiro e o embarque.
    const angle = dockAngle + 0.8 + rng() * (Math.PI * 2 - 1.6);
    const distance = radius * (0.64 + rng() * 0.24);
    const bush = createBush(0.8 + rng() * 0.5);
    bush.position.set(
      Math.sin(angle) * distance,
      domeHeight(radius, height, distance) - 0.05,
      Math.cos(angle) * distance
    );
    island.add(bush);
  }

  if (swing) {
    const angle = houseAngle - 0.9;
    const distance = radius * 0.5;
    const swingSet = createSwing();
    swingSet.position.set(
      Math.sin(angle) * distance,
      domeHeight(radius, height, distance) - 0.1,
      Math.cos(angle) * distance
    );
    swingSet.rotation.y = angle + Math.PI / 2;
    island.add(swingSet);
    island.userData.swing = swingSet;
  }

  // Cais: fica na borda voltada para o centro do arquipélago.
  const dock = createDock(2.8);
  const dockDistance = radius - 1.2;
  dock.position.set(
    Math.sin(dockAngle) * dockDistance,
    domeHeight(radius, height, dockDistance) + 0.05,
    Math.cos(dockAngle) * dockDistance
  );
  dock.rotation.y = dockAngle;
  island.add(dock);

  island.userData = {
    ...island.userData,
    config,
    radius,
    height,
    house,
    dockAngle,
    dockPoint: new THREE.Vector3(
      position[0] + Math.sin(dockAngle) * (radius + 3.4),
      0,
      position[1] + Math.cos(dockAngle) * (radius + 3.4)
    ),
    surfaceHeight: (localX, localZ) => domeHeight(radius, height, Math.hypot(localX, localZ)),
  };

  return island;
}

/** Coloca um morador na ilha, virado para a água. */
export function placeCharacter(island, options, angle, distanceFactor = 0.72) {
  const { radius, height } = island.userData;
  const distance = radius * distanceFactor;
  const character = createCharacter(options);
  character.position.set(
    Math.sin(angle) * distance,
    domeHeight(radius, height, distance) - 0.05,
    Math.cos(angle) * distance
  );
  character.rotation.y = angle;
  island.add(character);
  return character;
}
