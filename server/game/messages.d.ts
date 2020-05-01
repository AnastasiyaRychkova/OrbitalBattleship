import {
	EState,
	ETeam,
	SpinState,
} from '../../common/general.js';


/*=============================================
=             >>> To Client (UE4)             =
=============================================*/

export type UpdateStateMessage = {
	/** Состояние игры */
	state: EState,
	/** Команда ( синие / красные ) */
	team: ETeam,
	/** Выбранный элемент */
	element: ChemicalElementType,
	/** Состояние диаграммы игрока */
	diagram: SpinState[],
	/** Прошла ли диаграмма проверку */
	diagramCheck: boolean,
	/** Состояние диаграммы соперника */
	opDiagram: SpinState[],
	/** Право хода */
	rightMove: boolean,
	/** Химический элемент загаданный игроком */
	opElement: ChemicalElementType,
};

export type RefreshListMessage = {
	action: 'add' | 'remove' | 'refresh',
	data: ClientInfoRow[]
};


/*----------  Auxiliary data types  ----------*/

export type ChemicalElementType = {
	/** Порядковый номер элемента */
	number: number;

	/** Название элемента */
	name: string;

	/** Символ обозначения */
	symbol: string;
}

export type ClientInfoRow = {
	/** Имя клиента */
	name: string,
	/** Был ли получатель приглашен данным клиентом */
	bIsInvited: boolean,
	/** Отправил ли получатель приглашение данному клиенту */
	bIsInviting: boolean
}

/*=====  End of >>> To Client  ======*/



/*=============================================
=               >>> To Server                =
=============================================*/

/** Регистрация на сервере */
export type RegistrationMessage = {
	name: string,
	state: EState,
};

/** Запрос на получение списка неиграющих онлайн клиентов */
export type ListRequestionMessage = {
	type: 'refreshList',
	data: {},
}

/** Приглашение сыграть */
export type InviteMessage = {
	type: 'invite',
	data: {
		name: string,
	}
}

/** Уведомление о выборе химического элемента */
export type ElementSelectionMessage = {
	type: 'elemSelection',
	data: {
		elemNumber: number,
	}
}

/** Запрос на проверку корректности заполнения диаграммы */
export type CheckConfigMessage = {
	type: 'checkConfig',
	data: {
		config: number[],
	}
}

/** Запрос на выстрел по стрелке игрока */
export type ShotMessage = {
	type: 'shot',
	data: {
		spin: number,
	}
}

/** Запрос на выбор элемента, загаданного соперником */
export type NameElementMessage = {
	type: 'nameElement',
	data: {
		elemNumber: number,
	}
}

/** Подтверждение окончания игры */
export type EndGameMessage = {
	type: 'endGame',
	data: {},
}

/** Запрос на преждевременное окончание игры */
export type FlyAwayMessage = {
	type: 'flyAway',
	data: {},
}

/*=====  End of >>> To Server  ======*/


export type AnyClientMessage =
	| ListRequestionMessage
	| InviteMessage
	| ElementSelectionMessage
	| CheckConfigMessage
	| ShotMessage
	| NameElementMessage
	| EndGameMessage
	| FlyAwayMessage;