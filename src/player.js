export class Player {
  x = 0;
  y = 0;
  speed = 0;
  angle = 0;
  
  /**
   * 
   * @param {{
   *   x: number,
   *   y: number,
   *   angle: number,
   *   speed: number
   * }} player 
   */
  constructor({x, y}) {
    this.x = x;
    this.y = y;
  }

  calculateXPosition() {
    return this.x + (this.speed * Math.cos(this.angle));
  }

  calculateYPosition() {
    return this.y + (this.speed * Math.sin(this.angle));
  }

  moveForward() {
    this.speed = 2;
  }

  moveBackward() {
    this.speed = -2;
  }

  stop() {
    this.speed = 0;
  }
}