function Tileset(url){
	this.image = new Image();
	this.image.refTileset = this;

	this.image.onload = function(){
		if(!this.complete)
			throw new Error("erreur de chargement du tileset" + url);


		this.refTileset.largeur= this.width / 32;


	}
	this.image.src= url;
}
	Tileset.prototype.dessinerTile = function(numero,context,xdest,ydest) {
		var xsourcetiles = numero % this.largeur;
		if(xsourcetiles==0) xsourcetiles =this.largeur;
		var ysourcetiles= Math.ceil(numero / this.largeur);
		var xsource = (xsourcetiles-1)*32;
		var ysource = (ysourcetiles -1)*32;
		context.drawImage(this.image,xsource,ysource,32,32,xdest,ydest,32,32);
}
