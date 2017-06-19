var map = new Mapi();
var curs = new Curseur("C:/Users/Brignoli/Desktop/AW/sprites/Misc.png",0,0);
var unit = new Units("C:/Users/Brignoli/Desktop/AW/sprites/Tanktest.png");
var actions = new Actions();
var batiment= new Batiment();
var x=0;
var y = 0;
var xselection=0;
var yselection=0;
var argent=0;
var terrain=batiment.getTerrain();
window.onload = function(){
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    canvas.height = map.getHauteur() * 32;
    canvas.width = map.getLargeur() * 32;
    console.log(map.getHauteur());

window.onkeydown = function(event) {
	 var keyCode = (window.Event) ? event.which : event.keyCode;
switch(keyCode){
	case 38:
	if(y!=0)y--;
	break;
	case 40:
	if(y<(map.getHauteur()-1))y++;
	break;
	case 37:
	if(x!=0)x--;
	break;
	case 39:
	if(x < (map.getLargeur()-1))x++;
	break;
	case 65:
	curs.select(x,y,terrain);
	xselection = x;
	yselection = y;
	break;
	case 80:
	argent+=100;
	break;
}
}

setInterval(function(){
    map.dessinerMap(ctx);
    batiment.dessinerBatiment(ctx);
    curs.dessinercurseur(ctx,x*32,y*32);
	document.getElementById('argent').innerHTML = "Argent :"+ argent;},120);

  }
