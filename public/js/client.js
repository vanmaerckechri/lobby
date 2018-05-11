let socket = io.connect(window.location.host);

window.addEventListener('load', function()
{
	// Connexion
	if (document.querySelector('#submitPseudo'))
	{
		let submit = document.querySelector('#submitPseudo');
		let pseudo = document.querySelector('#pseudo');
		submit.addEventListener('click', function(e)
		{
			e.preventDefault();
			socket.emit('recordNewPlayerInfo', pseudo.value);
			socket.on('validatePseudo', function (pseudoValide)
			{
				if (pseudoValide[0] === true)
				{
					// Menu Principal.
					loadMainMenu()
				}
				else
				{
					displayAlert(pseudoValide[1])
				}
			});

		});
	}
});
// Charger Menu Principal.
function loadMainMenu()
{
	let main = document.querySelector('#main');
	let menuContent = '<h1>Lobby</h1>';
	menuContent +=	'<div class="menuMain">';
	menuContent +=	'<h2>Menu Principal</h2>';
	menuContent += '<button id="createLobby" class="button">Créer un Lobby</button>';
	menuContent +=	'<button id="loadLobbiesList" class="button">Rejoindre un Lobby</button>';
	menuContent +=	'</div>';
	menuContent += '<div class="error"></div>';
	main.innerHTML = menuContent;
	let create = document.querySelector('#createLobby');
	create.addEventListener('click', function()
	{
		// Lobby.
		loadLobby();
		socket.emit('createLobby');
	});
	let lobbiesListButton = document.querySelector('#loadLobbiesList');
	lobbiesListButton.addEventListener('click', function()
	{
		// Liste des Lobbies.
		loadLobbiesList()
		socket.emit('refreshLobbiesList');
		socket.on('refreshLobbiesList', function(list)
		{
			console.log(list);
			if (document.querySelector('#lobbiesList'))
			{
				let lobbiesListContainer = document.querySelector('#lobbiesList');
				lobbiesListContainer.innerHTML = '';
				let roomsId = Object.keys(list);
				if (roomsId.length > 0)
				{
					for (let i = 0, roomsLength = roomsId.length; i < roomsLength; i++)
					{
						if (list[roomsId[i]].options.open === true && roomsId[i] != '')
						{
							let roomId = "'"+roomsId[i]+"'";
							let roomName = list[roomsId[i]].socketName[0];
							lobbiesListContainer.innerHTML += '<button class="button" onclick="joinLobby('+roomId+')">'+roomName+'</button>';
						}
					}
				}
			}
		});
	});
}

// Charger liste des Lobbies.
function loadLobbiesList()
{
	let main = document.querySelector('#main');
	let lobbyListContent = '<h1>Lobby</h1>';
	lobbyListContent += '<div class="menuMain">';
	lobbyListContent += '<h2>Liste des Lobbies</h2>';
	lobbyListContent += '<div id="lobbiesList" class="lobbiesList"></div>';
	lobbyListContent += '</div>';
	lobbyListContent += '<div class="error"></div>';
	main.innerHTML = lobbyListContent;
}

// Charger le Lobby.
function loadLobby()
{
	let main = document.querySelector('#main');
	let lobbyContent = '<h1>Lobby</h1>';
	lobbyContent +=	'<div class="lobby">';
	lobbyContent +=	'<div id="lobbyMembers" class="lobbyMembers"></div>';
	lobbyContent += '<div class="talkBoard">';
	lobbyContent += '<div class="taskbar"><button class="button backToMainMenu">X</button></div>';
	lobbyContent += '<div class="messages"></div>';
	lobbyContent += '<div class="inputMessageContainer">';
	lobbyContent += '<textarea name="inputMessage" class="inputMessage"></textarea>';
	lobbyContent += '<button class="button chatSend">Envoyer</button>';
	lobbyContent += '</div></div></div>';
	lobbyContent += '<div class="error"></div>';
	main.innerHTML = lobbyContent;
	let chatSend = document.querySelector('.chatSend');
	let smsContainer = document.querySelector('.inputMessage');
	chatSend.addEventListener('click', function()
	{
		socket.emit('sendMessage', smsContainer.value);
		smsContainer.value = '';
	})
	let backToMainMenuButton = document.querySelector('.backToMainMenu');
	backToMainMenuButton.addEventListener('click', function()
	{
		loadMainMenu();
		socket.emit('leaveLobby');
	})
}

// Messages d'Alerte.
socket.on('sendAlert', function(sms)
{
	displayAlert(sms);
});

function displayAlert(sms)
{
	let errorSms = document.querySelector('.error');
	errorSms.innerHTML = sms;
}

// Joindre un Lobby.
function joinLobby(room)
{
	socket.emit('joinLobby', room);
	loadLobby();
}

// Update l'affichage Membres du Lobby.
socket.on('refreshLobby', function(names)
{
	refreshLobby(names);
});

function refreshLobby(names)
{
	let lobbyMembersContainer = document.querySelector('#lobbyMembers');
	lobbyMembersContainer.innerHTML = '';

	for (let i = 0, lobbyLength = names.length; i < lobbyLength; i++)
	{
		if (names[i] != '')
		{
			lobbyMembersContainer.innerHTML += '<div class="pseudo">'+names[i]+'<span class="eject"></span></div>';
		}
		else
		{
			lobbyMembersContainer.innerHTML += '<div class="pseudo">'+names[i]+'</div>';			
		}
	}	
}

// Update l'affichage des commandes admin dans le lobby.
socket.on('refreshLobbyAdmin', function(lobbyInfos)
{
	if (document.querySelectorAll('.eject'))
	{
		let ejectButton = document.querySelectorAll('.eject')
		for (let i = 1, ejectLength = ejectButton.length; i < ejectLength; i++)
		{
			let userId = "'"+lobbyInfos.usersId[i]+"'";
			ejectButton[i].innerHTML = '<button class="button" onclick="ejectUser('+userId+')">X</span>';
		}
	}
});

// CHAT
// Afficher Message.
socket.on('sendMessage', function(message)
{
	if (message.sms != undefined && message.sms != '')
	{
		let messages = document.querySelector('.messages');
		let newSms = '<p class="user">'+message.broadcaster+': ';
		newSms += '<span class="message">'+message.sms+'</p>';
		messages.innerHTML += newSms;
	}
});

// Ejecter Utilisateur.
function ejectUser(user)
{
	socket.emit('ejectUser', user);
}
socket.on('backToMainMenu', function(sms)
{
	loadMainMenu();
	displayAlert(sms);
});
