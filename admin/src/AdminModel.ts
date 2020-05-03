import type { PlayerInfo, UserInfo } from "../../common/messages.js";
import type { ClientStatistics, PlayerGameInfo, PlayerUpdInfo } from "./types.js";
import EState from "../../common/EState.js";

type UpdaterType = {
	updateClient( name: string, bIsOnline: boolean, statistics?: ClientStatistics ): void;
	updatePlayer( player: PlayerUpdInfo ): void;
	updateClientCounter( online: number, total: number ): void;
	updateDiagramHidden( newHidden: boolean, info?: UserInfo ): void;
	newGame( gameId: string, player1: PlayerGameInfo, player2: PlayerGameInfo ): void;
	removePlayer( name: string ): void;
	clear(): void;
}

type Info = {
	bIsOnline: boolean,
	game: {
		id: string,
		player: PlayerInfo,
		startTime: number,
	} | null,
	statistics: {
		games: number,
		victories: number,
		totalTime: number,
	}
};


/**
 * Перевод миллисекунд в минуты с округлением
 * @param ms Миллисекунды
 */
function msToMin( ms: number ): number
{
	return Math.round( ms / 60000 );
}

function equalArray<T>( arr1: T[], arr2: T[] ): boolean
{
	if ( arr1.length !== arr2.length )
		return false;

	for (let i = 0; i < arr1.length; i++)
		if ( arr1[i] !== arr2[i] )
			return false;
	
	return true;
}


class AdminModel
{
	private model: Map<string, Info>;

	private updater: UpdaterType;

	constructor( updater: UpdaterType )
	{
		this.model = new Map<string, Info>();
		this.updater = updater;

		setInterval(
			this.updateTiming,
			20000,
			this.model,
			this.updater
		);
	}

	/**
	 * Открыть окно диаграммы, отобразив в нем информацию о переданном игроке, либо обновив его данными уже открытое окно
	 * 
	 * @param player Имя игрока
	 */
	openDiagram( player: string ): void
	{
		const playerInfo: Info | undefined = this.model.get( player );

		if ( playerInfo === undefined )
		{
			console.error( 'Failed to open diagram window. Invalid value of player name: '+player );
			return;
		}

		if ( playerInfo.game == null )
		{
			console.error( 'Failed to open diagram window. The player has no game: '+player );
			return;
		}

		this.updater.updateDiagramHidden(
			false,
			{
				client: {
					name: player,
					bIsOnline: playerInfo.bIsOnline,
				},
				player: playerInfo.game.player,
			}
		);
	}

	/** Закрыть окно диаграммы */
	closeDiagram(): void
	{
		this.updater.updateDiagramHidden( true );
	}

	/**
	 * Отобразить подключение к серверу нового клиента
	 * 
	 * @param client Имя нового клиента
	 */
	addClient( client: string ): void
	{
		if ( this.model.has( client ) )
			return;

		const newClient: Info = {
			bIsOnline: true,
			game: null,
			statistics: {
				games: 0,
				victories: 0,
				totalTime: 0,
			}
		}
		// Создать новую запись
		this.model.set( client, newClient );

		// Передавая объект статистики, даем понять updater,
		// что обновление затрагивает только половину окна со статистикой
		this.updater.updateClient(
			client,
			true,
			{
				counter: {
					games: 0,
					victories: 0,
				}
			}
		);
		this.updClientCounter();
	}

	/**
	 * Обновить информацию о клиенте
	 * 
	 * @param info Обновленная информация о клиенте
	 * @param gameId ID игры, в которой участвует игрок
	 */
	updateClient( info: UserInfo, gameId: string ): void
	{
		const clientInfo: Info | undefined = this.model.get( info.client.name );
		if( clientInfo === undefined )
		{
			console.log( 'Failed to update the client', info.client.name );
			return;
		}
		// Обновление статуса подключения
		if ( clientInfo.bIsOnline !== info.client.bIsOnline )
		{
			clientInfo.bIsOnline = info.client.bIsOnline;
			this.updater.updateClient( info.client.name, clientInfo.bIsOnline );
			this.updClientCounter();
		}
		// Если игрок покинул игру
		if ( gameId === '' )
		{
			if ( clientInfo.game != null )
			{
				clientInfo.game = null;
				this.updater.removePlayer( info.client.name );
			}
			return;
		}
		// Обновление игровой информации возможно после вызова метода newGame
		if ( clientInfo.game == null || clientInfo.game.id !== gameId )
		{
			console.log( 'Failed to update game information', info.client.name );
			return;
		}

		// Изменившаяся информация о клиенте
		const updInfo: PlayerUpdInfo = {
			name: info.client.name,
			gameId: gameId,
		}

		// По окончании матча необходимо пересчитать статистику
		if ( info.player.state !== clientInfo.game.player.state && info.player.state === EState.Celebration )
		{
			clientInfo.statistics.games++; // количество игр
			if ( info.player.rightMove )
				clientInfo.statistics.victories++; // количество побед
			clientInfo.statistics.totalTime += Date.now() - clientInfo.game.startTime; // общее время проведенное в играх

			this.updater.updateClient(
				info.client.name,
				clientInfo.bIsOnline,
				{
					counter: {
						games: clientInfo.statistics.games,
						victories: clientInfo.statistics.victories,
					},
					timing: {
						totalTime: msToMin( clientInfo.statistics.totalTime ),
						AVGTime: msToMin( clientInfo.statistics.totalTime / clientInfo.statistics.games )
					}
				}
			);

		}

		let changedProps: number = 0; // количество изменений
		for (const prop in info.player) {
			const typedProp = prop as keyof PlayerInfo;
			if ( clientInfo.game.player[ typedProp ] === info.player[ typedProp ] ) // свойство не изменилось
				continue;

			switch (typedProp) {
				case 'element':
					if ( clientInfo.game.player.element.number !== info.player.element.number )
					{
						Object.assign( clientInfo.game.player.element, info.player.element );
						updInfo.element = info.player.element;
						changedProps++;
					}
					break;
				
				case 'diagram':
					if ( !equalArray( clientInfo.game.player.diagram.main, info.player.diagram.main ) || !equalArray( clientInfo.game.player.diagram.base, info.player.diagram.base ) )
					{
						clientInfo.game.player.diagram.main = info.player.diagram.main;
						clientInfo.game.player.diagram.base = info.player.diagram.base;
						updInfo.diagram = info.player.diagram;
						changedProps++;
					}
					break;

				case 'state':
					clientInfo.game.player.state = info.player.state;
					updInfo.state = info.player.state;
					changedProps++;
					break;

				case 'team':
					clientInfo.game.player.team = info.player.team;
					updInfo.team = info.player.team;
					changedProps++;
					break;

				case 'diagramCheck':
					clientInfo.game.player.diagramCheck = info.player.diagramCheck;
					updInfo.diagramCheck = info.player.diagramCheck;
					changedProps++;
					break;

				case 'rightMove':
					clientInfo.game.player.rightMove = info.player.rightMove;
					updInfo.rightMove = info.player.rightMove;
					changedProps++;
					break;
			}
		}

		if ( changedProps > 0 )
			this.updater.updatePlayer( updInfo );
	}

	private updClientCounter()
	{
		let total: number = 0; // всего записей о клиентах
		let online: number = 0; // количество онлайн клиентов
		for ( const client of this.model.values() )
		{
			total++;
			if ( client.bIsOnline )
				online++;
		}
		this.updater.updateClientCounter( online, total );
	}

	/**
	 * Создать новую игру для двух клиентов
	 * 
	 * @param gameId ID новой игры
	 * @param player1 Информация о первом игроке
	 * @param player2 Информация о втором игроке
	 */
	newGame( gameId: string, player1: UserInfo, player2: UserInfo ): void
	{
		const info1: Info | undefined = this.model.get( player1.client.name );
		const info2: Info | undefined = this.model.get( player2.client.name );

		if ( info1 === undefined || info2 === undefined )
		{
			console.log( 'Failed to create new game. There is no one of players profile.', player1.client.name, info1, player2.client.name, info2 );
			return;
		}

		const startTime: number = Date.now();
		this.preparingBeforeGame( info1, player1, gameId, startTime );
		this.preparingBeforeGame( info2, player2, gameId, startTime );

		this.updater.newGame(
			gameId,
			{
				name: player1.client.name,
				bIsOnline: player1.client.bIsOnline,
				state: player1.player.state,
				team: player1.player.team,
				element: player1.player.element,
				rightMove: player1.player.rightMove,
			},
			{
				name: player2.client.name,
				bIsOnline: player2.client.bIsOnline,
				state: player2.player.state,
				team: player2.player.team,
				element: player2.player.element,
				rightMove: player2.player.rightMove,
			}
		);
	}

	/**
	 * Произвести все необходимые операции над клиентом прежде, чем отобразить новую игру
	 * @param profile Информация, хранимая в данной модели
	 * @param newInfo Обновленная информация
	 * @param gameId ID новой игры
	 * @param startTime Время начала игры в формате timestamp
	 */
	private preparingBeforeGame( profile: Info, newInfo: UserInfo, gameId: string, startTime: number ): void
	{
		// Если остались записи о прошлой игре, то удалить
		if ( profile.game != null )
			this.updater.removePlayer( newInfo.client.name );

		if ( profile.bIsOnline !== newInfo.client.bIsOnline )
		{
			profile.bIsOnline = newInfo.client.bIsOnline;
			this.updater.updateClient( newInfo.client.name, newInfo.client.bIsOnline );
		}

		profile.game = {
			id: gameId,
			player: newInfo.player,
			startTime: startTime,
		};
	}

	removeGame( gameId: string ): void
	{
		this.model.forEach(
			( profile, name ) =>
			{
				if ( profile.game != null && profile.game.id === gameId )
				{
					profile.game = null;
					this.updater.removePlayer( name );
				}
			}
		);
	}

	/**
	 * Обновление отображения временнЫх значений
	 */
	async updateTiming( model: Map<string, Info>, updater: UpdaterType )
	{
		const now: number = Date.now();
		for ( const client of model ) {
			if (
				client[1].bIsOnline
				&& client[1].game != null
				&& client[1].game.player.state > EState.Online
				&& client[1].game.player.state < EState.Celebration
			)
				updater.updateClient(
					client[0],
					client[1].bIsOnline,
					{
						timing: {
							totalTime: msToMin( client[1].statistics.totalTime + ( now - client[1].game.startTime ) ),
							AVGTime: msToMin( client[1].statistics.totalTime / client[1].statistics.games ),
						}
					}
				)
		}
	}

	clear(): void
	{
		this.model.clear();
		this.updater.clear();
	}
}


export default AdminModel;