import EState from "./EState"
import { ETeam } from "./ETeam"

export type DiagramView = {
	main: number[],
	base: number[],
}

/** Основная информация о клиенте */
export type ClientInfo = {
	/** Имя клиента и уникальный идентификатор */
	name: string,
	/** Есть ли связь с клиентом */
	bIsOnline: boolean,
};

/** Игровая информация о клиенте */
export type PlayerInfo = {
	/** Состояние игры */
	state: EState,
	/** Команда ( синие / красные ) */
	team: ETeam,
	/** Выбранный элемент */
	element: ChemicalElement,
	/** Прошла ли диаграмма проверку */
	diagramCheck: boolean,
	/** Диаграмма игрока */
	diagram: DiagramView,
	/** Право хода */
	rightMove: boolean,
};

/** Game ID */
export type GameInfo = string;

export type UserInfo = {
	client: ClientInfo,
	player: PlayerInfo,
}

/** Химический элемент */
export type ChemicalElement = {
	/** Порядковый номер элемента */
	number: number;
	/** Название элемента */
	name: string;
	/** Символ обозначения */
	symbol: string;
};



/*=============================================
=            Server message            =
=============================================*/

export type addClientMessage = {
	action: 'addClient',
	name: string,
};

export type updateClientMessage = {
	action: 'updateClient',
	game: GameInfo,
	info1: UserInfo,
	info2?: UserInfo,
};

export type newGameMessage = {
	action: 'newGame',
	game: 	 GameInfo,
	player1: UserInfo,
	player2: UserInfo,
}

export type removeGameMessage = {
	action: 'removeGame',
	game: 	GameInfo,
}

/*=====  End of Server message  ======*/



export type AnyServerMessage =
	| addClientMessage
	| updateClientMessage
	| newGameMessage
	| removeGameMessage;