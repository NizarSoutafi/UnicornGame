class Vehicle {
  static debug = false;

  constructor(x, y,image, isLeader=false) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.6;
    this.r = 100;
    this.isLeader=isLeader; //Indique si le véhicule est un leader
    this.rayonZoneDeFreinage = 100;
    //pour evitement d'obstacle
    this.distanceAhead = 50;

    // Pour le confinement
    this.boundariesX = 0;
    this.boundariesY = 0
    this.boundariesWidth = width;
    this.boundariesHeight = height;
    this.boundariesDistance = 25;

    this.boundariesWeight = 10;

    // si le vehicule est une image
    if (image !== undefined) {
      this.image = image;

      // largeur image
      const li = this.image.width;
      // hauteur image
      const hi = this.image.height;
      // on remet les valeurs à l'échelle par rapport au rayon
      // du véhicule
      const ratio = li / hi;
      // la largeur de l'image sera égale à r
      this.imageL = this.r;
      // la hauteur de l'image sera égale à r/ratio
      this.imageH = this.r / ratio;
    }
  }

  applyBehaviors(target, obstacles) {

    let seekForce = this.arrive(target);
    let avoidForce = this.avoid(obstacles, false);
    let separateForce = this.separate(vehicles);
    let boundaries=this.boundaries(this.boundariesX, this.boundariesY, this.boundariesWidth, this.boundariesHeight, this.boundariesDistance);
    
    seekForce.mult(0.7);
    avoidForce.mult(2);
    separateForce.mult(5);
    boundaries.mult(this.boundariesWeight);

    this.applyForce(seekForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
    this.applyForce(boundaries);
  }

  isColliding(obstacle) {
    // Vérifier si le missile entre en collision avec un obstacle
    let distance = this.pos.dist(obstacle.pos);
    return distance < (this.r / 2 + obstacle.r / 2);
  }

  arrive(target, d = 0) {
    // 2nd argument true enables the arrival behavior
    // 3rd argumlent d is the distance behind the target
    // for "snake" behavior
    return this.seek(target, true, d);
  }


  avoid(obstacles, considereVehiculesCommeObstacles = false) {

    let distance = Infinity;
    let distance2 = Infinity;
    let distance3 = Infinity;

    // On calcule un point devant le véhicule courant
    // on l'appelle ahead
    let ahead = this.vel.copy();
    ahead.mult(this.distanceAhead);
    // On calcule ahead2 à mi-distance
    let ahead2 = this.vel.copy();
    ahead2.mult(this.distanceAhead / 2);

    if (Vehicle.debug) {
      // on dessine le vecteur vitesse en jaune
      this.drawVector(this.pos, ahead, "yellow");
      this.drawVector(this.pos, ahead2, "lightblue");
    }
    // Pour le dessiner, il faut lui ajouter la position du véhicule
    ahead.add(this.pos);
    ahead2.add(this.pos);

    if (Vehicle.debug) {
      // on le dessine en rouge
      fill("red");
      circle(ahead.x, ahead.y, 10);
      fill("green");
      circle(ahead2.x, ahead2.y, 10);
    }
    // On cherche l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // on considère aussi les autres véhicules comme des obstacles potentiels
    let vehiculeLePlusProche, distance4 = 100000000;

    if (considereVehiculesCommeObstacles) {
      vehiculeLePlusProche = this.getVehiculeLePlusProche(vehicules);
      // on considère aussi le véhicule le plus proche
      if (vehiculeLePlusProche !== undefined) {
        distance4 = this.pos.dist(vehiculeLePlusProche.pos)
      }
    }

    // On calcule la distance entre la position de l'obstacle le plus proche
    // et le point ahead
    if(obstacleLePlusProche){
    distance = ahead.dist(obstacleLePlusProche.pos);
    
    let distance2 = ahead2.dist(obstacleLePlusProche.pos);
    // on prend aussi le vaisseau lui-même
    let distance3 = this.pos.dist(obstacleLePlusProche.pos)


    // distance = la plus petite des deux
    distance = min(distance, distance2);
    distance = min(distance, distance3);
    distance = min(distance, distance4);
    }

    if (distance === distance4) {
      obstacleLePlusProche = vehiculeLePlusProche;
    }


    // si distance < rayon de l'obstacle + rayon du véhicule
    // Alors il y a collision possible, on calcule la force d'évitement
    if (obstacleLePlusProche && distance < obstacleLePlusProche.r + this.r / 2) {
      // collision possible, on calcule le vecteur qui va 
      // du centre de l'obstacle jusqu'au point ahead, il représente
      // la direction dans laquelle on doit aller pour éviter l'obstacle
      let desiredSpeed;

      if (distance === distance2) {
        // c'est le point ahead2 le plus proche
        // c'est le point au bout, ahead, le plus proche
        desiredSpeed = p5.Vector.sub(ahead2, obstacleLePlusProche.pos);
      } else if (distance === distance3) {
        // c'est le vaisseau le plus proche
        desiredSpeed = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
      } else if (distance === distance4) {
        // l'obstacle le plus proche est un véhicule
        desiredSpeed = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
      } else {
        // c'est le point au bout, ahead, le plus proche
        desiredSpeed = p5.Vector.sub(ahead, obstacleLePlusProche.pos);
      }

      if (Vehicle.debug) {
        this.drawVector(obstacleLePlusProche.pos, desiredSpeed, "pink");
      }

      // on calcule la force
      // 1 - on la met au maximum
      desiredSpeed.setMag(this.maxSpeed);
      // 2 - formule magique : force = vitesse desiree - vitesse actuelle
      let force = p5.Vector.sub(desiredSpeed, this.vel);

      // on la limite
      force.limit(this.maxForce);

      // et on la renvoie
      return force;
    }

    return createVector(0, 0);

  }

  // Comportement Separation : on garde ses distances par rapport aux voisins
  separate(vaisseaux) {
    let desiredseparation = this.distanceSeparation;
    let steer = createVector(0, 0, 0);
    let count = 0;
    // On examine les autres vaisseaux pour voir s'ils sont trop près
    for (let i = 0; i < vaisseaux.length; i++) {
      let other = vaisseaux[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      // Si la distance est supérieure à 0 et inférieure à une valeur arbitraire (0 quand on est soi-même)
      if (d > 0 && d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // poids en fonction de la distance. Plus le voisin est proche, plus le poids est grand
        steer.add(diff);
        count++; // On compte le nombre de voisins
      }
    }
    // On moyenne le vecteur steer en fonction du nombre de voisins
    if (count > 0) {
      steer.div(count);
    }

    // si la force de répulsion est supérieure à 0
    if (steer.mag() > 0) {
      // On implemente : Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      // Je calcule la distance entre le vaisseau et l'obstacle
      const distance = this.pos.dist(o.pos);

      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;
  }

  getVehiculeLePlusProche(obstacles) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche;

    obstacles.forEach(v => {
      if (v != this) {
        // Je calcule la distance entre le vaisseau et le vehicule
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    });

    return vehiculeLePlusProche;
  }


  getClosestObstacle(pos, obstacles) {
    // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
    let closestObstacle = null;
    let closestDistance = 1000000000;
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (closestObstacle == null || distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    return closestObstacle;
  }


  seek(target, arrival, d = 0) {
    let desiredSpeed = p5.Vector.sub(target, this.pos);
    let desiredSpeedMagnitude = this.maxSpeed;

    if (arrival) {
      // on dessine un cercle de rayon 100 
      // centré sur le point d'arrivée

      if (Vehicle.debug) {
        noFill();
        stroke("white")
        circle(target.x, target.y, this.rayonZoneDeFreinage)
      }
      
      // on calcule la distance du véhicule
      // par rapport au centre du cercle
      const dist = p5.Vector.dist(this.pos, target);

      if (dist < this.rayonZoneDeFreinage) {
        // on va diminuer de manière proportionnelle à
        // la distance, la vitesse on va utiliser la fonction map(...) de P5
        // qui permet de modifier une valeur dans un 
        // intervalle initial, vers la même valeur dans un autre intervalle
        // newVal = map(value, start1, stop1, start2, stop2, [withinBounds])
        desiredSpeedMagnitude = map(dist, d, this.rayonZoneDeFreinage, 0, this.maxSpeed)
      }
    }

    // equation force = vitesseDesiree - vitesseActuelle
    desiredSpeed.setMag(desiredSpeedMagnitude);
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    // et on limite la force
    force.limit(this.maxForce);
    return force;
  }
  seekTarget(target) {
    // on calcule la direction vers la cible
    // C'est l'ETAPE 1 (action : se diriger vers une cible)
    let desiredSpeed = p5.Vector.sub(target, this.pos);

    // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
    // on limite ce vecteur à la longueur maxSpeed
    desiredSpeed.setMag(this.maxSpeed);

    // on calcule maintenant force = desiredSpeed - currentSpeed
    let force = p5.Vector.sub(desiredSpeed, this.vel);

    // et on limite cette force à maxForce
    force.limit(this.maxForce);
    this.applyForce(force);  
  }
  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;

    const xBordGauche = bx + d;
    const xBordDroite = bx + bw - d;
    const yBordHaut = by + d;
    const yBordBas = by + bh - d;

    // si le vaisseau est trop à gauche ou trop à droite
    if (this.pos.x < xBordGauche) {
      // 
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > xBordDroite) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < yBordHaut) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > yBordBas) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }

    if (vitesseDesiree !== null) {
      vitesseDesiree.setMag(this.maxSpeed);
      const force = p5.Vector.sub(vitesseDesiree, this.vel);
      vitesseDesiree.limit(this.maxForce);
      return vitesseDesiree;
    }

    if (Vehicle.debug) {
      // dessin du cadre de la zone
      push();

      noFill();
      stroke("white");
      rect(bx, by, bw, bh);

      // et du rectangle intérieur avec une bordure rouge de d pixels
      stroke("red");
      rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);

      pop();
    }

    // si on est pas près du bord (vitesse désirée nulle), on renvoie un vecteur nul
    return createVector(0, 0);
  }

  

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  show() {
    if (this.image !== undefined) {
      imageMode(CENTER);
      // On regarde la direction dans laquelle le vaisseau va :
      push();
      translate(this.pos.x, this.pos.y);
      if(this.image==missileImage){
      scale(1, -1);}
      else{scale(-1, -1);}
      
      if (Math.abs(this.vel.x) > Math.abs(this.vel.y)) {
        if (this.vel.x > 0) {
          // "L'objet va vers la droite.";
          rotate(PI);
        } else {
          // "L'objet va vers la gauche.";
          rotate(0);
        }
      } else {
        if (this.vel.y > 0) {
          rotate(-PI / 2)
          // "L'objet va vers le haut." 
        } else {
          rotate(PI / 2)
          // : "L'objet va vers le bas."
        }
      }
      image(this.image, 0, 0, this.r, this.r);

      pop();

      return;
    } else {
      strokeWeight(this.r);
      stroke(255);
      point(this.pos.x, this.pos.y);
    }
  }

  drawVector(pos, v, color) {
    push();
    // Dessin du vecteur vitesse
    // Il part du centre du véhicule et va dans la direction du vecteur vitesse
    strokeWeight(3);
    stroke(color);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    // dessine une petite fleche au bout du vecteur vitesse
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

