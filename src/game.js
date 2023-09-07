import { ConfigsSingleton } from "./configs.js";
import { Player } from "./player.js";
import { Scene } from "./scene.js";
import { toRadians } from "./utils.js";

class Game {
  /** @type {HTMLCanvasElement} */
  canvas;
  /** @type {CanvasRenderingContext2D} */
  ctx;
  /** @type {Player} */
  player;
  /** @type {Scene} */
  scene;

  configs = ConfigsSingleton.getInstance();
  
  TICK = 30;

  /**
   * @param {{
   *    player: Player,
   *    scene: Scene 
   * }} game
   */
  constructor({
    player,
    scene
  }) {
    this.player = player;
    this.scene = scene;
  }

  run() {
    setInterval(() => {
      const playerNextXPosition = this.player.calculateXPosition();
      const playerNextYPosition = this.player.calculateYPosition();

      const playerNextXPositionOnMap = Math.floor(playerNextXPosition / this.configs.cellSize);
      const playerNextYPositionOnMap = Math.floor(playerNextYPosition / this.configs.cellSize);

      if (!this.scene.isOutOfMapBounds(playerNextXPositionOnMap, playerNextYPositionOnMap)) {
        if (this.scene.map[playerNextYPositionOnMap][playerNextXPositionOnMap] === 0) {
          this.player.x = playerNextXPosition;
          this.player.y = playerNextYPosition;
        } 
      }

      this.scene.render();
    }, this.TICK);
  };
}

export function createGame() {
  const canvas = document.getElementById("screen");

  const configs = ConfigsSingleton.getInstance();

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });

  canvas.setAttribute("width", configs.screenWidth);
  canvas.setAttribute("height", configs.screenHeight);

  const player = new Player({ 
    x: (2 * configs.cellSize) * 0.75, 
    y: (2 * configs.cellSize) * 0.75
  });

  const scene = new Scene({
    player,
    context: canvas.getContext("2d")
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "w") {
      player.moveForward();
    }
    if (e.key === "ArrowDown" || e.key === "s") {
      player.moveBackward();
    }
  });
  
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" 
    || e.key === "ArrowDown"
    || e.key === "w"
    || e.key === "s") {
      player.stop();
    }
  });
  
  document.addEventListener("mousemove", function (event) {
    player.angle += toRadians(event.movementX * .5);
  });

  return new Game({
    player,
    scene,
  });
}