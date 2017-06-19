var app = new PLAYGROUND.Application({

  width:1920,
  height:1080,
  scale:1,

  create: function() {
  //
    this.loadImage(
      "sprites/ship",
      "tilesets/Buildings"
    );
  //
  },

  //  render: function() {
  //
  //  this.layer.clear("#9F8C88");
  //   this.layer.fillStyle("#889F98");
  //   this.layer.fillCircle(300, 287, 64);
  //   this.layer.strokeStyle("#9F9888");
  //   this.layer.strokeLine(124, 124, 64, 64);
  //   this.layer.strokeRect(124, 124, 100,100);
  //   this.layer.lineWidth(50);
  //  },

   render: function() {
  //
     this.layer.clear("#9F8C88");
    //  this.layer.drawImage(this.images["sprites/ship"], 880, 400);
     this.layer.drawImage(this.images["tilesets/Buildings"], 64, 64);
    }

  });




/*

.fillCircle(x, y, radius) dessine des ronds

.strokeStyle(color) Colori les traits

.strokeLine(x, y, ex, ey) Ecris une ligne  sur les differentes 'pos'

.strokeRect(x, y, width, height) dessine des rectangles

.lineWidth(width) defini la largeur des traits

this.loadFolders permet d'acceder a n'importes quelles repository

this.loadImage() peut contenir des array, donc des sous-dossiers du dossiers images a definir

.drawImage(image, x, y) dessine l'image en utilisant this.images au coordonnees souhaites

this.loadImage prend en charge png en first mais on peut definir "lol.jpg" par exemple

*/
