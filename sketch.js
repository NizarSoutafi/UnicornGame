let target, vehicle;
let vehicles = [];
let targets = [];
let obstacles=[];
let missile;
let missiles=[];
let vImage;
let Imagefond;
let leaderImage;
let missileImage;
let obstacleImage;

// Appelée avant de démarrer l'animation
function preload() {
  // en général on charge des images, des fontes de caractères etc.
  font = loadFont('assets/inconsolata.otf');
  vImage = loadImage('assets/pngegg.png');
  Imagefond = loadImage('assets/sp1.png');
  leaderImage = loadImage('assets/h1.png');
  missileImage = loadImage('assets/laser.png');
  obstacleImage = loadImage('assets/grinch.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  target = createVector(random(width), random(height));

  let rayon = random(30,100);
  const posYSliderDeDepart = 10;
  creerDesVehicules(5, rayon);

  creerUnSlider("Rayon des unicorns/arc", vehicles, 30, 100, 6, 1, 10, posYSliderDeDepart,"r");
  
  //obstacle au milieu de l'ecran
  obstacles.push(new Obstacle(width / 2, height / 2, 100, 'assets/grinch.png'));

}


function creerDesVehicules(nb) {

// Premier véhicule (leader)
vehicles.push(new Vehicle(100, 100, leaderImage, true));
  for (let i = 0; i < nb; i++) {
    let vehicle = new Vehicle(random(width), random(height), vImage);
    // on change le rayon
    vehicle.r = random(30, 100);
    vehicles.push(vehicle);
  }
}

// appelée 60 fois par seconde
function draw() {
  // fond d'écran
  imageMode(CORNER);
  image(Imagefond, 0, 0, width, height);
  
  for (let p of targets) {
    circle(p.x, p.y, 10);
  }

  textSize(16);
  fill("blue");
  let instructions = [
    "Cliquez pour créer un obstacle.",
    "Cliquez sur 'm' pour tirer.",
    "Cliquez sur 'v' pour ajouter des unicorns.",
    "Cliquez sur 'd' pour activer/désactiver le mode débogage."  ];
  instructions.forEach((text1, index) => {
    text(text1, 1000, 20 * (instructions.length - index));
  });

  // Cible qui suit la souris, cercle rouge de rayon 32
  target.x = mouseX;
  target.y = mouseY;

  // dessin des obstacles
  obstacles.forEach(o => {
    o.show();
  })

vehicles.forEach((vehicle, index) => {
      if(index === 0) {
        // on a le premier véhicule
        // il suit la cible controlée par la souris
        steeringForce = vehicle.arrive(target);
      } else {
        let vehiculePrecedent = vehicles[index - 1];
        steeringForce = vehicle.arrive(vehiculePrecedent.pos,60);
      }
  
  vehicle.applyForce(steeringForce);
  vehicle.applyBehaviors(target, obstacles, vehicles);

  // On met à jour la position et on dessine le véhicule
  vehicle.update();
  vehicle.show();
});

missiles = missiles.filter((missile, missileIndex) => {
  let isAlive = true; // Statut du missile (détruit ou non)

  obstacles.forEach((obstacle, obstacleIndex) => {
    // Vérifier si le missile est en collision avec un obstacle
    if (missile.isColliding(obstacle)) {
      // Supprimer l'obstacle et marquer le missile comme détruit
      obstacles.splice(obstacleIndex, 1); // Supprime l'obstacle
      isAlive = false; // Marque le missile comme détruit
    }
  });

  if (isAlive) {
    // Mise à jour et affichage du missile
    if (obstacles.length > 0) {
      let targetObstacle = obstacles[0];
      missile.seekTarget(targetObstacle.pos);
    }
    missile.update();
    missile.show();
  }

  return isAlive; // Garder le missile seulement s'il est encore vivant
});

}
function creerUnSlider(label, tabVehicules, min, max, val, step, posX, posY, propriete) {
  let slider = createSlider(min, max, val, step);
  
  let labelP = createP(label);
  labelP.position(posX, posY);
  labelP.style('color', 'white');

  slider.position(posX + 150, posY + 17);

  let valueSpan = createSpan(slider.value());
  valueSpan.position(posX + 300, posY+17);
  valueSpan.style('color', 'white');
  valueSpan.html(slider.value());

  slider.input(() => {
    valueSpan.html(slider.value());
    tabVehicules.forEach(vehicle => {
      vehicle[propriete] = slider.value();
    });
  });

  return slider;
}

function mousePressed() {
  //créer un nouvel obstacle au clique de souris
  obstacles.push(new Obstacle(mouseX, mouseY, random(50, 100), 'assets/grinch.png'));
}

function keyPressed() {
  if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  }
  else if (key == "v") {
    let vehicle = new Vehicle(random(width), random(height), vImage);
    // on change le rayon
    vehicle.r = random(30, 100);
    vehicles.push(vehicle);
  }
  else if(key=="m") {
    // Tire un missile à partir de la position du leader, si il y a un obstacle
    if(obstacles.length>0){
    let missile = new Vehicle(vehicles[0].pos.x, vehicles[0].pos.y, missileImage);
    // on change la vitesse du missile
    missile.maxSpeed = 16;
    missiles.push(missile);
  }
  }
}