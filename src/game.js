import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { flat, unlit, mesh } from './materials.js';
import { createIsland, placeCharacter, makeRng } from './island.js';
import { updateCharacter } from './character.js';
import { updateSwing } from './props.js';

const HOME_NAME = 'Ilha da Família Pig';
const WORLD_POSITION = new THREE.Vector3();

/** O arquipélago: cada ilha tem casa, quintal, moradores e um amigo esperando carona. */
const ISLAND_LAYOUT = [
  {
    name: HOME_NAME,
    home: true,
    position: [0, 78],
    radius: 13.5,
    houseStyle: 'rosa',
    houseAngle: 0.2,
    houseOptions: { vine: true, archedDoor: true, width: 4.6, wallHeight: 5.0 },
    trees: 2,
    apples: true,
    bushes: 3,
    residents: [
      { species: 'pig', adult: true, clothes: 0x4fb8a8, shoes: 0xd44a3a, glasses: true, scale: 1.05, name: 'Papai Pig', angle: 0.8 },
      { species: 'pig', adult: true, clothes: 0xef5b4a, shoes: 0x3f7fc4, scale: 1.0, name: 'Mamãe Pig', angle: 1.15 },
    ],
  },
  {
    name: 'Ilha Amarela',
    position: [-96, 22],
    radius: 10.5,
    houseStyle: 'amarela',
    houseAngle: -0.5,
    trees: 1,
    bushes: 2,
    passenger: { species: 'pig', clothes: 0xef5b4a, shoes: 0xd44a3a, scale: 0.8, name: 'Nina Porquinha' },
    residents: [
      { species: 'pig', adult: true, clothes: 0x6fae4f, shoes: 0x4a7a3a, name: 'Tio Pig', angle: -1.9 },
    ],
  },
  {
    name: 'Ilha do Balanço',
    position: [88, -36],
    radius: 11,
    houseStyle: 'lilas',
    houseAngle: 0.1,
    houseOptions: { flowerBoxes: true, archedDoor: true },
    swing: true,
    trees: 1,
    bushes: 2,
    passenger: { species: 'rabbit', clothes: 0x3f8ad6, shoes: 0x2f6aa8, scale: 0.8, name: 'Lia Coelha' },
  },
  {
    name: 'Ilha do Farol Branco',
    position: [-52, -102],
    radius: 10.5,
    houseStyle: 'branca',
    houseAngle: 2.6,
    houseOptions: { chimney: true, wallHeight: 5.2 },
    trees: 2,
    bushes: 1,
    passenger: { species: 'dog', clothes: 0xf4a63a, shoes: 0xd4762a, scale: 0.82, name: 'Dudu Cão' },
    residents: [
      { species: 'dog', adult: true, clothes: 0x4fb8a8, shoes: 0x3a8a7a, hat: 'cap', name: 'Sr. Cão', angle: 2.1 },
    ],
  },
  {
    name: 'Ilha Verde',
    position: [122, 70],
    radius: 10,
    houseStyle: 'verde',
    houseAngle: -2.2,
    trees: 2,
    apples: true,
    bushes: 3,
    passenger: { species: 'pig', clothes: 0xa06fd0, shoes: 0x7a4fb0, scale: 0.78, name: 'Téo Porquinho' },
  },
  {
    name: 'Ilha Azul',
    position: [-132, -44],
    radius: 10.5,
    houseStyle: 'azul',
    houseAngle: 1.7,
    houseOptions: { chimney: true },
    trees: 1,
    bushes: 2,
    passenger: { species: 'rabbit', clothes: 0xef5b7a, shoes: 0xc94a72, hat: 'beanie', scale: 0.82, name: 'Bia Coelha' },
  },
  {
    name: 'Ilha Pêssego',
    position: [38, -125],
    radius: 10,
    houseStyle: 'pessego',
    houseAngle: 3.0,
    houseOptions: { flowerBoxes: true },
    trees: 1,
    bushes: 2,
    passenger: { species: 'dog', clothes: 0x3fc94f, shoes: 0x2f9a3f, scale: 0.8, name: 'Zeca Cão' },
  },
];

/** Balãozinho de exclamação sobre quem está esperando carona. */
function createMarker() {
  const marker = new THREE.Group();
  const bubble = mesh(new THREE.SphereGeometry(0.4, 14, 10), unlit(0xffffff));
  bubble.scale.set(1, 1.15, 0.35);
  marker.add(bubble);
  marker.add(mesh(new THREE.BoxGeometry(0.1, 0.3, 0.06), unlit(0xef5b4a), 0, 0.09, 0.2));
  marker.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), unlit(0xef5b4a), 0, -0.14, 0.2));
  const tail = mesh(new THREE.ConeGeometry(0.12, 0.22, 4), unlit(0xffffff), 0, -0.48, 0);
  tail.rotation.x = Math.PI;
  marker.add(tail);
  return marker;
}

export class Game {
  constructor(scene, boat, hud, sound) {
    this.scene = scene;
    this.boat = boat;
    this.hud = hud;
    this.sound = sound;
    this.islands = [];
    this.characters = [];
    this.aboard = [];
    this.delivered = 0;
    this.totalPassengers = 0;
    this.homeIsland = null;
    this.finished = false;
    this.build();
  }

  build() {
    const rng = makeRng(20240801);
    ISLAND_LAYOUT.forEach((config, index) => {
      const island = createIsland({ ...config, seed: 1000 + index * 37 });
      island.userData.name = config.name;
      this.scene.add(island);
      this.islands.push(island);
      if (config.home) this.homeIsland = island;

      for (const resident of config.residents ?? []) {
        const character = placeCharacter(island, resident, resident.angle ?? rng() * Math.PI * 2, 0.6);
        this.characters.push(character);
      }

      if (config.passenger) {
        const angle = island.userData.dockAngle;
        const character = placeCharacter(island, config.passenger, angle, 0.82);
        const marker = createMarker();
        marker.position.y = character.userData.height + 0.85;
        character.add(marker);
        character.userData.marker = marker;
        character.userData.islandName = config.name;
        this.characters.push(character);
        island.userData.passenger = character;
        this.totalPassengers += 1;
      }
    });

    this.updateHud();
  }

  updateHud() {
    this.hud.setCounts(this.aboard.length, this.delivered, this.totalPassengers);
    if (this.finished) {
      this.hud.setObjective('Todos chegaram para a festa! 🎉');
    } else if (this.aboard.length > 0) {
      this.hud.setObjective(`Leve seus amigos até a ${HOME_NAME} (marcada de rosa no mapa).`);
    } else {
      const waiting = this.islands.filter((i) => i.userData.passenger && !i.userData.passenger.userData.boarded);
      const nearest = this.nearestIsland(waiting);
      this.hud.setObjective(
        nearest
          ? `Navegue até a ${nearest.userData.name} e encoste devagar para pegar um amigo.`
          : 'Volte para casa!'
      );
    }
  }

  nearestIsland(list) {
    let best = null;
    let bestDistance = Infinity;
    for (const island of list) {
      const distance = island.position.distanceTo(this.boat.position);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = island;
      }
    }
    return best;
  }

  /** Embarque: chegar perto e reduzir a velocidade já basta. */
  tryDock(island) {
    const distance = island.position.distanceTo(this.boat.position);
    const dockRange = island.userData.radius + 7;
    return distance < dockRange && Math.abs(this.boat.speed) < 3.2;
  }

  seatPassenger(character) {
    const seat = this.boat.seats[this.aboard.length % this.boat.seats.length];
    character.parent?.remove(character);
    this.boat.hullPivot.add(character);
    character.position.copy(seat);
    character.rotation.y = seat.x > 0 ? -0.6 : 0.6;
    character.userData.boarded = true;
    character.userData.wantsToWave = false;
    if (character.userData.marker) {
      character.remove(character.userData.marker);
      character.userData.marker = null;
    }
  }

  dropPassengers() {
    const island = this.homeIsland;
    const { radius, surfaceHeight } = island.userData;
    const baseAngle = island.userData.dockAngle;
    this.aboard.forEach((character, index) => {
      const angle = baseAngle + (index - (this.aboard.length - 1) / 2) * 0.4;
      const distance = radius * (0.62 + (index % 2) * 0.16);
      character.parent?.remove(character);
      island.add(character);
      character.position.set(
        Math.sin(angle) * distance,
        surfaceHeight(Math.sin(angle) * distance, Math.cos(angle) * distance) - 0.05,
        Math.cos(angle) * distance
      );
      character.rotation.y = angle;
      character.userData.boarded = false;
      // Chegou na festa: fica acenando junto da casa.
      character.userData.wantsToWave = true;
    });
    this.delivered += this.aboard.length;
    this.aboard = [];
  }

  update(dt, time, camera) {
    for (const character of this.characters) {
      updateCharacter(character, time, dt);
      const marker = character.userData.marker;
      if (marker) {
        character.getWorldPosition(WORLD_POSITION);
        marker.position.y = character.userData.height + 0.85 + Math.sin(time * 3) * 0.12;
        // O balão sempre encara a câmera.
        marker.rotation.y =
          Math.atan2(
            camera.position.x - WORLD_POSITION.x,
            camera.position.z - WORLD_POSITION.z
          ) - character.rotation.y;
      }
    }

    for (const island of this.islands) {
      if (island.userData.swing) updateSwing(island.userData.swing, time);
    }

    if (this.finished) return;

    for (const island of this.islands) {
      const data = island.userData;
      const distance = island.position.distanceTo(this.boat.position);
      const near = distance < data.radius + 14;

      // Quem está esperando acena quando o barco se aproxima.
      if (data.passenger && !data.passenger.userData.boarded) {
        data.passenger.userData.wantsToWave = near;
      }

      if (!this.tryDock(island)) continue;

      if (data.passenger && !data.passenger.userData.boarded) {
        const passenger = data.passenger;
        this.seatPassenger(passenger);
        this.aboard.push(passenger);
        this.sound.board();
        this.boat.ringBell();
        this.hud.toast(`${passenger.userData.name} embarcou! 🎈`);
        this.updateHud();
      }

      if (island === this.homeIsland && this.aboard.length > 0) {
        const count = this.aboard.length;
        this.dropPassengers();
        this.sound.deliver();
        this.hud.toast(
          count === 1 ? 'Um amigo chegou para a festa! 🥳' : `${count} amigos chegaram para a festa! 🥳`
        );
        this.updateHud();
        if (this.delivered >= this.totalPassengers) {
          this.finished = true;
          this.sound.victory();
          this.hud.showVictory(this.delivered);
          this.updateHud();
        }
      }
    }
  }
}

export { HOME_NAME };
