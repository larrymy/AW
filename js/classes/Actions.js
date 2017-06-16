function Actions(){

	var rienderien=0;}

/*
Affiche Menu usine et decremente l'argent a l'achat d'un Tank ou autre unit 
!!!! Creer un exit selection afin de revenir au case de deplacement du curseur sinon le curs reste bloqué sur la case !!!!
*/
Actions.prototype.usine=function(c,d){
	console.log("usine");
	console.log(c,d);
	document.getElementById('Menubat').innerHTML = "<a href='#' onclick='actions.AchatTank();'> 1) Tank = 1000</a>";

}

Actions.prototype.AchatTank = function(){
	console.log(xselection,yselection);
	var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    unite=new Units("C:/Users/Brignoli/Desktop/AW/sprites/Tanktest.png");
	argent = argent -1000;
	setInterval(function(){
    unite.dessinerunit(ctx,xselection*32,yselection*32);},1);
}
/*
conditions argent==0 : impossibilité d'acheter 
fonction achat : decrementation du prix a la var argent
recuperation des coordonnées de l'usine et affichage du tank
*/