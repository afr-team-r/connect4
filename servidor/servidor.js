var ws = require("websocket").server;
var http = require("http");

/** Configuracoes **/

var porta = 5000;

/** Acessos HTTP:5000 retornarao 404 **/

var server = http.createServer(function(request,response) {
	response.writeHead(404);
	response.end();

}).listen(porta, function() {
	console.log("HTTP na porta 5000 retornando 404 ......... OK");
});

/** O tratamento do socket **/

var socketServer = new ws({httpServer: server,autoAcceptConnections: false});

console.log("WebSocket na porta 5000 esperando conexoes ......... OK");


/** Status do jogo **/

// Conexoes
var jogadores = [];

// Codigos enviados
var codes = {
COLOR_CHOOSE : "{\"status\":\"c\"}",
TURN : "{\"status\":\"t\"}",
WAIT : "{\"status\":\"w\"}",
COORD : "{\"status\":\"p\", \"i\":$i$, \"j\":$j$, \"cor\":\"$cor$\"}",
WIN : "{\"status\":\"g\"}",
LOSE : "{\"status\":\"l\"}"
};


// Auxiliares
var cores = [null, null];
var vez = 0;
var jogando = 0;

var qtde_restart = 0;

var n = 4;
var index = -1;
var pontos = [1, -1];

/** Logica do jogo **/

var Jogo = { 
		/** Inicia o Tabuleiro **/
		iniciaTabuleiro : function() {

			this.tabuleiro = new Array([],[],[],[],[],[]);

			for(i=0; i<6; i++)
			   for(j=0;j<7;j++)
				  this.tabuleiro[i][j] = 0;
		},

		/** Coloca uma peca no tabuleiro (matriz) **/
 		colocaPeca : function(i) {

			for(x=5;x>=0;x--) {
				if(this.tabuleiro[x][i] == 0) {
					this.tabuleiro[x][i] = pontos[index];
					return codes.COORD.replace("$i$", x).replace("$j$", i).replace("$cor$", cores[index]);	
				}		
			}
				return null;				
		},

		calculaPecas : function(i,j, iv, jv, retorno) {

			if (retorno >= n) {

				if (i < 0 || i > 5 || j < 0 || j > 6) {
					aux = 0;
				} else {
					aux = this.tabuleiro[i][j];
				}

				return aux;
			}

			if (i < 0 || i > 5 || j < 0 || j > 6) {
				aux = 0;
			} else {
				aux = this.tabuleiro[i][j];
			}

			return aux + this.calculaPecas(i+iv, j+jv, iv, jv, ++retorno);
		},

		verificaVencedor : function() {		
	
			for(p=0;p<2; p++) {
				for(i=0; i<6; i++) {
		  		 	 for(j=0; j<7; j++) {

					if(this.calculaPecas(i,j,-1,0,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}

					else if(this.calculaPecas(i,j,1,0,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}	

					else if(this.calculaPecas(i,j,0,1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}

					else if(this.calculaPecas(i,j,0,-1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}

					else if(this.calculaPecas(i,j,1,1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}		

					else if(this.calculaPecas(i,j,1,-1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}

					else if(this.calculaPecas(i,j,-1,-1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}			

					else if(this.calculaPecas(i,j,-1,1,1) == n*pontos[p]) {
						this.terminaJogo(p);
						break;
					}	
				  }
				}
			}
		},

		terminaJogo : function(vencedor) {
			console.log("Jogador " + vencedor + " ganhou!");
			sendWinnerMsg(vencedor);
			// o perdedor comecara agora
			vez = vencedor == 0 ? 1 : 0;
			jogando = 0;
		}
	};


/** Inicia o jogo **/
Jogo.iniciaTabuleiro();

/** Ao receber uma requisicao **/
socketServer.on("request", function(request) {

	if(jogadores.length < 2) {
		var connection = request.accept("echo-protocol", request.origin);

		console.log("Conexao aceita - IP: " + connection.remoteAddress);
		jogadores.push(connection);

		/** Trata as mensagens enviadas pelos jogadores **/
		connection.on("message", function(event) {
	
			var content = JSON.parse(event.utf8Data);
			console.log("IN: " + JSON.stringify(content));

			// Se eh o jogador 0 ou 1
			index = jogadores.indexOf(connection);

			/** Trata a escolha de cores **/
			if(content.color != undefined) {

				if(content.color == cores[index == 0 ? 1 : 0]) {

					console.log("Jogador escolher cor ja escolhida: " + content.color + ". Enviando codigo para escolher novamente(c).");

					connection.sendUTF(codes.COLOR_CHOOSE);
					console.log("OUT: " + codes.COLOR_CHOOSE);
					
				} else {
				   cores[index] = content.color;

				   console.log("Jogador escolheu sua cor: " + content.color);

				   if(cores[0] != null && cores[1] != null) {
					  jogando = 1;
					  sendStatusMsg();
					}

				}
			/** Trata os movimentos de jogo **/
			} else if (content.j != undefined) {

				if(vez == index && jogadores.length >= 2 && jogando) {

					resp = Jogo.colocaPeca(content.j);

					if(resp != null) {
						sendAll(resp);

						vez = index == 0 ? 1 : 0;	
						sendStatusMsg();	

						console.log(Jogo.tabuleiro);
						Jogo.verificaVencedor();
					}			
				}
			} else if(content.r != undefined) {

					qtde_restart++;

					if(qtde_restart >= 2) {
						Jogo.iniciaTabuleiro();
						qtde_restart = 0;
						sendStatusMsg();
						jogando = 1;
					}
				}
		});

		/** Trata fechamento da conexao **/
		connection.on("close", function(reasonCode, description) {
			console.log("Conexao fechada - Codigo " + reasonCode + ": " + description);
		});

	} else {
		request.reject(406,"Lotado!");	
		console.log("Conexao negada!");
	}

	console.log("Numero de jogadores no servidor: " + jogadores.length);	
});


/** Utils **/

function sendAll(msg) {
	for(i=0; i<jogadores.length;i++) {
    	jogadores[i].sendUTF(msg);
		console.log("OUT: " + msg);
	}
}

function sendStatusMsg() {
	jogadores[vez].sendUTF(codes.TURN);
	console.log("OUT: " + codes.TURN + " to player " + vez);

	jogadores[vez == 0? 1:0].sendUTF(codes.WAIT);
	console.log("OUT: " + codes.WAIT + " to player " + vez == 0? 1:0);
}

function sendWinnerMsg(ganhador) {
	jogadores[ganhador].sendUTF(codes.WIN);
	console.log("OUT: " + codes.WIN + " to player " + ganhador);

	jogadores[ganhador == 0? 1:0].sendUTF(codes.LOSE);
	console.log("OUT: " + codes.LOSE + " to player " + ganhador == 0? 1:0);
}


