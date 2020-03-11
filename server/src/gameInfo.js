/** =============================================
 * Информация об игре
 * ==============================================
 * @property {Number} readyPlayers количество игроков готовых перейти в следующее синхронное состояние игры
 * @property {String} rightMove игрок с правом хода
 * @property {String} winner победивший игрок
 */
class GameInfo {

	constructor() {
		this.readyPlayers = 0;
		this.rightMove = '';
		this.winner = '';
	}
} // ---------------------------------------------

module.exports = GameInfo;