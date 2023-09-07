import { toRadians } from "./utils.js";

let instance;

class Configs {
  constructor() {
    this.cellSize = 32;
    
    this.fov = toRadians(60);
    
    this.colors = {
      floor: "#696969",
      ceiling: "#87ceeb",
      wall: "#de5912",
      wallDark: "#c14a09",
      rays: "#ffa600",
    };

    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }
}

export class ConfigsSingleton {
  /**
   * 
   * @returns {Configs}
   */
  static getInstance() {
    if (!instance) {
      instance = new Configs();
    }

    return instance;
  }
}