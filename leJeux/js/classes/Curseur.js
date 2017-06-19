function Curseur(url,x,y,ctrl){
	var actions = new Actions();
	this.x= x;
	this.y = y;
	this.image = new Image();
	this.image.refcurseur = this;
	this.image.onload =function(){
		if(!this.complete)
			throw "aurevoir"
	}
	this.image.src = "C:/Users/Brignoli/Desktop/AW/sprites/Misc.png"
}

Curseur.prototype.dessinercurseur = function(ctx,x,y){
	ctx.drawImage(this.image,0,0,32,32,x,y,32,32);


}
/*Fonction select : Verifie la case sur le curseur et lance les fonctions actions en fct du Terrain ou Unité*/
Curseur.prototype.select = function(x,y,terrain){
	if(terrain[y][x]==2)
		actions.usine(xselection,yselection);
	else
		console.log("Rien");
}