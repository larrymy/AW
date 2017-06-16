function Batiment() {
var data='{"tileset" : "C:/Users/Brignoli/Desktop/AW/tilesets/batimenttest.png" , "terrain" : [[2,2,0,0,0,0,0,2],[2,0,0,0,2,0,0,2],[2,0,0,0,0,0,0,2],[2,0,2,0,0,0,0,2],[2,0,2,2,0,0,0,0],[2,0,0,0,0,0,0,2]]}'


mapData=JSON.parse(data);
addr = mapData.tileset;
this.tileset = new BatimentTile(addr);
this.terrain = new Array();
for(var o = 0; o<mapData.terrain.length;o++){
this.terrain[o] = mapData.terrain[o];
}

}




Batiment.prototype.getHauteur = function() {
  return this.terrain.length;
}
Batiment.prototype.getLargeur = function() {
  return this.terrain[0].length;
}


Batiment.prototype.dessinerBatiment = function(ctx) {
  for(var i = 0, l = this.terrain.length; i < l; i++) {
    var ligne = this.terrain[i];
    var y = (i*32)-16;
    for(var j = 0, k = ligne.length;  j < k; j++){
    	if(y == 0){
    		this.tileset.dessinerTilebat(ligne[j],ctx,j*32,-16);
    	}
    	else
    	this.tileset.dessinerTilebat(ligne[j], ctx, j*32, y);
    }
  }
}

Batiment.prototype.getTerrain = function(){return(this.terrain);}
