import { ConfigsSingleton } from "./configs.js";
import { Player } from "./player.js";
import { distance } from "./utils.js";

/**
 * @typedef {Object} IRay
 * @property {number} angle
 * @property {number} distance
 * @property {boolean} vertical
 * 
 */

export class Scene {
  configs = ConfigsSingleton.getInstance();

  /** @type {CanvasRenderingContext2D} */
  context = null;

  /** @type {Player} */
  player = null;

  map = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];

  /**
   * 
   * @param {{
   *   player: Player,
   *   context: CanvasRenderingContext2D
   * }} configs 
   */
  constructor({ 
    context,
    player
  }) {
    this.context = context;
    this.player = player;
  }

  #clearScene() {
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.configs.screenWidth, this.configs.screenHeight);
  }

  /**
   * 
   * @param {number} posX 
   * @param {number} posY 
   * @param {number} scale 
   * @param {Array<Object>} rays 
   */
  #renderMinimap(posX = 0, posY = 0, scale, rays) {
    const cellSize = scale * this.configs.cellSize;

    this.context.fillStyle = "blue";
    this.context.fillRect(
      posX + this.player.x * scale - 10 / 2,
      posY + this.player.y * scale - 10 / 2,
      10,
      10
    );

    this.map.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          this.context.fillStyle = 'gray';
          this.context.fillRect(
            posX + x * cellSize,
            posY + y * cellSize,
            cellSize,
            cellSize
          );
        }
      });
    });

    
    this.context.stroke();
  
    this.context.strokeStyle = this.configs.colors.rays;

    rays.forEach(ray => {
      this.context.beginPath();
      this.context.moveTo(this.player.x * scale, this.player.y * scale);
      this.context.lineTo(
        (this.player.x + Math.cos(ray.angle) * ray.distance) * scale,
        (this.player.y + Math.sin(ray.angle) * ray.distance) * scale,
      );

      this.context.closePath();
      this.context.stroke();
    });
  }

  /** 
   * @param {Number} angle 
   * 
   * @returns {IRay}
   */
  #getVerticalCollision(angle) {
    const isRight = Boolean(Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2));
  
    const firstX = isRight ? 
      Math.floor(this.player.x / this.configs.cellSize) * this.configs.cellSize + this.configs.cellSize 
      : Math.floor(this.player.x / this.configs.cellSize) * this.configs.cellSize;
  
    const firstY = this.player.y + (firstX - this.player.x) * Math.tan(angle);
  
    const xA = isRight ? this.configs.cellSize : -this.configs.cellSize;
    const xY = xA * Math.tan(angle);
  
    /** @type {boolean} */
    let isWall = false;

    let nextX = firstX;
    let nextY = firstY;
  
    while(!isWall) {
      const cellX = isRight ? 
        Math.floor(nextX / this.configs.cellSize)
        : Math.floor(nextX / this.configs.cellSize) - 1;
  
      const cellY = Math.floor(nextY / this.configs.cellSize);
  
      if (this.isOutOfMapBounds(cellX, cellY)) {
        break;
      } 
  
      isWall = Boolean(this.map[cellY][cellX]);
      
      if (!isWall) {
        nextX += xA;
        nextY += xY;
      }
  
    }
    
    return {
      angle,
      distance: distance(this.player.x, this.player.y, nextX, nextY),
      vertical: true,
    }
  }

  /**
   * 
   * @param {number} x 
   * @param {number} y
   */
  isOutOfMapBounds(x, y) {
    return x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length;
  }
  
  /** 
   * @param {Number} angle 
   * 
   * @returns {IRay}
   */
  #getHorizontalCollision(angle) {
    const up = Math.abs(Math.floor(angle / Math.PI) % 2);
  
    const firstY = up ? Math.floor(this.player.y / this.configs.cellSize) * this.configs.cellSize : Math.floor(this.player.y / this.configs.cellSize) * this.configs.cellSize + this.configs.cellSize;
  
    const firstX = this.player.x + (firstY - this.player.y) / Math.tan(angle);
  
    const yA = up ? - this.configs.cellSize : this.configs.cellSize;
    const xA = yA / Math.tan(angle);
  
    /** @type {boolean} */
    let isWall = false;
    let nextX = firstX;
    let nextY = firstY;
  
    while(!isWall) {
      const cellX = Math.floor(nextX / this.configs.cellSize);
      const cellY = up ?
        Math.floor(nextY / this.configs.cellSize) - 1
        : Math.floor(nextY / this.configs.cellSize);
  
      if (this.isOutOfMapBounds(cellX, cellY)) {
        break;
      }
  
      isWall = this.map[cellY][cellX];
      if (!isWall) {
        nextX += xA;
        nextY += yA;
      }
    }
  
    return {
      angle,
      distance: distance(this.player.x, this.player.y, nextX, nextY),
      vertical: false,
    }
  }
  
  /** @param {Number} angle */
  #castRay(angle) {
    const verticalCollision = this.#getVerticalCollision(angle);
    const horizontalCollision = this.#getHorizontalCollision(angle);
  
    return horizontalCollision.distance >= verticalCollision.distance ? verticalCollision : horizontalCollision;
  }
  
  #fixFishEye(distance, angle, playerAngle) {
    const diff = angle - playerAngle;
    
    return distance * Math.cos(diff);
  }
  
  #getRays() {
    const initialAngle = this.player.angle - this.configs.fov / 2;
    const numberOfRays = this.configs.screenWidth;
    const angleStep = this.configs.fov / numberOfRays;
  
    return Array.from({length: numberOfRays }, (_, i) => {
      const angle = initialAngle + i * angleStep;
      const ray = this.#castRay(angle);
  
      return ray;
    });
  }

  /** @param {Array<IRay>} rays */
  #renderScene(rays) {
    rays.forEach((ray, idx) => {
      const distance = this.#fixFishEye(ray.distance, ray.angle, this.player.angle);
      const wallHeight = ((this.configs.cellSize * 5) / distance) * 200;
  
      this.context.fillStyle = ray.vertical ? this.configs.colors.wallDark : this.configs.colors.wall;
      this.context.fillRect(idx, this.configs.screenHeight / 2 - wallHeight / 2, 1, wallHeight);
      this.context.fillStyle = this.configs.colors.floor;
      this.context.fillRect(
        idx, 
        this.configs.screenHeight / 2 + wallHeight / 2,
        1,
        this.configs.screenHeight / 2 - wallHeight / 2
      );
  
      this.context.fillStyle = this.configs.colors.ceiling;
      this.context.fillRect(idx, 0, 1, this.configs.screenHeight / 2 - wallHeight / 2);
    });
  }

  render() {
    this.#clearScene();

    const rays = this.#getRays();

    this.#renderScene(rays);
    this.#renderMinimap(0, 0, 0.75, rays);
  }
}