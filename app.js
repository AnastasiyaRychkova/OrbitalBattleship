const PORT = 8081;	 // порт
const clients = new Map(); // контейнер для хранения сокета клиента (key) и информации о нем (value)
const hallStr = 'hall'; // имя комнаты, в которую добавляются все, кто online, но еще не играет
const waitingTime = { // время ожидания перехода в следующее состояние
	'preparing': 5000,
	'celebration': 120000
}; 
var roomCounter = 0; // счетчик созданных комнат


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
		console.log( `${type}: ${path != undefined ? (path + ': ') : ''}${message}` );
	}
}


// ===============================================================================================
// ===============================================================================================
try {

// Создание сервера, слушающего заданный порт
const io = require('socket.io')(PORT);

const UE4 = io.of( '/ue4' ); // namespace, в котором находятся все играющие клиенты
const HALL = UE4.in( hallStr ); // комната, в которую добавляются все, кто online, но еще не играет



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
		if( !( elem1 instanceof ElemConfig ) ||!( elem2 instanceof ElemConfig ) || elem1.length != 4 || elem2.length != 4 )
			return false;
		for( const i = 0; i < 4; i++ )
			if( elem1[i] != elem2[i] )
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
		return this.config[ ( ( num - 1 ) / 32 ) | 0 ] & mask;
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
		if( table == null ) {
			init();
		}
	}

	static table = null;

	static init() {
		table = new Array[119];
		initTable( table );
	}

	static _getChemicalElementObject( name, symbol, config ) {
		return { 'name': name, 'symbol': symbol, 'config': config };
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
		this.gameState 		= GameStateToNum( 'Online' );
		this.inviters 		= new Set();
		this.losses 		= 0;
		this.name 			= name;
		this.opponent 		= '';
		this.shots 			= null;
		this.socket 		= skt;
		this.team 			= -1;
		this.wins 			= 0;
	}

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

	constructor( roomName ) {
		this.room = roomName;
		this.readyPlayers = 0;
		this.rightMove = null;
		this.winner = null;
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
			return 0;
			break;
		case 'Online':
			return 1;
			break;
		case 'PeriodicTable':
			return 2;
			break;
		case 'Preparing':
			return 3;
			break;
		case 'Match':
			return 4;
			break;
		case 'Celebration':
			return 5;
			break;
	
		default:
			return -1;
			break;
	}
}


/**
 * Перевести строковое представление команды в число
 * @param {String} team Название команды
 * @returns {Number} Численное представление команды
 */
function teamToNum( team ) {
	switch( team ) {
		case 'Azydy':
			return 0;
			break;
		case 'Galogeny':
			return 1;
			break;
	
		default:
			break;
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
async function startMatch( player1, player2 ) {
	roomCounter++;
	const roomName = 'r_' + roomCounter;
	
	try { // покинуть hall и перейти в свою комнату
		await leaveRoom( player1, hallStr );
		await leaveRoom( player2, hallStr );
		await joinRoom( player1, roomName );
		await joinRoom( player2, roomName );
	} catch( error ) {
		log( 'Failed to start match', 'Error', `onInvite: startMatch: ${roomName}` );
		log( error, 'error' );
	}

	// перевести игроков с состояние 'PeriodicTable'
	const info1 = clients.get( player1.id );
	const info2 = clients.get( player2 );
	info1.gameInfo = info2.gameInfo = new GameInfo( roomName );
	info1.socket.emit( 'changeState', { 'state': info1.gameState, 'data': { 'team': info.team } } );
	info2.socket.emit( 'changeState', { 'state': info2.gameState, 'data': { 'team': info.team } } );

	const list = [];
	try {
		list = await HALL.getClients();
	}
	catch ( error ) {
		log( 'Failed to inform clients about one started match', 'Error', 'startMatch' );
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
	const list = []
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
			if( info.GameInfo.readyPlayers === 2 ) { // оба игрока готовы продолжить игру
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
		
		info.resetGameInfo(); // сбросить информацию, касающуюся матча

		try {
			await leaveRoom( info.socket, info.gameInfo.room );
			await joinRoom( info.socket, hallStr );
		}
		catch( error ) {
			log( `Failed to leave the room ( ${info.gameInfo.room} ) or join to HALL ( ${id} )`, 'Error', 'releaseTheLosingPlayer' );
			log( error, 'error' );
			return;
		}

		log( `Client joined to the room "HALL" ( ${id} )`, 'LOG', 'releaseTheLosingPlayer' );

		// извещение клиентов в hall о добавлении нового игрока
		info.socket.broadcast.to( hallStr ).emit( 'refreshResults', {
			'action': 'add', 
			'data': [ { 
				'id': id, 
				'name': info.name 
			} ] 
		} );

		const list = [];
		try { // отправка игроку списка неиграющих клиентов
			list = await getClientsInHall( id, false );
			info.socket.emit( 'changeState', {
				'state': gameStateToNum( 'Online' ),
				'data': list
			});
		}
		catch( error ) {
			log( `Failed to get client list after joining "HALL" ( ${id} )`, 'Error', 'releaseTheLosingPlayer' );
		}
	}
	else
		log( new Error( `Client information object is invalid or gameState is not celebration ( ${info} )`), 'warn' );
}



io.on( 'connect', function ( socket ) {
	log( 'Event', "New client: " + socket.id );
});


PeriodicTable.init();


UE4.on( 'connect', function( socket ) {

	// Вывести сообщение о тм, что подключился новый пользователь
	log( 'Event', "New client in 'UE4' namespace: " + socket.id );
	// Отдать команду клиенту сменить состояние игры
	socket.emit( 'changeState', {'id': socket.id});


	/**
	 * Получить список игроков в hall, исключая клиента с myId, в формате [ ...{ id, name, bIsInvited, bIsInviting } ]
	 * @param {String} myId id клиента, для которого формируется список
	 * @param {Bool} bWithInvitations Нужно ли добавлять информацию о приглашениях
	 */
	function getClientsInHall( myId, bWithInvitations ) {
		return HALL.getClients()
		.then( ( clientIds ) => {
			if( clientIds.length === 0 )
				resolve( clientIds );
			const clientList = [];
			cutElem( clientIds, myId );

			// проход по всем неиграющим клиентам и запись в результирующий массив их id и name
			for (const id of clientIds) {
				const info = clients.get( id );
				if( info != unsigned )
					clientList.push( {'id': id, 'name': info.name} )
				else
					log( new Error( `There is no information about client ( ${id} )` ), 'error' );
			}

			// добавление в результат выдачи информации о приглашениях
			if( bWithInvitations ) {
				const inviters = clients.get( myId );
				for( const item of clientList ) {
					item.bIsInvited = clients.get( item.id ).inviters.has( myId );
					item.bIsInviting = inviters.has( item.id );
				}
			}

			resolve( clientList );
		})
		.catch( ( error ) => error );
	}
	


	// Пользователь перешел в состояние Online, передает свое имя и ожидает список доступных соперников
	socket.on( 'registration', ( myName, callback ) => {

		const myId = socket.id;

		try {

			socket.join( hallStr, async ( error ) => {

				log( `Client joined to the room "HALL" ( ${id} )`, 'LOG', 'onRegistration' );

				clients.set( myId, new ClientInfo( myName, socket ) );
				const list = await getClientsInHall( myId, false );

				// отправка клиенту списка неиграющих подключенных игроков
				callback( list );

				// извещение всех находящихся в комнате о присоединении нового клиента
				const data = { 'id': myId, 'name': myName };
				for (const item of list) {
					HALL.to( item.id ).emit( 'refreshResults', { 'action': 'add', 'data': [ data ] } );
				}

			})

		} catch( error ) {
			log( error, 'error' );
			callback( [] );
		}
	});


	// отправка клиенту списка неиграющих подключенных игроков
	socket.on( 'refreshList', async (callback) => {

		log( `The client asks for a list of all non-playing connected clients ( ${socket.id} )`, 'LOG', 'onRefreshList' );

		try {
			const list = await getClientsInHall( socket.id, true );
			callback( list );
		} catch (error) {
			log( `Failed to get list for client { ${socket.id} }`, 'Error', 'onRefreshList' );
			log( error, 'error' );
			callback( [] );
		}
	});


	// приглашение игрока ( id ) на начало матча
	socket.on( 'invite', ( {id} ) => {

		log( `Client ( ${socket.id} ) is inviting the client ( ${id} )`, 'LOG', 'onInvite' );

		const opInfo = clients.get( id );
		if( !opInfo ) { // существует ли вообще такой клиент
			log( new Error( `Trying to invite invalid client id ( ${id} )` ), 'error' );
			socket.emit( 'refreshResults', { 'action': 'remove', 'data': [ { 'id': id } ] } );
			return;
		}

		const myId = socket.id;
		const myInfo = clients.get( myId );

		if( myInfo.gameState === opInfo.gameState === gameStateToNum( 'Online' ) ) {
			// если оба игрока пригласили друг друга, то можно начинать матч
			if( myInfo.inviters.delete( id ) ) {
				myInfo.opponent = id;
				opInfo.opponent = myId;
				myInfo.gameState = op.gameState = gameStateToNum( 'PeriodicTable' );
				myInfo.team = Math.round( Math.random() );
				opInfo.team = myInfo.team ? 0 : 1;
				myInfo.inviters.clear();
				opInfo.inviters.clear();

				// присоединиться к игровой комнате и разослать всем клиентам в hall, что необходимо удалить две записи
				startMatch( socket, opInfo.socket );
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
			}
		}
		else { // Кто-то уже играет
			log( new Error( `Somebody is not online ( inviter state: ${myInfo.gameState}, inviting player state: ${opInfo.gameState} )` ), 'error' );
			socket.emit( 'refreshResults', {
				'action': 'remove',
				'data': [ { 'id': id } ]
			});
		}
	});


	// клиент хочет отсоединиться или закончить матч
	socket.on( 'flyAway', () => {
		log( `Client wants to fly away ( ${socket.id} )`, 'LOG', 'onFlyAway' );

		const info = clients.get( socket.id );

		switch (info.gameState) {
			case gameStateToNum( 'Online' ):
				// отдать команду на переход в offline состояние
				socket.emit( 'changeState', { 'state': gameStateToNum( 'Offline' ) } );
				socket.disconnect( true )
				break;
			
			case gameStateToNum( 'Celebration'):
				log( new Error( 'Client try to fly away from invalid state' ), 'warn' );
				break;

			default:
				const celebration = gameStateToNum( 'Celebration' );
				const opInfo = clients.get( info.opponent );

				// перевести клиентов в состояние celebration, передав каждому его результат матча
				socket.emit( 'changeState', {
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
	socket.on( 'elemSelection', ( {number} ) => {
		const myId = socket.id;
		const info = clients.get( myId );

		if( info.gameState != gameStateToNum( 'PeriodicTable' ) ) {
			log( `Event instigator does not have appropriate rights ( 'id': ${myId}, 'state': ${info.gameState} )`, 'Cheater', 'elemSelection' );
			return;
		}

		if( number < 1 || number > 118 ) {
			log( `Player selected invalid element ( 'id': ${myId}, 'number': ${number} )`, 'LOG', 'elemSelection' );
			return;
		}

		log( `Player selected element ( 'id': ${myId}, 'number': ${number} )`, 'LOG', 'elemSelection' );

		info.chemicalElement.number = number;
		info.chemicalElement.element = PeriodicTable.table[ number ];
		info.gameState = gameStateToNum( 'Preparing' );
		info.diagramState = new ElemConfig();

		socket.emit( 'changeState', { 'state': info.gameState } );
	} );


	// проверить заполнение диаграммы
	socket.on( 'checkConfig', ( { data } ) => {
		const diagram = new ElemConfig( data );
		if( diagram.config[0] == 0 ) { // проверка типа пришедших данных
			log( `Invalid data type ( 'data': ${data} )`, 'Error', 'onCheckConfig' );
			socket.emit( 'checkResult', { 'result': false } );
			return;
		}

		log( `Checking the diagram ( 'id': ${socket.id}, 'diagram': ${diagram} )`, 'LOG', 'onCheckConfig' );

		const info = clients.get( socket.id );
		info.diagramState = diagram;

		// сравнить диаграмму и конфигурацию загаданного элемента
		if( ElemConfig.isEqual( diagram, info.chemicalElement.element.config ) ) { // правильно
			info.gameInfo.readyPlayers++;
			log( `Checking the diagram ( 'id': ${socket.id}, 'result': true, 'ready': ${info.gameInfo.readyPlayers} )`, 'LOG', 'onCheckConfig' );
			socket.emit( 'checkResult', { 'result': true } );

			// подождать и перевести обоих в следующее состояние
			setTimeout( toMatch, waitingTime.preparing, socket.id );
		}
		else { // неправильно
			socket.emit( 'checkResult', { 'result': false } );
		}
	})


	// выстрел во время матча
	socket.on( 'shot', ( { number }, callback ) => {
		const myId = socket.id;
		const info = clients.get( myId );

		// действительно ли сейчас матч
		if( info.gameState != gameStateToNum( 'Match' ) ) {
			log( `Event instigator is in an invalid state ( 'id': ${myId}, 'state': ${info.gameState} )`, 'Cheater', 'onShot' );
			callback( false );
			return;
		}

		// имеет ли игрок право хода
		if( info.gameInfo.rightMove != myId ) {
			log( `Event instigator does not have appropriate rights ( 'id': ${myId} )`, 'Cheater', 'onShot' );
			callback( false );
			return;
		}

		log( `Shot >> ${number} ( ${myId} )`, 'LOG', 'onShot' );

		// отправить результат выстрела стрелявшему и сообщить о выстреле оппоненту
		const opInfo = clients.get( info.opponent );
		callback( opInfo.chemicalElement.element.config.hasSpin( number ) );
		opInfo.socket.emit( 'shot', { 'number': number } );

		// запомнить выстрел
		info.shots.write( number, true );

	} );


	


	// победитель подтверждает окончание матча
	socket.on( 'endGame', () => {
		const myId = socket.id;
		const info = clients.get( myId );

		if( info.gameInfo.winner != myId ) {
			log( `Event instigator does not have appropriate rights ${myId}`, 'Cheater', 'onEndGame' );
			return;
		}

		log( 'Winner confirmed the end of game', 'LOG', 'onEndGame' );

		// перевести в состояние online сначала оппонента, если есть, а затем перевести себя
		if( info.opponent != '' )
			leaveTheMatch( info.opponent );

		leaveTheMatch( myId );
	} );


	// отключение клиента от сервера
	socket.on( 'disconnect', ( reason ) => {
		log( `Client disconnected ( ${socket.id} ): ${reason}`, 'LOG', 'onDisconnect' );
		const info = clients.get( socket.id );

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
			clients.delete( socket.id );
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






























function initTable( table ) {
		table[1]  = PeriodicTable._getChemicalElementObject( 'hydrogen', 		'H',  [1, 			0, 			0, 			0] );
		table[2]  = PeriodicTable._getChemicalElementObject( 'helium', 			'He', [3, 			0, 			0, 			0] );
		table[3]  = PeriodicTable._getChemicalElementObject( 'lithium', 		'Li', [7, 			0, 			0, 			0] );
		table[4]  = PeriodicTable._getChemicalElementObject( 'beryllium', 		'Be', [15, 			0, 			0, 			0] );
		table[5]  = PeriodicTable._getChemicalElementObject( 'boron', 			'B',  [31, 			0, 			0, 			0] );
		table[6]  = PeriodicTable._getChemicalElementObject( 'carbon', 			'C',  [95,  		0, 			0, 			0] );
		table[7]  = PeriodicTable._getChemicalElementObject( 'nitrogen', 		'N',  [351, 		0, 			0, 			0] );
		table[8]  = PeriodicTable._getChemicalElementObject( 'oxygen', 			'O',  [383, 		0, 			0, 			0] );
		table[9]  = PeriodicTable._getChemicalElementObject( 'fluorine', 		'F',  [511, 		0, 			0, 			0] );
		table[10] = PeriodicTable._getChemicalElementObject( 'neon', 			'Ne', [1023, 		0, 			0, 			0] );
		table[11] = PeriodicTable._getChemicalElementObject( 'sodium', 			'Na', [2047, 		0, 			0, 			0] );
		table[12] = PeriodicTable._getChemicalElementObject( 'magnesium', 		'Mg', [4095, 		0, 			0, 			0] );
		table[13] = PeriodicTable._getChemicalElementObject( 'aluminium', 		'Al', [8191, 		0, 			0, 			0] );
		table[14] = PeriodicTable._getChemicalElementObject( 'silicon', 		'Si', [24575,		0, 			0, 			0] );
		table[15] = PeriodicTable._getChemicalElementObject( 'phosphorus', 		'P',  [90111,		0, 			0, 			0] );
		table[16] = PeriodicTable._getChemicalElementObject( 'sulfur', 			'S',  [98303,		0, 			0, 			0] );
		table[17] = PeriodicTable._getChemicalElementObject( 'chlorine', 		'Cl', [131071,		0, 			0, 			0] );
		table[18] = PeriodicTable._getChemicalElementObject( 'argon', 			'Ar', [262143,		0, 			0, 			0] );
		table[19] = PeriodicTable._getChemicalElementObject( 'potassium', 		'K',  [524287,		0, 			0, 			0] );
		table[20] = PeriodicTable._getChemicalElementObject( 'calcium', 		'Ca', [1048575,		0, 			0, 			0] );
		table[21] = PeriodicTable._getChemicalElementObject( 'scandium', 		'Sc', [2097151,		0, 			0, 			0] );
		table[22] = PeriodicTable._getChemicalElementObject( 'titanium', 		'Ti', [6291455,		0, 			0, 			0] );
		table[23] = PeriodicTable._getChemicalElementObject( 'vanadium', 		'V',  [23068671,	0, 			0, 			0] );
		table[24] = PeriodicTable._getChemicalElementObject( 'chromium', 		'Cr', [358088703,	0, 			0, 			0] );
		table[25] = PeriodicTable._getChemicalElementObject( 'manganese', 		'Mn', [358612991,	0, 			0, 			0] );
		table[26] = PeriodicTable._getChemicalElementObject( 'iron', 			'Fe', [, 			0, 			0, 			0] );
		table[27] = PeriodicTable._getChemicalElementObject( 'cobalt', 			'Co', [, 			0, 			0, 			0] );
		table[28] = PeriodicTable._getChemicalElementObject( 'nickel', 			'Ni', [, 			0, 			0, 			0] );
		table[29] = PeriodicTable._getChemicalElementObject( 'copper', 			'Cu', [1073217535,	0, 			0, 			0] );
		table[30] = PeriodicTable._getChemicalElementObject( 'zinc', 			'Zn', [, 			0, 			0, 			0] );
		table[31] = PeriodicTable._getChemicalElementObject( 'gallium', 		'Ga', [, 			0, 			0, 			0] );
		table[32] = PeriodicTable._getChemicalElementObject( 'germanium', 		'Ge', [, 			, 			0, 			0] );
		table[33] = PeriodicTable._getChemicalElementObject( 'arsenic', 		'As', [, 			, 			0, 			0] );
		table[34] = PeriodicTable._getChemicalElementObject( 'selenium', 		'Se', [-1, 			, 			0, 			0] );
		table[35] = PeriodicTable._getChemicalElementObject( 'bromine', 		'Br', [-1, 			, 			0, 			0] );
		table[36] = PeriodicTable._getChemicalElementObject( 'krypton', 		'Kr', [-1, 			, 			0, 			0] );
		table[37] = PeriodicTable._getChemicalElementObject( 'rubidium', 		'Rb', [-1, 			, 			0, 			0] );
		table[38] = PeriodicTable._getChemicalElementObject( 'strontium', 		'Sr', [-1, 			, 			0, 			0] );
		table[39] = PeriodicTable._getChemicalElementObject( 'yttrium', 		'Y',  [-1, 			, 			0, 			0] );
		table[40] = PeriodicTable._getChemicalElementObject( 'zirconium', 		'Zr', [-1, 			, 			0, 			0] );
		table[41] = PeriodicTable._getChemicalElementObject( 'niobium', 		'Nb', [-1, 			, 			0, 			0] );
		table[42] = PeriodicTable._getChemicalElementObject( 'molybdenum', 		'Mo', [-1, 			, 			0, 			0] );
		table[43] = PeriodicTable._getChemicalElementObject( 'technetium', 		'Tc', [-1, 			, 			0, 			0] );
		table[44] = PeriodicTable._getChemicalElementObject( 'ruthenium', 		'Ru', [-1, 			, 			0, 			0] );
		table[45] = PeriodicTable._getChemicalElementObject( 'rhodium', 		'Rh', [-1, 			, 			0, 			0] );
		table[46] = PeriodicTable._getChemicalElementObject( 'palladium', 		'Pd', [-1, 			, 			0, 			0] );
		table[47] = PeriodicTable._getChemicalElementObject( 'silver', 			'Ag', [-1, 			, 			0, 			0] );
		table[48] = PeriodicTable._getChemicalElementObject( 'cadmium', 		'Cd', [-1, 			, 			0, 			0] );
		table[49] = PeriodicTable._getChemicalElementObject( 'indium', 			'In', [-1, 			, 			0, 			0] );
		table[50] = PeriodicTable._getChemicalElementObject( 'tin', 			'Sn', [-1, 			, 			0, 			0] );
		table[51] = PeriodicTable._getChemicalElementObject( 'antimony', 		'Sb', [-1, 			, 			0, 			0] );
		table[52] = PeriodicTable._getChemicalElementObject( 'tellurium', 		'Te', [-1, 			, 			0, 			0] );
		table[53] = PeriodicTable._getChemicalElementObject( 'iodine', 			'I',  [-1, 			, 			0, 			0] );
		table[54] = PeriodicTable._getChemicalElementObject( 'xenon', 			'Xe', [-1, 			, 			0, 			0] );
		table[55] = PeriodicTable._getChemicalElementObject( 'caesium', 		'Cs', [-1, 			, 			0, 			0] );
		table[56] = PeriodicTable._getChemicalElementObject( 'barium', 			'Ba', [-1, 			, 			0, 			0] );
		table[57] = PeriodicTable._getChemicalElementObject( 'lanthanum', 		'La', [-1, 			, 			, 			0] );
		table[58] = PeriodicTable._getChemicalElementObject( 'cerium', 			'Ce', [-1, 			, 			, 			0] );
		table[59] = PeriodicTable._getChemicalElementObject( 'praseodymium',	'Pr', [-1, 			, 			0, 			0] );
		table[60] = PeriodicTable._getChemicalElementObject( 'neodymium', 		'Nd', [-1, 			, 			0, 			0] );
		table[61] = PeriodicTable._getChemicalElementObject( 'promethium', 		'Pm', [-1, 			, 			, 			0] );
		table[62] = PeriodicTable._getChemicalElementObject( 'samarium', 		'Sm', [-1, 			, 			, 			0] );
		table[63] = PeriodicTable._getChemicalElementObject( 'europium', 		'Eu', [-1, 			, 			, 			0] );
		table[64] = PeriodicTable._getChemicalElementObject( 'gadolinium', 		'Gb', [-1, 			, 			, 			0] );
		table[65] = PeriodicTable._getChemicalElementObject( 'terbium', 		'Tb', [-1, 			, 			, 			0] );
		table[66] = PeriodicTable._getChemicalElementObject( 'dysprosium', 		'Dy', [-1, 			, 			, 			0] );
		table[67] = PeriodicTable._getChemicalElementObject( 'holmium', 		'Ho', [-1, 			-1, 		, 			0] );
		table[68] = PeriodicTable._getChemicalElementObject( 'erbium', 			'Er', [-1, 			-1, 		, 			0] );
		table[69] = PeriodicTable._getChemicalElementObject( 'thulium', 		'Tm', [-1, 			-1, 		, 			0] );
		table[70] = PeriodicTable._getChemicalElementObject( 'ytterbium', 		'Yb', [-1, 			-1, 		, 			0] );
		table[71] = PeriodicTable._getChemicalElementObject( 'lutetium', 		'Lu', [-1, 			-1, 		, 			0] );
		table[72] = PeriodicTable._getChemicalElementObject( 'hafnium', 		'Hf', [-1, 			-1, 		, 			0] );
		table[73] = PeriodicTable._getChemicalElementObject( 'tantalum', 		'Ta', [-1, 			-1, 		, 			0] );
		table[74] = PeriodicTable._getChemicalElementObject( 'tungsten', 		'W',  [-1, 			-1, 		, 			0] );
		table[75] = PeriodicTable._getChemicalElementObject( 'rhenium', 		'Re', [-1, 			-1, 		, 			0] );
		table[76] = PeriodicTable._getChemicalElementObject( 'osmium', 			'Os', [-1, 			-1, 		, 			0] );
		table[77] = PeriodicTable._getChemicalElementObject( 'iridium', 		'Ir', [-1, 			-1, 		, 			0] );
		table[78] = PeriodicTable._getChemicalElementObject( 'platinum', 		'Pt', [-1, 			-1, 		, 			0] );
		table[79] = PeriodicTable._getChemicalElementObject( 'gold', 			'Au', [-1, 			-1, 		, 			0] );
		table[80] = PeriodicTable._getChemicalElementObject( 'mercury', 		'Hg', [-1, 			-1, 		, 			0] );
		table[81] = PeriodicTable._getChemicalElementObject( 'thallium', 		'Tl', [-1, 			-1, 		, 			0] );
		table[82] = PeriodicTable._getChemicalElementObject( 'lead', 			'Pb', [-1, 			-1, 		, 			0] );
		table[83] = PeriodicTable._getChemicalElementObject( 'bismuth', 		'Bi', [-1, 			-1, 		, 			0] );
		table[84] = PeriodicTable._getChemicalElementObject( 'polonium', 		'Po', [-1, 			-1, 		, 			0] );
		table[85] = PeriodicTable._getChemicalElementObject( 'astatine', 		'At', [-1, 			-1, 		, 			0] );
		table[86] = PeriodicTable._getChemicalElementObject( 'radon', 			'Rn', [-1, 			-1, 		, 			0] );
		table[87] = PeriodicTable._getChemicalElementObject( 'francium', 		'Fr', [-1, 			-1, 		, 			0] );
		table[88] = PeriodicTable._getChemicalElementObject( 'radium', 			'Ra', [-1, 			-1, 		, 			0] );
		table[89] = PeriodicTable._getChemicalElementObject( 'actinium', 		'Ac', [-1, 			-1, 		, 			] );
		table[90] = PeriodicTable._getChemicalElementObject( 'thorium', 		'Th', [-1, 			-1, 		, 			] );
		table[91] = PeriodicTable._getChemicalElementObject( 'protactinium',	'Pa', [-1, 			-1, 		, 			] );
		table[92] = PeriodicTable._getChemicalElementObject( 'uranium', 		'U',  [-1, 			-1, 		, 			] );
		table[93] = PeriodicTable._getChemicalElementObject( 'neptunium', 		'Np', [-1, 			-1, 		, 			] );
		table[94] = PeriodicTable._getChemicalElementObject( 'plutonium', 		'Pu', [-1, 			-1, 		, 			] );
		table[95] = PeriodicTable._getChemicalElementObject( 'americium', 		'Am', [-1, 			-1, 		, 			] );
		table[96] = PeriodicTable._getChemicalElementObject( 'curium', 			'Cm', [-1, 			-1, 		, 			] );
		table[97] = PeriodicTable._getChemicalElementObject( 'berkelium', 		'Bk', [-1, 			-1, 		, 			] );
		table[98] = PeriodicTable._getChemicalElementObject( 'californium', 	'Cf', [-1, 			-1, 2147483647, 		21] );
		table[99] = PeriodicTable._getChemicalElementObject( 'einsteinium', 	'Es', [-1, 			-1,			-1, 		21] );
		table[100] = PeriodicTable._getChemicalElementObject( 'fermium', 		'Fm', [-1, 			-1, 		-1, 		] );
		table[101] = PeriodicTable._getChemicalElementObject( 'mendelevium',	'Md', [-1, 			-1, 		-1, 		] );
		table[102] = PeriodicTable._getChemicalElementObject( 'nobelium', 		'No', [-1, 			-1, 		-1, 		] );
		table[103] = PeriodicTable._getChemicalElementObject( 'lawrencium', 	'Lr', [-1, 			-1, 		-1, 		] );
		table[104] = PeriodicTable._getChemicalElementObject( 'rutherfordium',	'Rf', [-1, 			-1, 		-1, 		] );
		table[105] = PeriodicTable._getChemicalElementObject( 'dubnium', 		'Db', [-1, 			-1, 		-1, 		] );
		table[106] = PeriodicTable._getChemicalElementObject( 'seaborgium', 	'Sg', [-1, 			-1, 		-1, 		] );
		table[107] = PeriodicTable._getChemicalElementObject( 'bohrium', 		'Bh', [-1, 			-1, 		-1, 		] );
		table[108] = PeriodicTable._getChemicalElementObject( 'hassium', 		'Hs', [-1, 			-1, 		-1, 		] );
		table[109] = PeriodicTable._getChemicalElementObject( 'meitnerium', 	'Mt', [-1, 			-1, 		-1, 		] );
		table[110] = PeriodicTable._getChemicalElementObject( 'darmstadtium',	'Ds', [-1, 			-1, 		-1, 		] );
		table[111] = PeriodicTable._getChemicalElementObject( 'roentgenium',	'Rg', [-1, 			-1, 		-1, 		] );
		table[112] = PeriodicTable._getChemicalElementObject( 'copernicium',	'Cn', [-1, 			-1, 		-1, 		] );
		table[113] = PeriodicTable._getChemicalElementObject( 'nihonium', 		'Nh', [-1, 			-1, 		-1, 		] );
		table[114] = PeriodicTable._getChemicalElementObject( 'flerovium', 		'Fl', [-1, 			-1, 		-1, 		] );
		table[115] = PeriodicTable._getChemicalElementObject( 'moscovium', 		'Mc', [-1, 			-1, 		-1, 		] );
		table[116] = PeriodicTable._getChemicalElementObject( 'livermorium',	'Lv', [-1, 			-1, 		-1, 		] );
		table[117] = PeriodicTable._getChemicalElementObject( 'tennessine', 	'Ts', [-1, 			-1, 		-1, 		] );
		table[118] = PeriodicTable._getChemicalElementObject( 'oganesson', 		'Og', [-1, 			-1, 		-1, 		] );
}