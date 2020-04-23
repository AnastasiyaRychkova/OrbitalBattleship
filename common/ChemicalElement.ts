import ElemConfig from './ElemConfig.js';

/** Химический элемент */
type ChemicalElement = {
	/** Порядковый номер элемента */
	number: number;

	/** Название элемента */
	name: string;

	/** Символ обозначения */
	symbol: string;

	/** Электронная конфигурация */
	config: ElemConfig;
};

export type {
	ChemicalElement
}