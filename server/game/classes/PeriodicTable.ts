import {
	ElemConfig,
} from '../../../common/general.js';

import type {
	ChemicalElement,
} from '../../../common/general.js';



/** 
 * Периодическая таблица химических элементов
 */
type PeriodicTable = Array<ChemicalElement>;

/**
 * Таблица Менделеева
 */
const periodicTable: PeriodicTable = [
	{
		number: 1,
		name: 	'hydrogen',
		symbol: 'H',
		config: new ElemConfig( [ 1, 0, 0, 0 ] )
	},
	{
		number: 2,
		name: 	'helium',
		symbol: 'He',
		config: new ElemConfig( [ 3, 0, 0, 0 ] )
	},
	{
		number: 3,
		name: 	'lithium',
		symbol: 'Li',
		config: new ElemConfig( [ 7, 0, 0, 0 ] )
	},
	{
		number: 4,
		name: 	'beryllium',
		symbol: 'Be',
		config: new ElemConfig( [ 15, 0, 0, 0 ] )
	},
	{
		number: 5,
		name: 	'boron',
		symbol: 'B',
		config: new ElemConfig( [ 31, 0, 0, 0 ] )
	},
	{
		number: 6,
		name: 	'carbon',
		symbol: 'C',
		config: new ElemConfig( [ 95, 0, 0, 0 ] )
	},
	{
		number: 7,
		name: 	'nitrogen',
		symbol: 'N',
		config: new ElemConfig( [ 351, 0, 0, 0 ] )
	},
	{
		number: 8,
		name: 	'oxygen',
		symbol: 'O',
		config: new ElemConfig( [ 383, 0, 0, 0 ] )
	},
	{
		number: 9,
		name: 	'fluorine',
		symbol: 'F',
		config: new ElemConfig( [ 511, 0, 0, 0 ] )
	},
	{
		number: 10,
		name: 	'neon',
		symbol: 'Ne',
		config: new ElemConfig( [ 1023, 0, 0, 0 ] )
	},
	{
		number: 11,
		name: 	'sodium',
		symbol: 'Na',
		config: new ElemConfig( [ 2047, 0, 0, 0 ] )
	},
	{
		number: 12,
		name: 	'magnesium',
		symbol: 'Mg',
		config: new ElemConfig( [ 4095, 0, 0, 0 ] )
	},
	{
		number: 13,
		name: 	'aluminium',
		symbol: 'Al',
		config: new ElemConfig( [ 8191, 0, 0, 0 ] )
	},
	{
		number: 14,
		name: 	'silicon',
		symbol: 'Si',
		config: new ElemConfig( [ 24575, 0, 0, 0 ] )
	},
	{
		number: 15,
		name: 	'phosphorus',
		symbol: 'P',
		config: new ElemConfig( [ 90111, 0, 0, 0 ] )
	},
	{
		number: 16,
		name: 	'sulfur',
		symbol: 'S',
		config: new ElemConfig( [ 98303, 0, 0, 0 ] )
	},
	{
		number: 17,
		name: 	'chlorine',
		symbol: 'Cl',
		config: new ElemConfig( [ 131071, 0, 0, 0 ] )
	},
	{
		number: 18,
		name: 	'argon',
		symbol: 'Ar',
		config: new ElemConfig( [ 262143, 0, 0, 0 ] )
	},
	{
		number: 19,
		name: 	'potassium',
		symbol: 'K',
		config: new ElemConfig( [ 524287, 0, 0, 0 ] )
	},
	{
		number: 20,
		name: 	'calcium',
		symbol: 'Ca',
		config: new ElemConfig( [ 1048575, 0, 0, 0 ] )
	},
	{
		number: 21,
		name: 	'scandium',
		symbol: 'Sc',
		config: new ElemConfig( [ 2097151, 0, 0, 0 ] )
	},
	{
		number: 22,
		name: 	'titanium',
		symbol: 'Ti',
		config: new ElemConfig( [ 6291455, 0, 0, 0 ] )
	},
	{
		number: 23,
		name: 	'vanadium',
		symbol: 'V',
		config: new ElemConfig( [ 23068671, 0, 0, 0 ] )
	},
	{
		number: 24,
		name: 	'chromium',
		symbol: 'Cr',
		config: new ElemConfig( [ 358088703, 0, 0, 0 ] )
	},
	{
		number: 25,
		name: 	'manganese',
		symbol: 'Mn',
		config: new ElemConfig( [ 358612991, 0, 0, 0 ] )
	},
	{
		number: 26,
		name: 	'iron',
		symbol: 'Fe',
		config: new ElemConfig( [ 360710143, 0, 0, 0 ] )
	},
	{
		number: 27,
		name: 	'cobalt',
		symbol: 'Co',
		config: new ElemConfig( [ 369098751, 0, 0, 0 ] )
	},
	{
		number: 28,
		name: 	'nickel',
		symbol: 'Ni',
		config: new ElemConfig( [ 402653183, 0, 0, 0 ] )
	},
	{
		number: 29,
		name: 	'copper',
		symbol: 'Cu',
		config: new ElemConfig( [ 1073217535, 0, 0, 0 ] )
	},
	{
		number: 30,
		name: 	'zinc',
		symbol: 'Zn',
		config: new ElemConfig( [ 1073741823, 0, 0, 0 ] )
	},
	{
		number: 31,
		name: 	'gallium',
		symbol: 'Ga',
		config: new ElemConfig( [ 2147483647, 0, 0, 0 ] )
	},
	{
		number: 32,
		name: 	'germanium',
		symbol: 'Ge',
		config: new ElemConfig( [ 2147483647, 1, 0, 0 ] )
	},
	{
		number: 33,
		name: 	'arsenic',
		symbol: 'As',
		config: new ElemConfig( [ 2147483647, 5, 0, 0 ] )
	},
	{
		number: 34,
		name: 	'selenium',
		symbol: 'Se',
		config: new ElemConfig( [ -1, 5, 0, 0 ] )
	},
	{
		number: 35,
		name: 	'bromine',
		symbol: 'Br',
		config: new ElemConfig( [ -1, 7, 0, 0 ] )
	},
	{
		number: 36,
		name: 	'krypton',
		symbol: 'Kr',
		config: new ElemConfig( [ -1, 15, 0, 0 ] )
	},
	{
		number: 37,
		name: 	'rubidium',
		symbol: 'Rb',
		config: new ElemConfig( [ -1, 31, 0, 0 ] )
	},
	{
		number: 38,
		name: 	'strontium',
		symbol: 'Sr',
		config: new ElemConfig( [ -1, 63, 0, 0 ] )
	},
	{
		number: 39,
		name: 	'yttrium',
		symbol: 'Y',
		config: new ElemConfig( [ -1, 127, 0, 0 ] )
	},
	{
		number: 40,
		name: 	'zirconium',
		symbol: 'Zr',
		config: new ElemConfig( [ -1, 383, 0, 0 ] )
	},
	{
		number: 41,
		name: 	'niobium',
		symbol: 'Nb',
		config: new ElemConfig( [ -1, 5471, 0, 0 ] )
	},
	{
		number: 42,
		name: 	'molybdenum',
		symbol: 'Mo',
		config: new ElemConfig( [ -1, 21855, 0, 0 ] )
	},
	{
		number: 43,
		name: 	'technetium',
		symbol: 'Tc',
		config: new ElemConfig( [ -1, 21887, 0, 0 ] )
	},
	{
		number: 44,
		name: 	'ruthenium',
		symbol: 'Ru',
		config: new ElemConfig( [ -1, 22495, 0, 0 ] )
	},
	{
		number: 45,
		name: 	'rhodium',
		symbol: 'Rh',
		config: new ElemConfig( [ -1, 24543, 0, 0 ] )
	},
	{
		number: 46,
		name: 	'palladium',
		symbol: 'Pd',
		config: new ElemConfig( [ -1, 65487, 0, 0 ] )
	},
	{
		number: 47,
		name: 	'silver',
		symbol: 'Ag',
		config: new ElemConfig( [ -1, 65503, 0, 0 ] )
	},
	{
		number: 48,
		name: 	'cadmium',
		symbol: 'Cd',
		config: new ElemConfig( [ -1, 65535, 0, 0 ] )
	},
	{
		number: 49,
		name: 	'indium',
		symbol: 'In',
		config: new ElemConfig( [ -1, 131071, 0, 0 ] )
	},
	{
		number: 50,
		name: 	'tin',
		symbol: 'Sn',
		config: new ElemConfig( [ -1, 393215, 0, 0 ] )
	},
	{
		number: 51,
		name: 	'antimony',
		symbol: 'Sb',
		config: new ElemConfig( [ -1, 1441791, 0, 0 ] )
	},
	{
		number: 52,
		name: 	'tellurium',
		symbol: 'Te',
		config: new ElemConfig( [ -1, 1572863, 0, 0 ] )
	},
	{
		number: 53,
		name: 	'iodine',
		symbol: 'I',
		config: new ElemConfig( [ -1, 2097151, 0, 0 ] )
	},
	{
		number: 54,
		name: 	'xenon',
		symbol: 'Xe',
		config: new ElemConfig( [ -1, 4194303, 0, 0 ] )
	},
	{
		number: 55,
		name: 	'caesium',
		symbol: 'Cs',
		config: new ElemConfig( [ -1, 8388607, 0, 0 ] )
	},
	{
		number: 56,
		name: 	'barium',
		symbol: 'Ba',
		config: new ElemConfig( [ -1, 16777215, 0, 0 ] )
	},
	{
		number: 57,
		name: 	'lanthanum',
		symbol: 'La',
		config: new ElemConfig( [ -1, 16777215, 64, 0 ] )
	},
	{
		number: 58,
		name: 	'cerium',
		symbol: 'Ce',
		config: new ElemConfig( [ -1, 33554431, 64, 0 ] )
	},
	{
		number: 59,
		name: 	'praseodymium',
		symbol: 'Pr',
		config: new ElemConfig( [ -1, 369098751, 0, 0 ] )
	},
	{
		number: 60,
		name: 	'neodymium',
		symbol: 'Nd',
		config: new ElemConfig( [ -1, 1442840575, 0, 0 ] )
	},
	{
		number: 61,
		name: 	'promethium',
		symbol: 'Pm',
		config: new ElemConfig( [ -1, 1442840575, 1, 0 ] )
	},
	{
		number: 62,
		name: 	'samarium',
		symbol: 'Sm',
		config: new ElemConfig( [ -1, 1442840575, 5, 0 ] )
	},
	{
		number: 63,
		name: 	'europium',
		symbol: 'Eu',
		config: new ElemConfig( [ -1, 1442840575, 21, 0 ] )
	},
	{
		number: 64,
		name: 	'gadolinium',
		symbol: 'Gb',
		config: new ElemConfig( [ -1, 1442840575, 85, 0 ] )
	},
	{
		number: 65,
		name: 	'terbium',
		symbol: 'Tb',
		config: new ElemConfig( [ -1, 1610612735, 21, 0 ] )
	},
	{
		number: 66,
		name: 	'dysprosium',
		symbol: 'Dy',
		config: new ElemConfig( [ -1, 2147483647, 21, 0 ] )
	},
	{
		number: 67,
		name: 	'holmium',
		symbol: 'Ho',
		config: new ElemConfig( [ -1, -1, 21, 0 ] )
	},
	{
		number: 68,
		name: 	'erbium',
		symbol: 'Er',
		config: new ElemConfig( [ -1, -1, 23, 0 ] )
	},
	{
		number: 69,
		name: 	'thulium',
		symbol: 'Tm',
		config: new ElemConfig( [ -1, -1, 31, 0 ] )
	},
	{
		number: 70,
		name: 	'ytterbium',
		symbol: 'Yb',
		config: new ElemConfig( [ -1, -1, 63, 0 ] )
	},
	{
		number: 71,
		name: 	'lutetium',
		symbol: 'Lu',
		config: new ElemConfig( [ -1, -1, 127, 0 ] )
	},
	{
		number: 72,
		name: 	'hafnium',
		symbol: 'Hf',
		config: new ElemConfig( [ -1, -1, 383, 0 ] )
	},
	{
		number: 73,
		name: 	'tantalum',
		symbol: 'Ta',
		config: new ElemConfig( [ -1, -1, 1407, 0 ] )
	},
	{
		number: 74,
		name: 	'tungsten',
		symbol: 'W',
		config: new ElemConfig( [ -1, -1, 5503, 0 ] )
	},
	{
		number: 75,
		name: 	'rhenium',
		symbol: 'Re',
		config: new ElemConfig( [ -1, -1, 21887, 0 ] )
	},
	{
		number: 76,
		name: 	'osmium',
		symbol: 'Os',
		config: new ElemConfig( [ -1, -1, 22015, 0 ] )
	},
	{
		number: 77,
		name: 	'iridium',
		symbol: 'Ir',
		config: new ElemConfig( [ -1, -1, 22527, 0 ] )
	},
	{
		number: 78,
		name: 	'platinum',
		symbol: 'Pt',
		config: new ElemConfig( [ -1, -1, 32765, 0 ] )
	},
	{
		number: 79,
		name: 	'gold',
		symbol: 'Au',
		config: new ElemConfig( [ -1, -1, 65533, 0 ] )
	},
	{
		number: 80,
		name: 	'mercury',
		symbol: 'Hg',
		config: new ElemConfig( [ -1, -1, 65535, 0 ] )
	},
	{
		number: 81,
		name: 	'thallium',
		symbol: 'Tl',
		config: new ElemConfig( [ -1, -1, 131071, 0 ] )
	},
	{
		number: 82,
		name: 	'lead',
		symbol: 'Pb',
		config: new ElemConfig( [ -1, -1, 393215, 0 ] )
	},
	{
		number: 83,
		name: 	'bismuth',
		symbol: 'Bi',
		config: new ElemConfig( [ -1, -1, 1441791, 0 ] )
	},
	{
		number: 84,
		name: 	'polonium',
		symbol: 'Po',
		config: new ElemConfig( [ -1, -1, 1572863, 0 ] )
	},
	{
		number: 85,
		name: 	'astatine',
		symbol: 'At',
		config: new ElemConfig( [ -1, -1, 2097151, 0 ] )
	},
	{
		number: 86,
		name: 	'radon',
		symbol: 'Rn',
		config: new ElemConfig( [ -1, -1, 4194303, 0 ] )
	},
	{
		number: 87,
		name: 	'francium',
		symbol: 'Fr',
		config: new ElemConfig( [ -1, -1, 8388607, 0 ] )
	},
	{
		number: 88,
		name: 	'radium',
		symbol: 'Ra',
		config: new ElemConfig( [ -1, -1, 16777215, 0 ] )
	},
	{
		number: 89,
		name: 	'actinium',
		symbol: 'Ac',
		config: new ElemConfig( [ -1, -1, 16777215, 64 ] )
	},
	{
		number: 90,
		name: 	'thorium',
		symbol: 'Th',
		config: new ElemConfig( [ -1, -1, 83886079, 192 ] )
	},
	{
		number: 91,
		name: 	'protactinium',
		symbol: 'Pa',
		config: new ElemConfig( [ -1, -1, 100663295, 64 ] )
	},
	{
		number: 92,
		name: 	'uranium',
		symbol: 'U',
		config: new ElemConfig( [ -1, -1, 369098751, 64 ] )
	},
	{
		number: 93,
		name: 	'neptunium',
		symbol: 'Np',
		config: new ElemConfig( [ -1, -1, 1442840575, 64 ] )
	},
	{
		number: 94,
		name: 	'plutonium',
		symbol: 'Pu',
		config: new ElemConfig( [ -1, -1, 1442840575, 5 ] )
	},
	{
		number: 95,
		name: 	'americium',
		symbol: 'Am',
		config: new ElemConfig( [ -1, -1, 1442840575, 21 ] )
	},
	{
		number: 96,
		name: 	'curium',
		symbol: 'Cm',
		config: new ElemConfig( [ -1, -1, 1442840575, 85 ] )
	},
	{
		number: 97,
		name: 	'berkelium',
		symbol: 'Bk',
		config: new ElemConfig( [ -1, -1, 1610612735, 21 ] )
	},
	{
		number: 98,
		name: 	'californium',
		symbol: 'Cf',
		config: new ElemConfig( [ -1, -1, 2147483647, 21 ] )
	},
	{
		number: 99,
		name: 	'einsteinium',
		symbol: 'Es',
		config: new ElemConfig( [ -1, -1, -1, 21 ] )
	},
	{
		number: 100,
		name: 	'fermium',
		symbol: 'Fm',
		config: new ElemConfig( [ -1, -1, -1, 23 ] )
	},
	{
		number: 101,
		name: 	'mendelevium',
		symbol: 'Md',
		config: new ElemConfig( [ -1, -1, -1, 31 ] )
	},
	{
		number: 102,
		name: 	'nobelium',
		symbol: 'No',
		config: new ElemConfig( [ -1, -1, -1, 63 ] )
	},
	{
		number: 103,
		name: 	'lawrencium',
		symbol: 'Lr',
		config: new ElemConfig( [ -1, -1, -1, 65599 ] )
	},
	{
		number: 104,
		name: 	'rutherfordium',
		symbol: 'Rf',
		config: new ElemConfig( [ -1, -1, -1, 383 ] )
	},
	{
		number: 105,
		name: 	'dubnium',
		symbol: 'Db',
		config: new ElemConfig( [ -1, -1, -1, 1407 ] )
	},
	{
		number: 106,
		name: 	'seaborgium',
		symbol: 'Sg',
		config: new ElemConfig( [ -1, -1, -1, 5503 ] )
	},
	{
		number: 107,
		name: 	'bohrium',
		symbol: 'Bh',
		config: new ElemConfig( [ -1, -1, -1, 21887 ] )
	},
	{
		number: 108,
		name: 	'hassium',
		symbol: 'Hs',
		config: new ElemConfig( [ -1, -1, -1, 22015 ] )
	},
	{
		number: 109,
		name: 	'meitnerium',
		symbol: 'Mt',
		config: new ElemConfig( [ -1, -1, -1, 22527 ] )
	},
	{
		number: 110,
		name: 	'darmstadtium',
		symbol: 'Ds',
		config: new ElemConfig( [ -1, -1, -1, 24575 ] )
	},
	{
		number: 111,
		name: 	'roentgenium',
		symbol: 'Rg',
		config: new ElemConfig( [ -1, -1, -1, 32767 ] )
	},
	{
		number: 112,
		name: 	'copernicium',
		symbol: 'Cn',
		config: new ElemConfig( [ -1, -1, -1, 65535 ] )
	},
	{
		number: 113,
		name: 	'nihonium',
		symbol: 'Nh',
		config: new ElemConfig( [ -1, -1, -1, 131071 ] )
	},
	{
		number: 114,
		name: 	'flerovium',
		symbol: 'Fl',
		config: new ElemConfig( [ -1, -1, -1, 393215 ] )
	},
	{
		number: 115,
		name: 	'moscovium',
		symbol: 'Mc',
		config: new ElemConfig( [ -1, -1, -1, 1441791 ] )
	},
	{
		number: 116,
		name: 	'livermorium',
		symbol: 'Lv',
		config: new ElemConfig( [ -1, -1, -1, 1572863 ] )
	},
	{
		number: 117,
		name: 	'tennessine',
		symbol: 'Ts',
		config: new ElemConfig( [ -1, -1, -1, 2097151 ] )
	},
	{
		number: 118,
		name: 	'oganesson',
		symbol: 'Og',
		config: new ElemConfig( [ -1, -1, -1, 4194303 ] )
	}
];




export default periodicTable;

export type {
	ChemicalElement,
	PeriodicTable,
};