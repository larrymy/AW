function BatimentTile(url){
	this.image = new Image();
	this.image.refTileset = this;

	this.image.onload = function(){
		if(!this.complete)
			throw new Error("erreur de chargement du tileset" + url);


		this.refTileset.largeur = this.width / 32;
		this.refTileset.long = this.height ;
		console.log("longueur : "+ this.refTileset.long);
		console.log("largeur : "+ this.refTileset.largeur);





	}
	this.image.src= url;
}
	BatimentTile.prototype.dessinerTilebat = function(numero,context,xdest,ydest) {
		var xsourcetiles = numero % this.largeur;
		if(xsourcetiles==0) xsourcetiles = this.largeur;
		var ysourcetiles= Math.ceil(numero / this.long);
		var xsource = (xsourcetiles-1)*32;
		var ysource = (ysourcetiles-1)*48;
		context.drawImage(this.image,xsource,ysource,32,48,xdest,ydest,32,48);
}
