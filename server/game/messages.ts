import {
	EState,
	ETeam,
	SpinState,
} from '../../common/general.js';


/*=============================================
=             >>> To Client (UE4)             =
=============================================*/

type UpdateStateMessage = {
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

type RefreshListMessage = {
	action: 'add' | 'remove' | 'refresh',
	data: ClientInfoRow[]
};


/*----------  Auxiliary data types  ----------*/

type ChemicalElementType = {
	/** Порядковый номер элемента */
	number: number;

	/** Название элемента */
	name: string;

	/** Символ обозначения */
	symbol: string;
}

/** Конфигурация химического элемента */
type ElemConfigArray = [number, number, number, number];

type ClientInfoRow = {
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

/* registration: RegistrationMessage */
type RegistrationMessage = {
	name: string,
	state: EState
}; // name

/*=====  End of >>> To Server  ======*/



export type {
	UpdateStateMessage,
	RefreshListMessage,
	ElemConfigArray,
	ClientInfoRow,
	RegistrationMessage,
	ChemicalElementType
}