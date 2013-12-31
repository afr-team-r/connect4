/** CONNECT 4 CLIENTE **/

function Area(x,y,w,h){
   this.x = x;
   this.y = y;
   this.w = w;
   this.h = h; 
}

/** Propriedades **/

var n = 4;

var codes = {
NAO_CONECTADO : "Nao conectado - ",
CONECTADO : "Conectado - Escolha sua cor e confirme",
COR_ERRO : "Ops! Seu oponente ja escolheu essa cor! Escolha outra!",
AGUARDANDO : "Certo - Aguarde seu oponente!",
VEZ : "Sua vez",
ESPERE : "Vez do seu adversario",
VENCEU : "Voce ganhou!!",
PERDEU : "Voce perdeu!",
MAIS_UM_ESPERA : "Aguarde seu adversario clicar em Mais Um..."
};


$(document).ready(function() {

	var canvas2d = document.getElementById("canvas2d");
	var socket;
	var cor = null;

	var Jogo = { 

		/** Inicia o propriedades **/
		construtor : function() {

			this.context = canvas2d.getContext("2d");

			this.width = canvas2d.width;
			this.height = canvas2d.height;

			this.widthDivision = this.width/7;
			this.heightDivision = this.height/6;
		},

		/** Desenha o tabuleiro **/
		desenhaTabuleiro : function() {

			this.context.fillStyle="white";
			this.context.fillRect(0,0, this.width, this.height);
			
			this.context.fillStyle="red";
			this.context.lineWidth=3;
			this.context.strokeRect(0,0, this.width, this.height);
	
			for(i = 0; i <= 7; i++) {
			  this.context.beginPath();
			  this.context.moveTo(this.widthDivision*i, 0);
			  this.context.lineTo(this.widthDivision*i, this.height);
			  this.context.stroke();	
			}

			for(i = 0; i <= 6; i++) {
			  this.context.beginPath();
			  this.context.moveTo(0, this.heightDivision*i);
			  this.context.lineTo(this.width, this.heightDivision*i);
			  this.context.stroke();	
			}
		},

		fechaConexaoWS : function() {
			socket.close();
		},

		criaConexaoWS : function() {
	
			var self = this;

			socket = new WebSocket($("#host").val(), "echo-protocol");
			
			socket.addEventListener("open", function(event) {

			      $("#status").css("color", "blue");
			      $("#status").html(codes.CONECTADO);

			      $("#disconnectbutton").attr("disabled", false);
			      $("#confirmcolor").attr("disabled", false);
			      $("#host").attr("disabled", true);
			      $("#connectbutton").attr("disabled", true);
			 });

			socket.addEventListener("message", function(event) {

				var messagejson = JSON.parse(event.data);

				if(messagejson.status != undefined) {

					switch(messagejson.status) {
						case 'c':
							$("#confirmcolor").attr("disabled", false);
							$("#colorblue").attr("disabled", false);
				 			$("#colorred").attr("disabled", false);
 							$("#status").css("color", "red");
							$("#status").html(codes.COR_ERRO);
						break; 

						case 't':
							$("#status").css("color", "green");
							$("#status").html(codes.VEZ);
						break;

						case 'w':
							$("#status").css("color", "orange");
							$("#status").html(codes.ESPERE);
						break;
						
						case 'p':
							self.desenhaPeca((messagejson.j+0.5)*self.widthDivision, (messagejson.i+0.5)*self.heightDivision, messagejson.cor);
						break;

						case 'g':
							$("#status").css("color", "green");
							$("#status").html(codes.VENCEU);
							$("#cleanbutton").attr("disabled", false);
						break;

						case 'l':
							$("#status").css("color", "red");
							$("#status").html(codes.PERDEU);
							$("#cleanbutton").attr("disabled", false);
						break;
					}
				}		

			});

			socket.addEventListener("error", function(err) {
				 $("#status").css("color", "red");
				 $("#status").html(codes.NAO_CONECTADO + err.code + ": " + err.reason);	

				$("#cleanbutton").attr("disabled", true);
				$("#disconnectbutton").attr("disabled", true);
				$("#confirmcolor").attr("disabled", true);
				$("#host").attr("disabled", false);
			    $("#connectbutton").attr("disabled", false);
			});

			socket.addEventListener("close", function(err) {
				 $("#status").css("color", "red");
				 $("#status").html(codes.NAO_CONECTADO + err.code + ": " + err.reason);	

				$("#cleanbutton").attr("disabled", true);
				$("#disconnectbutton").attr("disabled", true);
				$("#confirmcolor").attr("disabled", true);
				$("#host").attr("disabled", false);
			    $("#connectbutton").attr("disabled", false);
			});		
		},

		/** Adiciona os eventos do jogo **/
		adicionaEventosJogo : function() {

			var self = this;

			canvas2d.onclick = function(evt){

				var rectNav = canvas2d.getBoundingClientRect();
				var pos = {
					x: evt.clientX - rectNav.left,
					y: evt.clientY - rectNav.top
				 };

				for(i=0; i <= 7; i++) {
					var bt = new Area(self.widthDivision*i,0,self.widthDivision,self.heightDivision);			

					if(pos.x > bt.x && pos.x < (bt.x+bt.w) && pos.y > bt.y && pos.y < (bt.y+bt.h)) {
						socket.send("{\"j\":\"" + i + "\"}");
					} 
				}
			}
		},	

		adicionaEventosHTML : function() {

			var self = this;

			$("#host").val("ws://localhost:5000");

			$("#cleanbutton").attr("disabled", true);
			$("#disconnectbutton").attr("disabled", true);
			$("#confirmcolor").attr("disabled", true);
			

			$("#cleanbutton").click(function(e) {
			
				// R to a new game
				socket.send("{\"r\":\"r\"}");
				
				self.desenhaTabuleiro();
				$("#status").css("color", "orange");
				$("#status").html(codes.MAIS_UM_ESPERA);

				$("#cleanbutton").attr("disabled", true);
			});

			$("#connectbutton").click(function(e) {
				self.criaConexaoWS();	    
			});

			$("#disconnectbutton").click(function(e) {
				self.fechaConexaoWS();	    
			});	

			$("#confirmcolor").click(function(e) {

				var cores = document.getElementsByName("cores");

				for (var k = 0; k < cores.length; k++) {
					if (cores[k].checked) {
				  	 cor = cores[k].value;
				   	  break;
					}
				}

				sendColor = {color: cor};
				socket.send(JSON.stringify(sendColor));

			    $("#status").css("color", "green");
			    $("#status").html(codes.AGUARDANDO);
     			$("#confirmcolor").attr("disabled", true);
				$("#colorblue").attr("disabled", true);
				$("#colorred").attr("disabled", true);	

				var cores = document.getElementsByName("cores");

				for (var k = 0; k < cores.length; k++) {
					if (cores[k].checked) {
				  	 cor = cores[k].value;
				   	  break;
					}
				}

			});	
		},

		/**  Desenha efetivamente a peca na tela **/
		desenhaPeca : function(x, y, cor) {
		 	this.context.beginPath();
			this.context.fillStyle=cor;
			this.context.lineWidth=1;
			this.context.arc(x, y, 40, 0, 2 * Math.PI, false);
			this.context.fill();
		}
	};
	

	/** LE'DA ROCK BEGIN **/
	
	Jogo.construtor();
	Jogo.desenhaTabuleiro();
	Jogo.adicionaEventosHTML();
	Jogo.adicionaEventosJogo();

});
