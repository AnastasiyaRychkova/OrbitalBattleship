const PORT = 8081;	 // порт
const clients = new Map(); // контейнер для хранения сокета клиента (key) и информации о нем (value)
const names = new Map(); // занятые игроками имена
const hallStr = 'hall'; // имя комнаты, в которую добавляются все, кто online, но еще не играет
const waitingTime = { // время ожидания перехода в следующее состояние
	'preparing': 5000,
	'celebration': 120000
};


/**
 * Сообщение пользователю служебной информации (логирование)
 * @param {String} type Тип сообщения
 * @param {String} message Сообщение
 */
function log( message, type, path ) {
	if( message instanceof Error )
		switch (type) {
			case 'error':
				console.error( message );
				break;
			case 'warn':
				console.warn( message );
				break;
		
			default:
				console.log( message.stack );
				break;		
	}
	else {
		switch (type) {
			case 'LOG':
			case 'Event':
			case 'Error':
			case 'Debug':
			case 'Cheater':
				type += ':';
				break;
			case 'MATCH RESULT':
				type += '~~~~~';
				
			default:
				type += '>';
				break;
		}
		console.log( `${type} ${path != undefined ? (path + ': ') : ''}${message}` );
	}
}


// ===============================================================================================
// ===============================================================================================
try {

// Создание сервера, слушающего заданный порт
const io = require('socket.io')(PORT);
const ip = require('ip');

const UE4 = io.of( '/ue4' ); // namespace, в котором находятся все играющие клиенты
const HALL = UE4.in( hallStr ); // комната, в которую добавляются все, кто online, но еще не играет

console.log( `The server was started at ${ip.address()}:${PORT}`);


/** ============================================
 * Электронная конфигурация химического элемента
 * =============================================
 * @property {Int32Array[4]} config электронная конфигурация
 */
class ElemConfig {

	constructor( buf ) {
		if ( buf == undefined || ( !( buf instanceof Array ) && !( buf instanceof Int32Array ) ) ) {
			this.config = new Int32Array([0, 0, 0, 0]);
		}
		else {
			if( buf.length === 4 ) {
				this.config = new Int32Array( buf );
				return;
			}

			this.config = new Int32Array( 4 );
			let i = 0;
			for( ; i < buf.length && i < 4; i++ )
				this.config[i] = buf[i];
			for( ; i < 4; i++ )
				this.config[i] = 0;
		}
	}


	/**
	 * Сравнивает два элемента и возвращает истину только в том случае, если они правильные и эквивалентные
	 * @param {ElemConfig} elem1 Конфигурация первого элемента
	 * @param {ElemConfig} elem2 Конфигурация второго элемента
	 */
	static isEqual( elem1, elem2 ) {
		if( !( elem1 instanceof ElemConfig ) ||!( elem2 instanceof ElemConfig ) ) {
			log( `Compared objects are invalid ( Elem1: ${elem1 instanceof ElemConfig}, Elem2: ${elem2 instanceof ElemConfig} )`, 'Debug')
			return false;
		}

		if( elem1.config.length != 4 || elem2.config.length != 4 ) {
			log( `Some objects have not got configuration length ( Elem1: ${elem1.config.length}, Elem2: ${elem2.config.length})`, 'Debug')
		}

		for( let i = 0; i < 4; i++ )
			if( elem1.config[i] != elem2.config[i] )
				return false;
			
		return true;
	}


	/**
	 * Отмечен ли в данной конфигурации спин
	 * @param {Number} num Номер спина
	 */
	hasSpin( num ) {
		let mask = 1;
		mask <<= ( num - 1 ) % 32;
		return ( this.config[ ( ( num - 1 ) / 32 ) | 0 ] & mask ) != 0;
	}


	/**
	 * Отметить спин в объекте конфигурации элемента
	 * @param {Number} num Порядковый номер химического элемента
	 * @param {Bool} state Отмечен ли спин
	 */
	write( num, state ) {
		if( num >= 1 && num <= 118 )
			state ? this._add( num - 1 )
				: this._remove( num - 1 );
		else 
			log( new Error( `Write: Invalid element number : ${num}`, 'error' ));
	}

	/**
	 * Отметить спин
	 * @param {Number} index Индекс спина
	 */
	_add( index ) {
		let mask = 1;
		mask <<= index % 32;
		this.config[ ( index / 32 ) | 0 ] |= mask;
	}

	/**
	 * Снять отметку со спина
	 * @param {Number} index Индекс спина
	 */
	_remove( index ) {
		let mask = 1;
		mask <<= index % 32;
		this.config[ ( index / 32 ) | 0 ] &= ~mask;
	}

} // ---------------------------------------------


/** ==========================================
 * Периодическая таблица химических элементов
 * ==========================================
 */
class PeriodicTable {

	constructor( ) {
	}

	static init() {
		this.table = new Array(119);
		this.initTable( this.table );
	}

	static initTable() {
		log( 'Uninitialized function "initTable"', 'Debug' );
	}

	static getChemicalElementObject() {
		log( 'Uninitialized function "getChemicalElementObject"', 'Debug' );
	}

} // ---------------------------------------------



/** =============================================
 * Информация об игроке
 * ==============================================
 * @property {Object} 		chemicalElement химический элемент
 * @property {ElemConfig} 	diagramState 	состояние диаграммы
 * @property {GameInfo} 	gameInfo 		ссылка на объект игры
 * @property {Number} 		gameState 		текущее состояние игры
 * @property {Set} 			inviters 		множество всех приглашающих игрока
 * @property {Number} 		losses 			количество проигрышей
 * @property {String} 		name 			имя игрока
 * @property {String} 		opponent 		id оппонента
 * @property {ElemConfig} 	shots 			схема выстрелов, совершенных игроком
 * @property {Socket} 		socket 			сокет клиента
 * @property {Number} 		team 			команда
 * @property {Number} 		wins 			количество побед
 */
class ClientInfo {

	/**
	 * Объект с информацией об игроке
	 * @param {String} name Имя игрока
	 */
	constructor( name, skt ) {
		this.chemicalElement = {
			element: null, // ссылка на объект в периодической таблице
			number: 0
		};
		this.diagramState 	= null;
		this.gameInfo 		= null;
		this.gameState 		= gameStateToNum( 'Online' );
		this.inviters 		= new Set();
		this.losses 		= 0;
		this.name 			= name;
		this.opponent 		= '';
		this.shots 			= null;
		this.socket 		= skt;
		this.team 			= -1;
		this.wins 			= 0;
	}

	/**
	 * Удалить информацию о матче ( opponent, chemicalElement, diagramState, gameInfo, gameState, shots, team )
	 */
	resetGameInfo() {
		if( this.opponent ) {
			const opInfo = clients.get( this.opponent );
			if( opInfo )
				opInfo.opponent = null;
			this.opponent = null;
		}
		this.chemicalElement.number = 0;
		this.chemicalElement.element = null;
		this.diagramState = null;
		this.gameInfo = null;
		this.gameState = gameStateToNum( 'Online' );
		this.shots = null;
		this.team = -1;
	}

} // ---------------------------------------------



/** =============================================
 * Информация об игре
 * ==============================================
 * @property {Number} readyPlayers количество игроков готовых перейти в следующее синхронное состояние игры
 * @property {Socket} rightMove игрок с правом хода
 * @property {String} winner победивший игрок
 */
class GameInfo {

	constructor() {
		this.readyPlayers = 0;
		this.rightMove = '';
		this.winner = '';
	}
} // ---------------------------------------------



/**
 * Перевести строковое представление состояния игры в число
 * @param {String} state Состояние игры
 * @returns {Number} Численное представление состояния игры
 */
function gameStateToNum( state ) {
	switch (state) {
		case 'Offline':
			return 1;
		case 'Registration':
			return 2;
		case 'Online':
			return 3;
		case 'PeriodicTable':
			return 4;
		case 'Preparing':
			return 5;
		case 'Match':
			return 6;
		case 'Celebration':
			return 7;
	
		default:
			return 0;
	}
}


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
	try { // покинуть hall
		await Promise.all( [ leaveRoom( player1, hallStr ), leaveRoom( player2, hallStr ) ] );
	} catch( error ) {
		log( 'Failed to start match', 'Error', `onInvite: startMatch: ${info1.name}, ${info2.name}` );
		log( error, 'error' );
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
		if( info.gameState === gameStateToNum( 'Preparing' ) ) { // состояние игры соответствующее
			if( info.gameInfo.readyPlayers === 2 ) { // оба игрока готовы продолжить игру
				const opInfo = clients.get( info.opponent );

				info.gameState = opInfo.gameState = gameStateToNum( 'Match' );
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
async function leaveTheMatch( id ) {
	const info = clients.get( id );

	if( info && info.gameState === gameStateToNum( 'Celebration' ) ) {

		try {
			await joinRoom( info.socket, hallStr );
		}
		catch( error ) {
			log( `Failed to join to HALL ( ${info.name} )`, 'Error', 'leaveTheMatch' );
			log( error, 'error' );
			return;
		}

		log( 'Joined the room "HALL"', `${info.name}`, 'leaveTheMatch' );

		info.resetGameInfo(); // сбросить информацию, касающуюся матча

		// извещение клиентов в hall о добавлении нового игрока
		info.socket.broadcast.to( hallStr ).emit( 'refreshResults', {
			'action': 'add', 
			'data': [ { 
				'id': id, 
				'name': info.name 
			} ] 
		} );

		let list = [];
		try { // отправка игроку списка неиграющих клиентов
			list = await getClientsInHall( id, false );
		}
		catch( error ) {
			log( `Failed to get client list after joining "HALL" ( ${info.name} )`, 'Error', 'leaveTheMatch' );
		}
		info.socket.emit( 'changeState', {
				'state': gameStateToNum( 'Online' ),
				'data': list
			});
	}
	else
		log( `Client information object is invalid or gameState is not celebration ( ${info} )`, 'LOG', 'leaveTheMatch' );
}



io.on( 'connect', function ( socket ) {
	log( `New client: ${socket.id}. Total connected clients: ${clients.size}`, 'Event' );
});


/**
 * Получить список игроков в hall, исключая клиента с myId, в формате [ ...{ id, name, bIsInvited, bIsInviting } ]
 * @param {String} myId id клиента, для которого формируется список
 * @param {Bool} bWithInvitations Нужно ли добавлять информацию о приглашениях
 */
function getClientsInHall( myId, bWithInvitations ) {
	return HALL.getClients()
	.then( ( clientIds ) => {
		if( clientIds.length === 0 )
			return clientIds;
		const clientList = [];
		cutElem( clientIds, myId );

		// проход по всем неиграющим клиентам и запись в результирующий массив их id и name
		for (const id of clientIds) {
			const info = clients.get( id );
			if( info != undefined )
				clientList.push( {'id': id, 'name': info.name} )
			else
				log( new Error( `There is no information about client ( ${id} )` ), 'error' );
		}

		// добавление в результат выдачи информации о приглашениях
		if( bWithInvitations ) {
			const myInviters = clients.get( myId ).inviters;
			for( const item of clientList ) {
				item.bIsInvited = clients.get( item.id ).inviters.has( myId );
				item.bIsInviting = myInviters.has( item.id );
			}
		}

		return clientList;
	})
	.catch( ( error ) => {
		log( error, 'error' );
		return [];
		});
}


io.on( 'connect', (socket) => {

	socket.on( 'disconnectMe', () => {
		socket.disconnect( true );
	} )

})

UE4.on( 'connect', function( socket ) {

	// Вывести сообщение о тм, что подключился новый пользователь
	log( `New client in 'UE4' namespace: ${socket.id}`, 'Event' );


	
	


	// Пользователь перешел в состояние Online, передает свое имя и ожидает список доступных соперников
	socket.on( 'registration', ( myName, callback ) => {

		const myId = socket.id;
		myName = myName.toString();
		const status = names.get( myName );
		if( typeof status !== 'undefined' && status )
			callback( false );
		else {
			callback( true );
			try {

				socket.join( hallStr, async ( error ) => {
					if( error ) {
						log( error, 'error' );
						socket.disconnect( true );
					}

					clients.set( myId, new ClientInfo( myName, socket ) );
					names.set( myName, true );
					const list = await getClientsInHall( myId, false );

					log( 'Client joined to the room "HALL"', `${myName}`, 'Registration' );

					// отправка клиенту списка неиграющих подключенных игроков
					socket.emit( 'changeState', {
						'state': gameStateToNum( 'Online' ),
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

				})

			} catch( error ) {
				log( error, 'error' );
				socket.disconnect( true );
			}
		}
	});


	// отправка клиенту списка неиграющих подключенных игроков
	socket.on( 'refreshList', async ( data, callback ) => {

		const info = clients.get( socket.id );
		log( 'The client asks for a list of all non-playing connected clients', `${info.name}`, 'RefreshList' );

		try {
			const list = await getClientsInHall( socket.id, true );
			callback( list );
		} catch (error) {
			log( `Failed to get list for client { ${info.name} }`, 'Error', 'onRefreshList' );
			log( error, 'error' );
			callback( [] );
		}
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

		if( myInfo.gameState == gameStateToNum( 'Online' ) && myInfo.gameState == opInfo.gameState ) {
			// если оба игрока пригласили друг друга, то можно начинать матч
			if( myInfo.inviters.delete( id ) ) {
				myInfo.opponent = id;
				opInfo.opponent = myId;
				myInfo.gameState = opInfo.gameState = gameStateToNum( 'PeriodicTable' );
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

		if( typeof info === 'undefined' ) {
			log( `Wants to fly away`, `${socket.id}`, 'FlyAway' );
			callback( { 'state': gameStateToNum( 'Offline' ) } );
			socket.disconnect( true );
			return;
		}

		log( `Client wants to fly away from ${info.gameState} state ( ${info.name} )`, 'LOG', 'onFlyAway' );

		switch (info.gameState) {
			case gameStateToNum( 'Online' ):
				// отдать команду на переход в offline состояние
				callback( { 'state': gameStateToNum( 'Offline' ) } );
				socket.disconnect( true );
				break;
			
			case gameStateToNum( 'Celebration'):
				log( new Error( 'Client try to fly away from invalid state' ), 'warn' );
				break;

			default:
				const celebration = gameStateToNum( 'Celebration' );
				const opInfo = clients.get( info.opponent );
				info.gameInfo.rightMove = '';
				info.gameInfo.winner = info.opponent;

				// перевести клиентов в состояние celebration, передав каждому его результат матча
				callback( {
					'state': celebration,
					'data': {
						'bIsWinner': false,
						'opponentElem': opInfo.chemicalElement
					}
				} );
				UE4.to( info.opponent ).emit( 'changeState', {
					'state': celebration,
					'data': {
						'bIsWinner': true,
						'opponentElem': info.chemicalElement
					}
				} );
				info.gameState = opInfo.gameState = celebration;
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

		if( info.gameState != gameStateToNum( 'PeriodicTable' ) ) {
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
		info.gameState = gameStateToNum( 'Preparing' );
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
		if( info.gameState != gameStateToNum( 'Match' ) ) {
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
		if( info.gameState != gameStateToNum( 'Match' ) ) {
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

		const celebration = gameStateToNum( 'Celebration' );
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
				if( info.gameState === gameStateToNum( 'Online' ) ) {
					if( clients.size > 1 )
						deleteFromLists( socket.id );
				}
				else { // оповестить противника и перевести его в состояние Celebration
					if( info.opponent != '' ) { // если еще есть противник
						const opInfo = clients.get( info.opponent );
						const celebration = gameStateToNum( 'Celebration' );

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





PeriodicTable.getChemicalElementObject = ( name, symbol, config ) => {
	return { 'name': name, 'symbol': symbol, 'config': new ElemConfig( config ) };
}


PeriodicTable.initTable = () => {
		PeriodicTable.table[1]  = PeriodicTable.getChemicalElementObject( 'hydrogen', 		'H',  [ 1, 0, 0, 0 ] );
		PeriodicTable.table[2]  = PeriodicTable.getChemicalElementObject( 'helium', 		'He', [ 3, 0, 0, 0 ] );
		PeriodicTable.table[3]  = PeriodicTable.getChemicalElementObject( 'lithium', 		'Li', [ 7, 0, 0, 0 ] );
		PeriodicTable.table[4]  = PeriodicTable.getChemicalElementObject( 'beryllium', 		'Be', [ 15, 0, 0, 0 ] );
		PeriodicTable.table[5]  = PeriodicTable.getChemicalElementObject( 'boron', 			'B',  [ 31, 0, 0, 0 ] );
		PeriodicTable.table[6]  = PeriodicTable.getChemicalElementObject( 'carbon', 		'C',  [ 95, 0, 0, 0 ] );
		PeriodicTable.table[7]  = PeriodicTable.getChemicalElementObject( 'nitrogen', 		'N',  [ 351, 0, 0, 0 ] );
		PeriodicTable.table[8]  = PeriodicTable.getChemicalElementObject( 'oxygen', 		'O',  [ 383, 0, 0, 0 ] );
		PeriodicTable.table[9]  = PeriodicTable.getChemicalElementObject( 'fluorine', 		'F',  [ 511, 0, 0, 0 ] );
		PeriodicTable.table[10] = PeriodicTable.getChemicalElementObject( 'neon', 			'Ne', [ 1023, 0, 0, 0 ] );
		PeriodicTable.table[11] = PeriodicTable.getChemicalElementObject( 'sodium', 		'Na', [ 2047, 0, 0, 0 ] );
		PeriodicTable.table[12] = PeriodicTable.getChemicalElementObject( 'magnesium', 		'Mg', [ 4095, 0, 0, 0 ] );
		PeriodicTable.table[13] = PeriodicTable.getChemicalElementObject( 'aluminium', 		'Al', [ 8191, 0, 0, 0 ] );
		PeriodicTable.table[14] = PeriodicTable.getChemicalElementObject( 'silicon', 		'Si', [ 24575, 0, 0, 0 ] );
		PeriodicTable.table[15] = PeriodicTable.getChemicalElementObject( 'phosphorus', 	'P',  [ 90111, 0, 0, 0 ] );
		PeriodicTable.table[16] = PeriodicTable.getChemicalElementObject( 'sulfur', 		'S',  [ 98303, 0, 0, 0 ] );
		PeriodicTable.table[17] = PeriodicTable.getChemicalElementObject( 'chlorine', 		'Cl', [ 131071, 0, 0, 0 ] );
		PeriodicTable.table[18] = PeriodicTable.getChemicalElementObject( 'argon', 			'Ar', [ 262143, 0, 0, 0 ] );
		PeriodicTable.table[19] = PeriodicTable.getChemicalElementObject( 'potassium', 		'K',  [ 524287, 0, 0, 0 ] );
		PeriodicTable.table[20] = PeriodicTable.getChemicalElementObject( 'calcium', 		'Ca', [ 1048575, 0, 0, 0 ] );
		PeriodicTable.table[21] = PeriodicTable.getChemicalElementObject( 'scandium', 		'Sc', [ 2097151, 0, 0, 0 ] );
		PeriodicTable.table[22] = PeriodicTable.getChemicalElementObject( 'titanium', 		'Ti', [ 6291455, 0, 0, 0 ] );
		PeriodicTable.table[23] = PeriodicTable.getChemicalElementObject( 'vanadium', 		'V',  [ 23068671, 0, 0, 0 ] );
		PeriodicTable.table[24] = PeriodicTable.getChemicalElementObject( 'chromium', 		'Cr', [ 358088703, 0, 0, 0 ] );
		PeriodicTable.table[25] = PeriodicTable.getChemicalElementObject( 'manganese', 		'Mn', [ 358612991, 0, 0, 0 ] );
		PeriodicTable.table[26] = PeriodicTable.getChemicalElementObject( 'iron', 			'Fe', [ 360710143, 0, 0, 0 ] );
		PeriodicTable.table[27] = PeriodicTable.getChemicalElementObject( 'cobalt', 		'Co', [ 369098751, 0, 0, 0 ] );
		PeriodicTable.table[28] = PeriodicTable.getChemicalElementObject( 'nickel', 		'Ni', [ 402653183, 0, 0, 0 ] );
		PeriodicTable.table[29] = PeriodicTable.getChemicalElementObject( 'copper', 		'Cu', [ 1073217535, 0, 0, 0 ] );
		PeriodicTable.table[30] = PeriodicTable.getChemicalElementObject( 'zinc', 			'Zn', [ 1073741823, 0, 0, 0 ] );
		PeriodicTable.table[31] = PeriodicTable.getChemicalElementObject( 'gallium', 		'Ga', [ 2147483647, 0, 0, 0 ] );
		PeriodicTable.table[32] = PeriodicTable.getChemicalElementObject( 'germanium', 		'Ge', [ 2147483647, 1, 0, 0 ] );
		PeriodicTable.table[33] = PeriodicTable.getChemicalElementObject( 'arsenic', 		'As', [ 2147483647, 5, 0, 0 ] );
		PeriodicTable.table[34] = PeriodicTable.getChemicalElementObject( 'selenium', 		'Se', [ -1, 5, 0, 0 ] );
		PeriodicTable.table[35] = PeriodicTable.getChemicalElementObject( 'bromine', 		'Br', [ -1, 7, 0, 0 ] );
		PeriodicTable.table[36] = PeriodicTable.getChemicalElementObject( 'krypton', 		'Kr', [ -1, 15, 0, 0 ] );
		PeriodicTable.table[37] = PeriodicTable.getChemicalElementObject( 'rubidium', 		'Rb', [ -1, 31, 0, 0 ] );
		PeriodicTable.table[38] = PeriodicTable.getChemicalElementObject( 'strontium', 		'Sr', [ -1, 63, 0, 0 ] );
		PeriodicTable.table[39] = PeriodicTable.getChemicalElementObject( 'yttrium', 		'Y',  [ -1, 127, 0, 0 ] );
		PeriodicTable.table[40] = PeriodicTable.getChemicalElementObject( 'zirconium', 		'Zr', [ -1, 383, 0, 0 ] );
		PeriodicTable.table[41] = PeriodicTable.getChemicalElementObject( 'niobium', 		'Nb', [ -1, 5471, 0, 0 ] );
		PeriodicTable.table[42] = PeriodicTable.getChemicalElementObject( 'molybdenum', 	'Mo', [ -1, 21855, 0, 0 ] );
		PeriodicTable.table[43] = PeriodicTable.getChemicalElementObject( 'technetium', 	'Tc', [ -1, 21887, 0, 0 ] );
		PeriodicTable.table[44] = PeriodicTable.getChemicalElementObject( 'ruthenium', 		'Ru', [ -1, 22495, 0, 0 ] );
		PeriodicTable.table[45] = PeriodicTable.getChemicalElementObject( 'rhodium', 		'Rh', [ -1, 24543, 0, 0 ] );
		PeriodicTable.table[46] = PeriodicTable.getChemicalElementObject( 'palladium', 		'Pd', [ -1, 65487, 0, 0 ] );
		PeriodicTable.table[47] = PeriodicTable.getChemicalElementObject( 'silver', 		'Ag', [ -1, 65503, 0, 0 ] );
		PeriodicTable.table[48] = PeriodicTable.getChemicalElementObject( 'cadmium', 		'Cd', [ -1, 65535, 0, 0 ] );
		PeriodicTable.table[49] = PeriodicTable.getChemicalElementObject( 'indium', 		'In', [ -1, 131071, 0, 0 ] );
		PeriodicTable.table[50] = PeriodicTable.getChemicalElementObject( 'tin', 			'Sn', [ -1, 393215, 0, 0 ] );
		PeriodicTable.table[51] = PeriodicTable.getChemicalElementObject( 'antimony', 		'Sb', [ -1, 1441791, 0, 0 ] );
		PeriodicTable.table[52] = PeriodicTable.getChemicalElementObject( 'tellurium', 		'Te', [ -1, 1572863, 0, 0 ] );
		PeriodicTable.table[53] = PeriodicTable.getChemicalElementObject( 'iodine', 		'I',  [ -1, 2097151, 0, 0 ] );
		PeriodicTable.table[54] = PeriodicTable.getChemicalElementObject( 'xenon', 			'Xe', [ -1, 4194303, 0, 0 ] );
		PeriodicTable.table[55] = PeriodicTable.getChemicalElementObject( 'caesium', 		'Cs', [ -1, 8388607, 0, 0 ] );
		PeriodicTable.table[56] = PeriodicTable.getChemicalElementObject( 'barium', 		'Ba', [ -1, 16777215, 0, 0 ] );
		PeriodicTable.table[57] = PeriodicTable.getChemicalElementObject( 'lanthanum', 		'La', [ -1, 16777215, 64, 0 ] );
		PeriodicTable.table[58] = PeriodicTable.getChemicalElementObject( 'cerium', 		'Ce', [ -1, 33554431, 64, 0 ] );
		PeriodicTable.table[59] = PeriodicTable.getChemicalElementObject( 'praseodymium',	'Pr', [ -1, 369098751, 0, 0 ] );
		PeriodicTable.table[60] = PeriodicTable.getChemicalElementObject( 'neodymium', 		'Nd', [ -1, 1442840575, 0, 0 ] );
		PeriodicTable.table[61] = PeriodicTable.getChemicalElementObject( 'promethium', 	'Pm', [ -1, 1442840575, 1, 0 ] );
		PeriodicTable.table[62] = PeriodicTable.getChemicalElementObject( 'samarium', 		'Sm', [ -1, 1442840575, 5, 0 ] );
		PeriodicTable.table[63] = PeriodicTable.getChemicalElementObject( 'europium', 		'Eu', [ -1, 1442840575, 21, 0 ] );
		PeriodicTable.table[64] = PeriodicTable.getChemicalElementObject( 'gadolinium', 	'Gb', [ -1, 1442840575, 85, 0 ] );
		PeriodicTable.table[65] = PeriodicTable.getChemicalElementObject( 'terbium', 		'Tb', [ -1, 1610612735, 21, 0 ] );
		PeriodicTable.table[66] = PeriodicTable.getChemicalElementObject( 'dysprosium', 	'Dy', [ -1, 2147483647, 21, 0 ] );
		PeriodicTable.table[67] = PeriodicTable.getChemicalElementObject( 'holmium', 		'Ho', [ -1, -1, 21, 0 ] );
		PeriodicTable.table[68] = PeriodicTable.getChemicalElementObject( 'erbium', 		'Er', [ -1, -1, 23, 0 ] );
		PeriodicTable.table[69] = PeriodicTable.getChemicalElementObject( 'thulium', 		'Tm', [ -1, -1, 31, 0 ] );
		PeriodicTable.table[70] = PeriodicTable.getChemicalElementObject( 'ytterbium', 		'Yb', [ -1, -1, 63, 0 ] );
		PeriodicTable.table[71] = PeriodicTable.getChemicalElementObject( 'lutetium', 		'Lu', [ -1, -1, 127, 0 ] );
		PeriodicTable.table[72] = PeriodicTable.getChemicalElementObject( 'hafnium', 		'Hf', [ -1, -1, 383, 0 ] );
		PeriodicTable.table[73] = PeriodicTable.getChemicalElementObject( 'tantalum', 		'Ta', [ -1, -1, 1407, 0 ] );
		PeriodicTable.table[74] = PeriodicTable.getChemicalElementObject( 'tungsten', 		'W',  [ -1, -1, 5503, 0 ] );
		PeriodicTable.table[75] = PeriodicTable.getChemicalElementObject( 'rhenium', 		'Re', [ -1, -1, 21887, 0 ] );
		PeriodicTable.table[76] = PeriodicTable.getChemicalElementObject( 'osmium', 		'Os', [ -1, -1, 22015, 0 ] );
		PeriodicTable.table[77] = PeriodicTable.getChemicalElementObject( 'iridium', 		'Ir', [ -1, -1, 22527, 0 ] );
		PeriodicTable.table[78] = PeriodicTable.getChemicalElementObject( 'platinum', 		'Pt', [ -1, -1, 32765, 0 ] );
		PeriodicTable.table[79] = PeriodicTable.getChemicalElementObject( 'gold', 			'Au', [ -1, -1, 65533, 0 ] );
		PeriodicTable.table[80] = PeriodicTable.getChemicalElementObject( 'mercury', 		'Hg', [ -1, -1, 65535, 0 ] );
		PeriodicTable.table[81] = PeriodicTable.getChemicalElementObject( 'thallium', 		'Tl', [ -1, -1, 131071, 0 ] );
		PeriodicTable.table[82] = PeriodicTable.getChemicalElementObject( 'lead', 			'Pb', [ -1, -1, 393215, 0 ] );
		PeriodicTable.table[83] = PeriodicTable.getChemicalElementObject( 'bismuth', 		'Bi', [ -1, -1, 1441791, 0 ] );
		PeriodicTable.table[84] = PeriodicTable.getChemicalElementObject( 'polonium', 		'Po', [ -1, -1, 1572863, 0 ] );
		PeriodicTable.table[85] = PeriodicTable.getChemicalElementObject( 'astatine', 		'At', [ -1, -1, 2097151, 0 ] );
		PeriodicTable.table[86] = PeriodicTable.getChemicalElementObject( 'radon', 			'Rn', [ -1, -1, 4194303, 0 ] );
		PeriodicTable.table[87] = PeriodicTable.getChemicalElementObject( 'francium', 		'Fr', [ -1, -1, 8388607, 0 ] );
		PeriodicTable.table[88] = PeriodicTable.getChemicalElementObject( 'radium', 		'Ra', [ -1, -1, 16777215, 0 ] );
		PeriodicTable.table[89] = PeriodicTable.getChemicalElementObject( 'actinium', 		'Ac', [ -1, -1, 16777215, 64 ] );
		PeriodicTable.table[90] = PeriodicTable.getChemicalElementObject( 'thorium', 		'Th', [ -1, -1, 83886079, 192 ] );
		PeriodicTable.table[91] = PeriodicTable.getChemicalElementObject( 'protactinium',	'Pa', [ -1, -1, 100663295, 64 ] );
		PeriodicTable.table[92] = PeriodicTable.getChemicalElementObject( 'uranium', 		'U',  [ -1, -1, 369098751, 64 ] );
		PeriodicTable.table[93] = PeriodicTable.getChemicalElementObject( 'neptunium', 		'Np', [ -1, -1, 1442840575, 64 ] );
		PeriodicTable.table[94] = PeriodicTable.getChemicalElementObject( 'plutonium', 		'Pu', [ -1, -1, 1442840575, 5 ] );
		PeriodicTable.table[95] = PeriodicTable.getChemicalElementObject( 'americium', 		'Am', [ -1, -1, 1442840575, 21 ] );
		PeriodicTable.table[96] = PeriodicTable.getChemicalElementObject( 'curium', 		'Cm', [ -1, -1, 1442840575, 85 ] );
		PeriodicTable.table[97] = PeriodicTable.getChemicalElementObject( 'berkelium', 		'Bk', [ -1, -1, 1610612735, 21 ] );
		PeriodicTable.table[98] = PeriodicTable.getChemicalElementObject( 'californium', 	'Cf', [ -1, -1, 2147483647, 21 ] );
		PeriodicTable.table[99] = PeriodicTable.getChemicalElementObject( 'einsteinium', 	'Es', [ -1, -1, -1, 21 ] );
		PeriodicTable.table[100] = PeriodicTable.getChemicalElementObject( 'fermium', 		'Fm', [ -1, -1, -1, 23 ] );
		PeriodicTable.table[101] = PeriodicTable.getChemicalElementObject( 'mendelevium',	'Md', [ -1, -1, -1, 31 ] );
		PeriodicTable.table[102] = PeriodicTable.getChemicalElementObject( 'nobelium', 		'No', [ -1, -1, -1, 63 ] );
		PeriodicTable.table[103] = PeriodicTable.getChemicalElementObject( 'lawrencium', 	'Lr', [ -1, -1, -1, 65599 ] );
		PeriodicTable.table[104] = PeriodicTable.getChemicalElementObject( 'rutherfordium',	'Rf', [ -1, -1, -1, 383 ] );
		PeriodicTable.table[105] = PeriodicTable.getChemicalElementObject( 'dubnium', 		'Db', [ -1, -1, -1, 1407 ] );
		PeriodicTable.table[106] = PeriodicTable.getChemicalElementObject( 'seaborgium', 	'Sg', [ -1, -1, -1, 5503 ] );
		PeriodicTable.table[107] = PeriodicTable.getChemicalElementObject( 'bohrium', 		'Bh', [ -1, -1, -1, 21887 ] );
		PeriodicTable.table[108] = PeriodicTable.getChemicalElementObject( 'hassium', 		'Hs', [ -1, -1, -1, 22015 ] );
		PeriodicTable.table[109] = PeriodicTable.getChemicalElementObject( 'meitnerium', 	'Mt', [ -1, -1, -1, 22527 ] );
		PeriodicTable.table[110] = PeriodicTable.getChemicalElementObject( 'darmstadtium',	'Ds', [ -1, -1, -1, 24575 ] );
		PeriodicTable.table[111] = PeriodicTable.getChemicalElementObject( 'roentgenium',	'Rg', [ -1, -1, -1, 32767 ] );
		PeriodicTable.table[112] = PeriodicTable.getChemicalElementObject( 'copernicium',	'Cn', [ -1, -1, -1, 65535 ] );
		PeriodicTable.table[113] = PeriodicTable.getChemicalElementObject( 'nihonium', 		'Nh', [ -1, -1, -1, 131071 ] );
		PeriodicTable.table[114] = PeriodicTable.getChemicalElementObject( 'flerovium', 	'Fl', [ -1, -1, -1, 393215 ] );
		PeriodicTable.table[115] = PeriodicTable.getChemicalElementObject( 'moscovium', 	'Mc', [ -1, -1, -1, 1441791 ] );
		PeriodicTable.table[116] = PeriodicTable.getChemicalElementObject( 'livermorium',	'Lv', [ -1, -1, -1, 1572863 ] );
		PeriodicTable.table[117] = PeriodicTable.getChemicalElementObject( 'tennessine', 	'Ts', [ -1, -1, -1, 2097151 ] );
		PeriodicTable.table[118] = PeriodicTable.getChemicalElementObject( 'oganesson', 	'Og', [ -1, -1, -1, 4194303 ] );
}

PeriodicTable.table = null;
PeriodicTable.init();


// ===============================================================================================
// ===============================================================================================
} catch( error ) {
	log( 'Error', error.stack );
}