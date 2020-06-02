import type { PlayerUpdInfo, PlayerGameInfo } from './types.js';
import type { UserInfo, Statistics, AdminUser } from '../../common/messages.js';

class UpdaterBase
{
	/**
	 * Обновить статус подключения клиента (online/offline)
	 * 
	 * @param name Имя клиента
	 * @param bIsOnline Статус подключения
	 * @param statistics Общая статистика игрока
	 */
	updateClient( name: string, bIsOnline: boolean, statistics?: Statistics, rating?: number ): void
	{
		console.log( 'Error: updateClient: Updater has no this method realization\n', name, bIsOnline, statistics, rating );
	}

	/**
	 * Обновить игровую информацию о клиенте
	 * 
	 * @param player Информация о клиенте, которую необходимо обновить
	 */
	updatePlayer( player: PlayerUpdInfo ): void
	{
		console.log( 'Error: updatePlayer: Updater has no this method realization\n', name, player );
	}

	/**
	 * Обновить счетчики игроков
	 * 
	 * @param total Количество игроков, о которых имеется информация на сервере
	 * @param online Количество online игроков
	 */
	updateClientCounter( online: number, total: number ): void
	{
		console.log( 'Error: updateClientCounter: Updater has no this method realization\n', total, online );
	}

	/**
	 * Показать или закрыть окно с диаграммой
	 * 
	 * @param newHidden Нужно ли скрыть окно
	 * @param info Если необходимо показать окно, то какой информацией необходимо его заполнить
	 */
	updateDiagramHidden( newHidden: boolean, info?: UserInfo ): void
	{
		console.log( 'Error: updateDiagramHidden: Updater has no this method realization\n', newHidden, info );
	}

	/**
	 * Создать новую игру, если она не существует, и обновить в противном случае
	 * 
	 * @param gameId ID новой игры
	 * @param player1 Первый участник
	 * @param player2 Второй участник
	 */
	newGame( gameId: string, player1: PlayerGameInfo, player2: PlayerGameInfo ): void
	{
		console.log( 'Error: newGame: Updater has no this method realization\n', gameId, player1, player2 );
	}

	/**
	 * Удалить запись об игроке
	 * 
	 * @param player Имя игрока
	 */
	removePlayer( name: string ): void
	{
		console.log( 'Error: removePlayer: Updater has no this method realization\n', name );
	}

	/**
	 * Сбросить к начальным значениям и отчистить списки
	 */
	clear(): void
	{
		console.log( 'Error: clear: Updater has no this method realization' );
	}

	/**
	 * Полностью обновить новыми данными
	 * 
	 * @param model Массив, хранящий профили всех клиентов
	 */
	reload( model: AdminUser[] ): void
	{
		console.log( 'Error: clear: Updater has no this method realization\nTotal: '+model.length );
	}
}

export default UpdaterBase;