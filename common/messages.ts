import EState from "./EState"
import { ETeam } from "./ETeam"

type DiagramView = {
	main: number[],
	base: number[],
}

/** Основная информация о клиенте */
type ClientInfo = {
	/** Имя клиента и уникальный идентификатор */
	name: string,
	/** Есть ли связь с клиентом */
	bIsOnline: boolean,
};

/** Игровая информация о клиенте */
type PlayerInfo = {
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
type GameInfo = string;

type UserInfo = {
	client: ClientInfo,
	player: PlayerInfo,
}

/** Химический элемент */
type ChemicalElement = {
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

type addClientMessage = {
	action: 'addClient',
	name: string,
};

type updateClientMessage = {
	action: 'updateClient',
	game: GameInfo,
	info1: UserInfo,
	info2?: UserInfo,
};

type newGameMessage = {
	action: 'newGame',
	game: 	 GameInfo,
	player1: UserInfo,
	player2: UserInfo,
}

/*=====  End of Server message  ======*/



export type {
	ClientInfo,
	PlayerInfo,
	UserInfo,
	ChemicalElement,
	addClientMessage,
	updateClientMessage,
	newGameMessage,
	DiagramView,
}