const gameStateEnum = require('./gameState');

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
		this.gameState 		= gameStateEnum.Online;
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
	resetGameInfo( clients ) {
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
		this.gameState = gameStateEnum.Online;
		this.shots = null;
		this.team = -1;
	}

} // ---------------------------------------------

module.exports = ClientInfo;