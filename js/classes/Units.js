function Units(url,x,y,ctrl){
	this.x= x;
	this.y = y;

	this.image = new Image();
	this.image.refcurseur = this;
	this.image.onload =function(){
		if(!this.complete)
			throw "Erreur de chargement du tileset : Units"
	}
	this.image.src = url
}

Units.prototype.dessinerunit = function(ctx,x,y){
	ctx.drawImage(this.image,0,0,32,32,x,y,32,32);


}