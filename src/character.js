import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, mesh } from './materials.js';

const SPECIES = {
  pig: { skin: PALETTE.pigSkin, snout: true, ears: 'round' },
  dog: { skin: PALETTE.dogSkin, snout: true, ears: 'floppy' },
  rabbit: { skin: PALETTE.rabbitSkin, snout: false, ears: 'long' },
};

function createEars(kind, skin) {
  const group = new THREE.Group();
  if (kind === 'round') {
    const geometry = new THREE.SphereGeometry(0.13, 7, 6);
    for (const sx of [-1, 1]) {
      const ear = mesh(geometry, flat(skin), sx * 0.2, 0.4, -0.02);
      ear.scale.set(0.8, 1.5, 0.55);
      ear.rotation.z = sx * 0.25;
      group.add(ear);
    }
  } else if (kind === 'floppy') {
    const geometry = new THREE.SphereGeometry(0.16, 7, 6);
    for (const sx of [-1, 1]) {
      const ear = mesh(geometry, flat(skin), sx * 0.36, 0.18, -0.05);
      ear.scale.set(0.55, 1.6, 0.6);
      ear.rotation.z = sx * 0.3;
      group.add(ear);
    }
  } else {
    const geometry = new THREE.SphereGeometry(0.12, 7, 6);
    for (const sx of [-1, 1]) {
      const ear = mesh(geometry, flat(skin), sx * 0.16, 0.66, -0.02);
      ear.scale.set(0.55, 3.2, 0.5);
      ear.rotation.z = sx * 0.14;
      group.add(ear);
    }
  }
  return group;
}

function createHat(kind, color) {
  const group = new THREE.Group();
  if (kind === 'captain') {
    group.add(mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.22, 14), flat(color ?? 0x5a4f9c), 0, 0.62, 0));
    const brim = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), flat(color ?? 0x5a4f9c), 0, 0.52, 0.06);
    group.add(brim);
    group.add(mesh(new THREE.CircleGeometry(0.07, 8), flat(0xf4f4f8), 0, 0.64, 0.31));
  } else if (kind === 'cap') {
    group.add(mesh(new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(color ?? 0xef5b4a), 0, 0.4, 0));
    const visor = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 14, 1, false, 0, Math.PI), flat(color ?? 0xef5b4a), 0, 0.4, 0.12);
    visor.rotation.y = -Math.PI / 2;
    group.add(visor);
  } else if (kind === 'sun') {
    group.add(mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.2, 14), flat(color ?? 0xfdf3e0), 0, 0.56, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.045, 18), flat(color ?? 0xfdf3e0), 0, 0.47, 0));
    const band = mesh(new THREE.CylinderGeometry(0.295, 0.305, 0.07, 14), flat(0xef5b7a), 0, 0.5, 0);
    group.add(band);
  } else if (kind === 'beanie') {
    group.add(mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(color ?? 0x2f6fb5), 0, 0.44, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.1, 14), flat(color ?? 0x2f6fb5), 0, 0.44, 0));
    group.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), flat(color ?? 0x2f6fb5), 0, 0.78, 0));
  }
  return group;
}

function createGlasses() {
  const group = new THREE.Group();
  const ring = new THREE.TorusGeometry(0.14, 0.025, 6, 14);
  const material = flat(0x3a3a44);
  for (const sx of [-1, 1]) {
    group.add(mesh(ring, material, sx * 0.19, 0.19, 0.4));
  }
  const bridge = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 5), material, 0, 0.19, 0.4);
  bridge.rotation.z = Math.PI / 2;
  group.add(bridge);
  return group;
}

function createBeard() {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(0.13, 8, 6);
  const material = flat(0xfdf6ee);
  const blobs = [
    [0, -0.16, 0.38, 1.2],
    [-0.2, -0.06, 0.34, 0.9],
    [0.2, -0.06, 0.34, 0.9],
    [-0.13, -0.3, 0.3, 0.8],
    [0.13, -0.3, 0.3, 0.8],
  ];
  for (const [x, y, z, s] of blobs) {
    const blob = mesh(geometry, material, x, y, z);
    blob.scale.setScalar(s);
    group.add(blob);
  }
  return group;
}

/**
 * Personagem no estilo do desenho: cabeça grande com focinho, corpo em bolha
 * colorida, bracinhos finos e sapatos. O personagem olha para +Z.
 */
export function createCharacter(options = {}) {
  const {
    species = 'pig',
    skin,
    clothes = 0xef5b4a,
    shoes = 0xd44a3a,
    scale = 1,
    adult = false,
    hat = null,
    hatColor = null,
    glasses = false,
    beard = false,
    name = '',
  } = options;

  const config = SPECIES[species] ?? SPECIES.pig;
  const skinColor = skin ?? config.skin;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Proporções do desenho: cabeça grande, corpo curto e pernas curtinhas — mas
  // com braços e pernas para fora da silhueta, senão a bolha do corpo os engole.
  const legHeight = adult ? 0.36 : 0.3;
  const bodyRadius = adult ? 0.6 : 0.42;
  const torsoHeight = adult ? 1.12 : 0.8;
  const torsoY = legHeight + torsoHeight / 2;
  const headRadius = adult ? 0.5 : 0.46;

  const torso = adult
    ? mesh(new THREE.SphereGeometry(bodyRadius, 16, 12), flat(clothes), 0, torsoY, 0)
    : mesh(
        new THREE.CylinderGeometry(bodyRadius * 0.6, bodyRadius, torsoHeight, 16),
        flat(clothes),
        0,
        torsoY,
        0
      );
  if (adult) torso.scale.set(1.04, torsoHeight / (bodyRadius * 2), 0.86);
  body.add(torso);

  // Pernas e sapatos, abaixo do corpo.
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, legHeight, 7);
  const shoeGeometry = new THREE.SphereGeometry(0.16, 9, 7);
  for (const sx of [-1, 1]) {
    const legX = sx * bodyRadius * 0.4;
    body.add(mesh(legGeometry, flat(skinColor), legX, legHeight / 2, 0));
    const shoe = mesh(shoeGeometry, flat(shoes), legX, 0.09, 0.06);
    shoe.scale.set(0.85, 0.62, 1.3);
    body.add(shoe);
  }

  // Braços: pivô no ombro, abertos o bastante para aparecerem de qualquer ângulo.
  const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 7);
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * bodyRadius * 1.06, torsoY + torsoHeight * 0.2, 0.04);
    const arm = mesh(armGeometry, flat(skinColor), 0, -0.25, 0);
    pivot.add(arm);
    pivot.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), flat(skinColor), 0, -0.5, 0));
    pivot.rotation.z = sx * -0.72;
    body.add(pivot);
    arms.push(pivot);
  }

  // Rabinho enrolado dos porquinhos.
  if (species === 'pig') {
    const tail = mesh(
      new THREE.TorusGeometry(0.1, 0.035, 6, 12, Math.PI * 1.5),
      flat(skinColor),
      0,
      torsoY + 0.05,
      -bodyRadius * 0.88
    );
    tail.rotation.y = Math.PI / 2;
    body.add(tail);
  }

  // Cabeça.
  const head = new THREE.Group();
  head.position.set(0, legHeight + torsoHeight + headRadius * 0.66, 0);
  head.scale.setScalar(headRadius / 0.46);
  body.add(head);

  const skull = mesh(new THREE.SphereGeometry(0.46, 18, 14), flat(skinColor));
  skull.scale.set(1.12, 1, 0.94);
  head.add(skull);

  if (config.snout) {
    const snout = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.3, 10), flat(skinColor), 0, 0.02, 0.46);
    snout.rotation.x = Math.PI / 2;
    head.add(snout);
    const nostril = new THREE.CircleGeometry(0.035, 6);
    for (const sx of [-1, 1]) {
      head.add(mesh(nostril, flat(species === 'dog' ? 0x2b2b2b : PALETTE.pigSkinDark), sx * 0.05, 0.02, 0.615));
    }
  } else {
    head.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), flat(0xef8fb2), 0, -0.02, 0.44));
  }

  head.add(createEars(config.ears, skinColor));

  // Olhos.
  const eyeGeometry = new THREE.SphereGeometry(0.105, 10, 8);
  const pupilGeometry = new THREE.SphereGeometry(0.05, 8, 6);
  for (const sx of [-1, 1]) {
    head.add(mesh(eyeGeometry, flat(PALETTE.eyeWhite), sx * 0.17, 0.19, 0.36));
    head.add(mesh(pupilGeometry, flat(PALETTE.eyeBlack), sx * 0.17, 0.19, 0.42));
  }

  // Bochechas coradas e sorriso.
  const blush = new THREE.CircleGeometry(0.11, 10);
  for (const sx of [-1, 1]) {
    const cheek = mesh(blush, flat(PALETTE.blush), sx * 0.33, -0.08, 0.31);
    cheek.rotation.y = sx * 0.5;
    head.add(cheek);
  }
  const smile = mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI), flat(0x2b2b2b), 0, -0.14, 0.42);
  smile.rotation.z = Math.PI;
  head.add(smile);

  if (glasses) head.add(createGlasses());
  if (beard) head.add(createBeard());
  if (hat) head.add(createHat(hat, hatColor));

  root.scale.setScalar(scale);
  root.userData = {
    name,
    arms,
    head,
    body,
    phase: Math.random() * Math.PI * 2,
    waving: 0,
    height: (legHeight + torsoHeight + headRadius * 1.7) * scale,
  };

  return root;
}

/** Balanço de respiração + aceno quando o barco chega perto. */
export function updateCharacter(character, time, dt) {
  const data = character.userData;
  const bob = Math.sin(time * 2.4 + data.phase) * 0.03;
  data.body.position.y = bob;
  data.head.rotation.z = Math.sin(time * 1.6 + data.phase) * 0.05;

  const target = data.wantsToWave ? 1 : 0;
  data.waving += (target - data.waving) * Math.min(1, dt * 6);

  const wave = data.waving;
  const swing = Math.sin(time * 9) * 0.6;
  data.arms[1].rotation.z = -0.35 - wave * (2.4 + swing * 0.3);
  data.arms[1].rotation.x = wave * swing * 0.2;
  data.arms[0].rotation.z = 0.35 + Math.sin(time * 2 + data.phase) * 0.05;
}
