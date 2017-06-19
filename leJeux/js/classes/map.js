function Mapi() {
var data='{"tileset" : "C:/Users/Brignoli/Desktop/AW/tilesets/Tileset.png" , "terrain" : [[9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9],[9,9,9,9,9,8,9,9],[9,9,9,9,9,9,9,9],[9,9,9,9,9,9,8,9],[9,9,9,9,9,8,9,9]]}'


mapData=JSON.parse(data);
addr = mapData.tileset;
this.tileset = new Tileset(addr);
this.terrain = new Array();
for(var o = 0; o<mapData.terrain.length;o++){
this.terrain[o] = mapData.terrain[o];
}

}




Mapi.prototype.getHauteur = function() {
  return this.terrain.length;
}
Mapi.prototype.getLargeur = function() {
  return this.terrain[0].length;
}

/*Dessine en parcourant la Matrice*/
Mapi.prototype.dessinerMap = function(ctx) {
  for(var i = 0, l = this.terrain.length; i < l; i++) {
    var ligne = this.terrain[i];
    var y = i * 32;
    for(var j = 0, k = ligne.length;  j < k; j++) {
      this.tileset.dessinerTile(ligne[j], ctx, j * 32, y);
    }
  }
}
