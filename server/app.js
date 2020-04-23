const PORT = 8081;	 // порт
const clients = new Map(); // контейнер для хранения сокета клиента (key) и информации о нем (value)
const names = new Map(); // занятые игроками имена
const hallStr = 'hall'; // имя комнаты, в которую добавляются все, кто online, но еще не играет
const waitingTime = { // время ожидания перехода в следующее состояние
	'preparing': 5000,
	'celebration': 120000
};

//Functions
const log = require('./src/log');




// ===============================================================================================
// ===============================================================================================
try {

// Создание сервера, слушающего заданный порт
const io = require('socket.io')(PORT);
const ip = require('ip');

const UE4 = io.of( '/ue4' ); // namespace, в котором находятся все играющие клиенты
const HALL = UE4.in( hallStr ); // комната, в которую добавляются все, кто online, но еще не играет

log( `The server was started at ${ip.address()}:${PORT}`, 'INFO' );

// Objects
const gameStateEnum = require('./src/gameState');

// Classes
const ElemConfig = require('./src/elemConfig');
const PeriodicTable = require('./src/periodicTable');
const ClientInfo = require('./src/clientInfo');
const GameInfo = require('./src/gameInfo');

/**
 * Удалить элемент из массива, если он там имеется
 * @param {Array} arr Массив, из которого необходимо вырезать элемент
 * @param {any} elem Элемент, который необходимо удалить из массива, если он там имеется
 */
function cutElem( arr, elem ) {

	try {
		const i = arr.indexOf( elem, 0 );

		if( i != -1 )
			arr.splice( i, 1 );
	}
	catch( error ) {
		log( error, 'error' );
	}
	
}


/**
 * Получить Promise для получения списка клиентов в комнате HALL
 */
HALL.getClients = () => {
	return new Promise( ( resolve, reject ) => {
		HALL.clients( ( error, clientIds ) => {
			error ? reject( error ) : resolve( clientIds );
		})
	});
}


/**
 * Добавить игрока в комнату
 * @param {Socket} player Игрок
 * @param {String} room Имя комнаты
 */
function joinRoom( player, room ) {
	return new Promise( ( resolve, reject ) => {
		player.join( room, ( error ) => error ? reject( error ) : resolve( 1 ) );
	})
}


/**
 * Удалить игрока из комнаты
 * @param {Socket} player Игрок
 * @param {String} room Имя комнаты
 */
function leaveRoom( player, room ) {
	return new Promise( ( resolve, reject ) => {
		player.leave( room, ( error ) => error ? reject( error ) : resolve( 1 ) );
	})
}


/**
 * Добавить игроков в отдельную комнату, начать матч и сообщить об этом другим игрокам
 * @param {Socket} player1 Игрок
 * @param {Socket} player2 Игрок
 */
async function startMatch( player1, player2, player1callback ) {

	const info1 = clients.get( player1.id );
	const info2 = clients.get( player2.id );
	if( !info1 || !info2) {
		log( `The invalid ClientInfo object ( ${player1.id}, ${player2.id} )`, 'Error', 'startMatch');
		return;
	}

	// перевести игроков с состояние 'PeriodicTable'
	info1.gameInfo = info2.gameInfo = new GameInfo();
	info2.socket.emit( 'changeState', { 'state': info2.gameState, 'data': { 'team': info2.team } } );
	player1callback( { 'state': info1.gameState, 'data': { 'team': info1.team } } );

	let list = [];
	try {
		list = await HALL.getClients();
	}
	catch ( error ) {
		log( 'Failed to inform clients about started match', 'Error', 'startMatch' );
		log( error, 'error' );
		return;
	}

	for( const id of list ) {
		const info = clients.get( id );
		info.inviters.delete( player1.id );
		info.inviters.delete( player2.id );
		HALL.to( id ).emit( 'refreshResults', {
			'action': 'remove',
			'data': [
				{ 'id': player1.id },
				{ 'id': player2.id }
			]
		} );
	}
}


/**
 * Удалить клиента из выдачи результатов в списке клиентов в HALL
 * @param {Sting} id Клиент, которого необходимо удалить из списков клиентов в HALL
 */
async function deleteFromLists( id ) {
	let list = [];
	try {
		list = await HALL.getClients();
	}
	catch( error ) {
		log( `Failed to delete id ( ${id} ) from inviter lists of clients in HALL`, 'Error', 'deleteFromLists' );
		log( error, 'error' );
		return;
	}
	
	for (const client of list) {
		clients.get( client ).inviters.delete( id );
		HALL.to( client ).emit( 'refreshResults', {
			'action': 'remove',
			'data': [ { 'id': id } ]
		} );
	}
}


/**
 * Перевести игрока и его оппонента в состояние матча, если оба готовы
 * @param {String} id Игрок
 */
function toMatch( id ) {
	const info = clients.get( id );
	if( info && info.opponent ) { // соединение с обоими игроками еще не потеряно
		if( info.gameState === gameStateEnum.Preparing ) { // состояние игры соответствующее
			if( info.gameInfo.readyPlayers === 2 ) { // оба игрока готовы продолжить игру
				const opInfo = clients.get( info.opponent );

				info.gameState = opInfo.gameState = gameStateEnum.Match;
				info.shots = new ElemConfig();
				opInfo.shots = new ElemConfig();

				// розыгрыш права хода
				const myRightMove = Math.random() < 0.5;
				info.gameInfo.rightMove = myRightMove ? id : info.opponent;
				info.gameInfo.readyPlayers = 0;

				// изменить состояние игры на клиентах
				info.socket.emit( 'changeState', {
					'state': info.gameState,
					'data': { 'rightMove': myRightMove }
				});
				opInfo.socket.emit( 'changeState', {
					'state': info.gameState,
					'data': { 'rightMove': !myRightMove }
				});
			}
		}
		else
			log( `Failed to go to Match: Invalid state ( ${info.gameState} )`, 'Warn', 'toMatch' );
	}
	else
		log( 'Can not go to Match state because of invalid ClientInfo object or null opponent', 'Error', 'toMatch' );
}


/**
 * Перевести игрока в состояние Online
 * @param {String} id Игрок
 */
function leaveTheMatch( id ) {
	const info = clients.get( id );

	if( info === undefined || info.gameState === gameStateEnum.Celebration )
		return;

	info.resetGameInfo(); // сбросить информацию, касающуюся матча

	// извещение клиентов в hall о добавлении нового игрока
	info.socket.broadcast.to( hallStr ).emit( 'refreshResults', {
		'action': 'add',
		'data': [ {
			'id': id,
			'name': info.name
		} ] 
	} );

	const list = getClientsInHall( id, false );
	info.socket.emit( 'changeState', {
			'state': gameStateEnum.Online,
			'data': list
		});
}


/**
 * Получить список игроков в hall, исключая клиента с reqId, в формате [ ...{ id, name, bIsInvited, bIsInviting } ]
 * @param {String} reqId id клиента, для которого формируется список
 * @param {Bool} bWithInvitations Нужно ли добавлять информацию о приглашениях
 */
function getClientsInHall( reqId, bWithInvitations ) {

	const reqInfo = clients.get( reqId );
	const clientList = [];
	let getInfo = bWithInvitations ? ( cId, cInfo ) => {
			clientList.push(
				{
					'id': cId,
					'name': cInfo.name,
					'bIsInvited': cInfo.inviters.has( reqId ),
					'bIsInviting': reqInfo.inviters.has( cId ) 
				} 
			);
		}
	: ( cId, cInfo ) => {
			clientList.push(
				{
					'id': cId,
					'name': cInfo.name
				} 
			);
		};

	clients.forEach( ( id, info, map ) => {
		if( id !== reqId && info.gameState === gameStateEnum.Online )
			getInfo( id, info );
	});
}


io.on( 'connect', (socket) => {

	log( `New client: ${socket.id}. Total connected clients: ${clients.size}`, 'Event' );

	socket.on( 'disconnectMe', () => {
		socket.disconnect( true );
	} )

})

UE4.on( 'connect', function( socket ) {

	// Вывести сообщение о тм, что подключился новый пользователь
	log( `New client in 'UE4' namespace: ${socket.id}`, 'Event' );

	const myId = socket.id;
	let myInfo = null;



	// Пользователь перешел в состояние Online, передает свое имя и ожидает список доступных соперников
	socket.on( 'registration', ( myName, callback ) => {

		myName = myName.toString();
		const status = names.get( myName );
		if( status !== undefined && status )
			callback( false );
		else {
			callback( true );
			
			myInfo = new ClientInfo( myName, socket );
			clients.set( myId, myInfo );
			names.set( myName, true );
			const list = getClientsInHall( myId, false );

			log( 'Client joined to the room "HALL"', `${myName}`, 'Registration' );

			// отправка клиенту списка неиграющих подключенных игроков
			socket.emit( 'changeState', {
				'state': gameStateEnum.Online,
				'data': list
			} );

			// извещение всех находящихся в комнате о присоединении нового клиента
			socket.broadcast.to( hallStr ).emit( 'refreshResults', {
				'action': 'add',
				'data': [ {
					'id': myId,
					'name': myName 
					} ] 
				} );
		}
	});


	// отправка клиенту списка неиграющих подключенных игроков
	socket.on( 'refreshList', ( data, callback ) => {

		log( 'The client asks for a list of all non-playing connected clients', myInfo.name, 'RefreshList' );

		const list = getClientsInHall( myId, true );
		callback( list );
	});


	// приглашение игрока ( id ) на начало матча
	socket.on( 'invite', ( id, callback ) => {
		id = id.toString();
		const myId = socket.id;
		const myInfo = clients.get( myId );
		const opInfo = clients.get( id );

		if( !opInfo ) { // существует ли вообще такой клиент
			log( `Trying to invite invalid client id ( ${id} )` , 'Error', 'onInvite' );
			callback( false );
			return;
		}

		log( `Invites ${opInfo.name}`, `${myInfo.name}`, 'Invitation' );

		if( myInfo.gameState == gameStateEnum.Online && myInfo.gameState == opInfo.gameState ) {
			// если оба игрока пригласили друг друга, то можно начинать матч
			if( myInfo.inviters.delete( id ) ) {
				myInfo.opponent = id;
				opInfo.opponent = myId;
				myInfo.gameState = opInfo.gameState = gameStateEnum.PeriodicTable;
				myInfo.team = Math.round( Math.random() );
				opInfo.team = myInfo.team ? 0 : 1;
				myInfo.inviters.clear();
				opInfo.inviters.clear();

				// присоединиться к игровой комнате и разослать всем клиентам в hall, что необходимо удалить две записи
				startMatch( socket, opInfo.socket, callback );
			}
			else { // если второй игрок еще не приглашал текущего

				opInfo.inviters.add( myId ); // добавить в список приглашающих клиентов
				UE4.to( id ).emit( 'refreshResults', { // отправить команду на обновление данных о доступном клиенте
					'action': 'refresh',
					'data': [
						{
							'id': myId,
							'name': myInfo.name,
							'bIsInvited': false,
							'bIsInviting': true
						}
					]
				} );
				callback( true );
			}
		}
		else { // Кто-то уже играет
			log( new Error( `Somebody is not online ( inviter state: ${myInfo.gameState}, inviting player state: ${opInfo.gameState} )` ), 'warn' );
			callback( false );
		}
	});


	// клиент хочет отсоединиться или закончить матч
	socket.on( 'flyAway', ( data, callback ) => {
		const info = clients.get( socket.id );

		if( info === undefined ) {
			log( `Wants to fly away`, `${socket.id}`, 'FlyAway' );
			callback( { 'state': gameStateEnum.Offline } );
			socket.disconnect( true );
			return;
		}

		log( `Client wants to fly away from ${info.gameState} state ( ${info.name} )`, 'LOG', 'onFlyAway' );

		switch (info.gameState) {
			case gameStateEnum.Online:
				// отдать команду на переход в offline состояние
				callback( { 'state': gameStateEnum.Offline } );
				socket.disconnect( true );
				break;
			
			case gameStateEnum.Celebration:
				log( new Error( 'Client try to fly away from invalid state' ), 'warn' );
				break;

			default:
				const opInfo = clients.get( info.opponent );
				info.gameInfo.rightMove = '';
				info.gameInfo.winner = info.opponent;

				// перевести клиентов в состояние celebration, передав каждому его результат матча
				callback( {
					'state': gameStateEnum.Celebration,
					'data': {
						'bIsWinner': false,
						'opponentElem': opInfo.chemicalElement
					}
				} );
				UE4.to( info.opponent ).emit( 'changeState', {
					'state': gameStateEnum.Celebration,
					'data': {
						'bIsWinner': true,
						'opponentElem': info.chemicalElement
					}
				} );
				info.gameState = opInfo.gameState = gameStateEnum.Celebration;
				info.losses++;
				opInfo.wins++;

				// отпустить игрока через указанное время, если этого не сделал победивший соперник
				setTimeout( leaveTheMatch, waitingTime.celebration, socket.id );
				break;
		}
	});


	// Игрок выбрал элемент в таблице Менделеева
	socket.on( 'elemSelection', ( number, callback ) => {
		const myId = socket.id;
		const info = clients.get( myId );

		if( info.gameState != gameStateEnum.PeriodicTable ) {
			log( `Event instigator does not have appropriate rights ( 'id': ${info.name}, 'state': ${info.gameState} )`, 'Cheater', 'onElemSelection' );
			return;
		}

		if( info.chemicalElement.number > 0 && info.chemicalElement.number <= 118 ) {
			log( `Player has chosen the element yet ( 'id': ${info.name}, 'player element': ${info.chemicalElement.number}, 'request': ${number} )`, 'Cheater', 'onElemSelection' );
			return;
		}

		if( number < 1 || number > 118 ) {
			log( `Player selected the invalid element ( 'id': ${info.name}, 'number': ${number} )`, 'Error', 'onElemSelection' );
			return;
		}

		info.chemicalElement.number = number;
		info.chemicalElement.element = PeriodicTable.table[ number ];
		log( `Element selected: Number: ${info.chemicalElement.number}, Name: ${info.chemicalElement.element.name}, Symbol: ${info.chemicalElement.element.symbol}, Config: ${info.chemicalElement.element.config}`, `${info.name}`, 'ElementSelection')
		info.gameState = gameStateEnum.Preparing;
		info.diagramState = new ElemConfig();

		callback( { 'state': info.gameState } );
	} );


	// проверить заполнение диаграммы
	socket.on( 'checkConfig', ( data, callback ) => {
		const info = clients.get( socket.id );

		const diagram = new ElemConfig( data );
		if( diagram.config[0] == 0 ) { // проверка типа пришедших данных
			log( `Invalid data type ( 'player': ${info.name}, 'data': ${data} )`, 'Error', 'onCheckConfig' );
			callback( false );
			return;
		}

		info.diagramState = diagram;

		// сравнить диаграмму и конфигурацию загаданного элемента
		if( ElemConfig.isEqual( diagram, info.chemicalElement.element.config ) ) { // правильно
			info.gameInfo.readyPlayers++;
			log( `Checking filling the diagram: ${diagram.config} Result: true, Ready players: ${info.gameInfo.readyPlayers} `, `${info.name}`, 'CheckConfiguration' );
			callback( true );

			// подождать и перевести обоих в следующее состояние
			setTimeout( toMatch, waitingTime.preparing, socket.id );
		}
		else { // неправильно
			log( `Checking filling the diagram: ${diagram.config} Result: false ( ${info.chemicalElement.element.config} ), Ready players: ${info.gameInfo.readyPlayers} )`, `${info.name}`, 'CheckConfiguration' );
			callback( false );
		}
	})


	// выстрел во время матча
	socket.on( 'shot', ( spin, callback ) => {
		const myId = socket.id;
		const info = clients.get( myId );

		// действительно ли сейчас матч
		if( info.gameState != gameStateEnum.Match ) {
			log( `Event instigator is in an invalid state ( 'id': ${info.name}, 'state': ${info.gameState} )`, 'Cheater', 'onShot' );
			callback( false );
			return;
		}

		// имеет ли игрок право хода
		if( info.gameInfo.rightMove != myId ) {
			log( `Event instigator does not have appropriate rights ( 'id': ${info.name} )`, 'Cheater', 'onShot' );
			callback( false );
			return;
		}

		if( spin < 1 || spin > 118 ) {
			log( `Invalid value of spin number ( 'id': ${info.name}, 'spin': ${spin} )`, 'Cheater', 'onShot' );
			callback( false );
			return;
		}

		const opInfo = clients.get( info.opponent );

		log( `Shot >> ${spin} ( ${opInfo.name} )`, `${info.name}` );

		// отправить результат выстрела стрелявшему и сообщить о выстреле оппоненту
		callback( opInfo.chemicalElement.element.config.hasSpin( spin ) );
		opInfo.socket.emit( 'shot', { 'number': spin } );
		info.gameInfo.rightMove = info.opponent;

		// запомнить выстрел
		info.shots.write( spin, true );

	} );


	// игрок хочет назвать элемент
	socket.on( 'nameElement', ( number, callback ) => {
		const myId = socket.id;
		const info = clients.get( myId );

		// действительно ли сейчас матч
		if( info.gameState != gameStateEnum.Match ) {
			log( `Event instigator is in an invalid state ( 'id': ${info.name}, 'state': ${info.gameState} )`, 'Cheater', 'onNameElement' );
			return;
		}

		// имеет ли игрок право хода
		if( info.gameInfo.rightMove != myId ) {
			log( `Event instigator does not have appropriate rights ( 'id': ${info.name} )`, 'Cheater', 'onNameElement' );
			return;
		}

		// элемент с таким номером еть в таблице Менделеева
		if( number < 1 || number > 118 ) {
			log( `Invalid value of element number ( 'id': ${info.name}, 'spin': ${number} )`, 'Cheater', 'onNameElement' );
			return;
		}

		const celebration = gameStateEnum.Celebration;
		const opInfo = clients.get( info.opponent );
		info.gameState = opInfo.gameState = celebration; // изменить состояние игры
		const result = opInfo.chemicalElement.number == number; // результат ( отгадал или нет)
		log( `Wants to name element >> ${number} Result: ${result}`, `${info.name}`, 'NameElement' );

		// перевести игроков в состояние celebration, сообщив результат матча
		callback( {
			'state': celebration,
			'data': {
				'bIsWinner': result,
				'opponentElem': opInfo.chemicalElement
			}
		});
		opInfo.socket.emit( 'changeState', {
			'state': celebration,
			'data': {
				'bIsWinner': !result,
				'opponentElem': info.chemicalElement
			}
		});

		// подвести итог матча
		info.gameInfo.rightMove = '';
		info.gameInfo.winner = result ? myId : info.opponent;
		if( result ) {
			info.wins++;
			opInfo.losses++;
			log( `\n===================\nWinner: ${info.name}\nElement: ${info.chemicalElement.element.symbol}\nWins: ${info.wins}\nGames: ${info.wins + info.losses}\n\nOpponent: ${opInfo.name}\nElement: ${opInfo.chemicalElement.element.symbol}\nWins: ${opInfo.wins}\nGames: ${opInfo.wins + opInfo.losses}\n===================`, 'MATCH RESULT')
			// отпустить игрока через указанное время, если этого не сделал победивший соперник
			setTimeout( leaveTheMatch, waitingTime.celebration, socket.id );
		}
		else {
			opInfo.wins++;
			info.losses++;
			log( `\n===================\n\nWinner: ${opInfo.name}\nElement: ${opInfo.chemicalElement.element.symbol}\nWins: ${opInfo.wins}\nGames: ${opInfo.wins + opInfo.losses}\n\nOpponent: ${info.name}\nElement: ${info.chemicalElement.element.symbol}\nWins: ${info.wins}\nGames: ${info.wins + info.losses}\n\n===================`, 'MATCH RESULT')
			// отпустить игрока через указанное время, если этого не сделал победивший соперник
			setTimeout( leaveTheMatch, waitingTime.celebration, info.opponent );
		}

	} )


	// победитель подтверждает окончание матча
	socket.on( 'endGame', () => {
		const myId = socket.id;
		const info = clients.get( myId );

		if( info.gameInfo.winner != myId ) {
			log( `Event instigator does not have appropriate rights ${info.name}`, 'Cheater', 'onEndGame' );
			return;
		}

		log( 'Winner confirmed the end of game', `${info.name}`, 'EndGame' );

		// перевести в состояние online сначала оппонента, если есть, а затем перевести себя
		if( info.opponent != '' )
			leaveTheMatch( info.opponent );

		leaveTheMatch( myId );
	} );


	// отключение клиента от сервера
	socket.on( 'disconnect', ( reason ) => {
		log( `Client disconnected ( ${socket.id} ): ${reason}`, 'LOG', 'onDisconnect' );
		const info = clients.get( socket.id );
		if( info ) {
			try {
				// оповестить клиентов в HALL, если online
				if( info.gameState === gameStateEnum.Online ) {
					if( clients.size > 1 )
						deleteFromLists( socket.id );
				}
				else { // оповестить противника и перевести его в состояние Celebration
					if( info.opponent != '' ) { // если еще есть противник
						const opInfo = clients.get( info.opponent );
						const celebration = gameStateEnum.Celebration;

						// если игроки уже в конце матча
						if( opInfo.gameState === celebration ) {
							if( opInfo.gameInfo.winner != info.opponent ) // оппонент проиграл
								leaveTheMatch( info.opponent );
						}
						else { // если клиенты еще играют, то оппонент становится победителем
							opInfo.socket.emit( 'changeState', {
								'state': celebration,
								'data': {
									'bIsWinner': true,
									'opponentElem': info.chemicalElement
								}
							});
							opInfo.gameInfo.winner = info.opponent;
							opInfo.gameState = celebration;
							opInfo.wins++;
							opInfo.opponent = '';
						}
					}
				}
			}
			finally {
				// при любом раскладе необходимо удалить информацию о клиенте
				names.delete( info.name );
				clients.delete( socket.id );
			}
		}
	});


	socket.on( 'error', function( error ) {
		log( error, 'error' );
	});

});


// ===============================================================================================
// ===============================================================================================
} catch( error ) {
	log( 'Error', error.stack );
}