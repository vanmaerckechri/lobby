// MODULES!
let express = require('express'),
	app = express(),
	server = require('http').createServer(app),
    http = require('http'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	ent = require('ent'),
	io = require('socket.io')(http).listen(server);

app.set('port', (process.env.PORT || 1337));

server.listen(app.get('port'), function()
{
	console.log('Node app is running on port', app.get('port'));
});

app.set('view engine', 'ejs');

// MIDDLEWARES!

// Acceder aux Fichiers Nécessaires au Fonctionnement de l'Application.
app.use('/assets', express.static('public'));

// Formater les Données Importées (input, json, etc.).
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

// Sessions.
app.use(session(
{
	secret: 'turlututu',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false } // true pour l'https.
}))

// ROUTES!

// Route Principale.
app.get('/', (req, res) =>
{
	req.session.playerInfo = {};
		res.render('pages/index',
	{
		main: 'connexion'
	});
});

function validatePseudo(pseudo)
{
	let errorSms;
	if (pseudo === undefined || pseudo === '')
	{
		errorSms = "Vous n'avez pas entré de pseudo!";
		return [false, errorSms];
	}

	let reg = /^[a-z0-9]+$/i;
	let contentFilter = pseudo.match(reg);
	if (contentFilter === null)
	{
		errorSms = "Le pseudo ne peut être composé que de lettres et de chiffres!";
		return [false, errorSms];
	}

	if (pseudo.length < 4 || pseudo.length > 16)
	{
		errorSms = "Le pseudo doit comporter entre 4 et 16 caractères";
		return [false, errorSms];
	}
	return [true, pseudo];
}

let lobbies = [];
let pplByLobby = 4;
function createLobby(socket)
{
	// let lobby = [id room, nom du manager, ppl2, ppl3, ...(en fonction de 'pplByLobby'), true pour room ouverte(il reste de la place)]
	let lobby = [socket.id, socket.name];
	for (let i = 0, length = pplByLobby - 1; i < length; i++)
	{
		lobby.push('');
	}
	lobby.push(true);
	lobbies.push(lobby);
	socket.room = socket.id;
	socket.broadcast.emit('refreshLobbiesList', lobbies);
}

function joinLobby(socket, roomId)
{
	if ((io.sockets.adapter.rooms[roomId]).length < pplByLobby)
	{

		for (let i = 0, length = lobbies.length; i < length; i++)
		{
			// affichage membre lors de la creation du lobby.
			if (lobbies[i][0] === socket.id)
			{
				socket.emit('refreshLobby', lobbies[i]);
				return;
			}
			// ajoute un membre à la room et affiche les membres. 
			else if (lobbies[i][0] === roomId)
			{
				let lastIndex = lobbies[i].length - 1;
				for (let j = 2; j < lastIndex; j++)
				{
					if (lobbies[i][j] === '')
					{
						lobbies[i][j] = socket.name;
						socket.join(roomId);
						socket.room = roomId;
						socket.broadcast.to(roomId).emit('refreshLobby', lobbies[i]);
						socket.emit('refreshLobby', lobbies[i]);
						// lobby full.
						if (j === lastIndex - 1)
						{
							lobbies[i][lastIndex] = false;
							socket.emit('refreshLobbiesList', lobbies);
						}
						return;
					}
				}
			}
		}
	}
}

function checkLobbyIndex(room)
{
	for (let i = 0, length = lobbies.length; i < length; i++)
	{
		// Detecter le lobby dans lequel se trouve l'utilisateur.
		if (lobbies[i][0] === room)
		{
			return i;
		}
	}	
}

function returnSocketsId(room)
{
	let roomSockets = Object.getOwnPropertyNames(io.sockets.adapter.rooms[room].sockets);
	return roomSockets;
}

function leaveLobby(socket)
{
	// S'il reste d'autres utilisateurs dans le lobby...
	if (lobbies.length > 0)
	{
		let room = socket.room;
		let lobbyIndex = checkLobbyIndex(room);
		lobbies[lobbyIndex][(lobbies[lobbyIndex].length) - 1] = false;
		if (io.sockets.adapter.rooms[room] != undefined)
		{
			let roomSockets = returnSocketsId(room);
			// Attribution d'un nouvel ID au lobby.
			lobbies[lobbyIndex][0] = roomSockets[0];
			for (let i = 1, lobbyLength = (lobbies[lobbyIndex].length) - 1; i < lobbyLength; i++)
			{
				// Réorganisation du lobby.
				if (roomSockets[i - 1])
				{
					lobbies[lobbyIndex][i] = io.sockets.connected[roomSockets[i - 1]].name;

					if (room != lobbies[lobbyIndex][0])
					{
						io.sockets.connected[roomSockets[i - 1]].leave(room);
					}
					io.sockets.connected[roomSockets[i - 1]].join(lobbies[lobbyIndex][0]);
					io.sockets.connected[roomSockets[i - 1]].room = lobbies[lobbyIndex][0];
				}
				else
				{
					lobbies[lobbyIndex][i] = '';
				}
			}
			lobbies[lobbyIndex][(lobbies[lobbyIndex].length) - 1] = true;
			// Mettre à jour la liste des joueurs du lobby.
			socket.broadcast.to(lobbies[lobbyIndex][0]).emit('refreshLobby', lobbies[lobbyIndex]);
		}
		socket.broadcast.emit('refreshLobbiesList', lobbies);
	}
}

io.sockets.on('connection', function(socket)
{
	socket.on('disconnect', function()
	{
		let room = socket.room;
		leaveLobby(socket);
	});

	socket.on('leaveLobby', function()
	{
		let room = socket.room;
		leaveLobby(socket);
		socket.leave(socket);
	});

	socket.on('pullPseudo', function()
	{
		socket.emit('pullPseudo', req.session.playerInfo['pseudo']);
	});

	socket.on('recordNewPlayerInfo', function(pseudo)
	{
		pseudoEncode = ent.encode(pseudo);
		let pseudoValide = validatePseudo(pseudo)

		if (pseudoValide[0] === true)
		{
			socket.name = pseudoValide[1];
		}
		socket.emit('validatePseudo', pseudoValide);
	});

	// Refresh la Liste des Lobbies.
	socket.on('refreshLobbiesList', function(list)
	{
		socket.emit('refreshLobbiesList', lobbies);
	});

	// Créer un Lobby.
	socket.on('createLobby', function()
	{
		socket.join(socket.id);
		createLobby(socket);
		joinLobby(socket, socket.id)
	});

	// Joindre un Lobby.
	socket.on('joinLobby', function(roomId)
	{
		joinLobby(socket, roomId);
		socket.broadcast.emit('refreshLobbiesList', lobbies);
		// le nombre de clients dans une room...
		//console.log((io.sockets.adapter.rooms[roomId]).length);
	});

	// CHAT!
	// Send Message.
	socket.on('sendMessage', function(message)
	{
		let messageEncode = ent.encode(message);
		socket.to(socket.room).emit('sendMessage', {sms: messageEncode, broadcaster: socket.name});
		socket.emit('sendMessage', {sms: messageEncode, broadcaster: socket.name});
	});
});