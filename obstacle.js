class Obstacle {
  constructor(x, y, r, image) {
    this.pos = createVector(x, y);
    this.r = r;
    this.image = loadImage(image);
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y); // Déplace le point d'origine à la position de l'obstacle
    //rotate(HALF_PI); // Tourne de 90 degrés (HALF_PI en radians)
    imageMode(CENTER); // Image centrée sur les coordonnées de l'obstacle
    image(this.image, 0, 0, this.r * 2, this.r * 2); // Affiche l'image
    pop();
  }
}
