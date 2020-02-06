const ElemConfig = require('./elemConfig');

/** ==========================================
 * Периодическая таблица химических элементов
 * ==========================================
 */
class PeriodicTable {

	constructor( ) {
	}

	static init() {
		PeriodicTable.table = new Array(119);
		PeriodicTable.initTable( PeriodicTable.table );
	}

	static initTable() {
		PeriodicTable.table[1]  = PeriodicTable.getChemicalElementObject( 'hydrogen', 		'H',  [ 1, 0, 0, 0 ] );
		PeriodicTable.table[2]  = PeriodicTable.getChemicalElementObject( 'helium', 		'He', [ 3, 0, 0, 0 ] );
		PeriodicTable.table[3]  = PeriodicTable.getChemicalElementObject( 'lithium', 		'Li', [ 7, 0, 0, 0 ] );
		PeriodicTable.table[4]  = PeriodicTable.getChemicalElementObject( 'beryllium', 		'Be', [ 15, 0, 0, 0 ] );
		PeriodicTable.table[5]  = PeriodicTable.getChemicalElementObject( 'boron', 			'B',  [ 31, 0, 0, 0 ] );
		PeriodicTable.table[6]  = PeriodicTable.getChemicalElementObject( 'carbon', 		'C',  [ 95, 0, 0, 0 ] );
		PeriodicTable.table[7]  = PeriodicTable.getChemicalElementObject( 'nitrogen', 		'N',  [ 351, 0, 0, 0 ] );
		PeriodicTable.table[8]  = PeriodicTable.getChemicalElementObject( 'oxygen', 		'O',  [ 383, 0, 0, 0 ] );
		PeriodicTable.table[9]  = PeriodicTable.getChemicalElementObject( 'fluorine', 		'F',  [ 511, 0, 0, 0 ] );
		PeriodicTable.table[10] = PeriodicTable.getChemicalElementObject( 'neon', 			'Ne', [ 1023, 0, 0, 0 ] );
		PeriodicTable.table[11] = PeriodicTable.getChemicalElementObject( 'sodium', 		'Na', [ 2047, 0, 0, 0 ] );
		PeriodicTable.table[12] = PeriodicTable.getChemicalElementObject( 'magnesium', 		'Mg', [ 4095, 0, 0, 0 ] );
		PeriodicTable.table[13] = PeriodicTable.getChemicalElementObject( 'aluminium', 		'Al', [ 8191, 0, 0, 0 ] );
		PeriodicTable.table[14] = PeriodicTable.getChemicalElementObject( 'silicon', 		'Si', [ 24575, 0, 0, 0 ] );
		PeriodicTable.table[15] = PeriodicTable.getChemicalElementObject( 'phosphorus', 	'P',  [ 90111, 0, 0, 0 ] );
		PeriodicTable.table[16] = PeriodicTable.getChemicalElementObject( 'sulfur', 		'S',  [ 98303, 0, 0, 0 ] );
		PeriodicTable.table[17] = PeriodicTable.getChemicalElementObject( 'chlorine', 		'Cl', [ 131071, 0, 0, 0 ] );
		PeriodicTable.table[18] = PeriodicTable.getChemicalElementObject( 'argon', 			'Ar', [ 262143, 0, 0, 0 ] );
		PeriodicTable.table[19] = PeriodicTable.getChemicalElementObject( 'potassium', 		'K',  [ 524287, 0, 0, 0 ] );
		PeriodicTable.table[20] = PeriodicTable.getChemicalElementObject( 'calcium', 		'Ca', [ 1048575, 0, 0, 0 ] );
		PeriodicTable.table[21] = PeriodicTable.getChemicalElementObject( 'scandium', 		'Sc', [ 2097151, 0, 0, 0 ] );
		PeriodicTable.table[22] = PeriodicTable.getChemicalElementObject( 'titanium', 		'Ti', [ 6291455, 0, 0, 0 ] );
		PeriodicTable.table[23] = PeriodicTable.getChemicalElementObject( 'vanadium', 		'V',  [ 23068671, 0, 0, 0 ] );
		PeriodicTable.table[24] = PeriodicTable.getChemicalElementObject( 'chromium', 		'Cr', [ 358088703, 0, 0, 0 ] );
		PeriodicTable.table[25] = PeriodicTable.getChemicalElementObject( 'manganese', 		'Mn', [ 358612991, 0, 0, 0 ] );
		PeriodicTable.table[26] = PeriodicTable.getChemicalElementObject( 'iron', 			'Fe', [ 360710143, 0, 0, 0 ] );
		PeriodicTable.table[27] = PeriodicTable.getChemicalElementObject( 'cobalt', 		'Co', [ 369098751, 0, 0, 0 ] );
		PeriodicTable.table[28] = PeriodicTable.getChemicalElementObject( 'nickel', 		'Ni', [ 402653183, 0, 0, 0 ] );
		PeriodicTable.table[29] = PeriodicTable.getChemicalElementObject( 'copper', 		'Cu', [ 1073217535, 0, 0, 0 ] );
		PeriodicTable.table[30] = PeriodicTable.getChemicalElementObject( 'zinc', 			'Zn', [ 1073741823, 0, 0, 0 ] );
		PeriodicTable.table[31] = PeriodicTable.getChemicalElementObject( 'gallium', 		'Ga', [ 2147483647, 0, 0, 0 ] );
		PeriodicTable.table[32] = PeriodicTable.getChemicalElementObject( 'germanium', 		'Ge', [ 2147483647, 1, 0, 0 ] );
		PeriodicTable.table[33] = PeriodicTable.getChemicalElementObject( 'arsenic', 		'As', [ 2147483647, 5, 0, 0 ] );
		PeriodicTable.table[34] = PeriodicTable.getChemicalElementObject( 'selenium', 		'Se', [ -1, 5, 0, 0 ] );
		PeriodicTable.table[35] = PeriodicTable.getChemicalElementObject( 'bromine', 		'Br', [ -1, 7, 0, 0 ] );
		PeriodicTable.table[36] = PeriodicTable.getChemicalElementObject( 'krypton', 		'Kr', [ -1, 15, 0, 0 ] );
		PeriodicTable.table[37] = PeriodicTable.getChemicalElementObject( 'rubidium', 		'Rb', [ -1, 31, 0, 0 ] );
		PeriodicTable.table[38] = PeriodicTable.getChemicalElementObject( 'strontium', 		'Sr', [ -1, 63, 0, 0 ] );
		PeriodicTable.table[39] = PeriodicTable.getChemicalElementObject( 'yttrium', 		'Y',  [ -1, 127, 0, 0 ] );
		PeriodicTable.table[40] = PeriodicTable.getChemicalElementObject( 'zirconium', 		'Zr', [ -1, 383, 0, 0 ] );
		PeriodicTable.table[41] = PeriodicTable.getChemicalElementObject( 'niobium', 		'Nb', [ -1, 5471, 0, 0 ] );
		PeriodicTable.table[42] = PeriodicTable.getChemicalElementObject( 'molybdenum', 	'Mo', [ -1, 21855, 0, 0 ] );
		PeriodicTable.table[43] = PeriodicTable.getChemicalElementObject( 'technetium', 	'Tc', [ -1, 21887, 0, 0 ] );
		PeriodicTable.table[44] = PeriodicTable.getChemicalElementObject( 'ruthenium', 		'Ru', [ -1, 22495, 0, 0 ] );
		PeriodicTable.table[45] = PeriodicTable.getChemicalElementObject( 'rhodium', 		'Rh', [ -1, 24543, 0, 0 ] );
		PeriodicTable.table[46] = PeriodicTable.getChemicalElementObject( 'palladium', 		'Pd', [ -1, 65487, 0, 0 ] );
		PeriodicTable.table[47] = PeriodicTable.getChemicalElementObject( 'silver', 		'Ag', [ -1, 65503, 0, 0 ] );
		PeriodicTable.table[48] = PeriodicTable.getChemicalElementObject( 'cadmium', 		'Cd', [ -1, 65535, 0, 0 ] );
		PeriodicTable.table[49] = PeriodicTable.getChemicalElementObject( 'indium', 		'In', [ -1, 131071, 0, 0 ] );
		PeriodicTable.table[50] = PeriodicTable.getChemicalElementObject( 'tin', 			'Sn', [ -1, 393215, 0, 0 ] );
		PeriodicTable.table[51] = PeriodicTable.getChemicalElementObject( 'antimony', 		'Sb', [ -1, 1441791, 0, 0 ] );
		PeriodicTable.table[52] = PeriodicTable.getChemicalElementObject( 'tellurium', 		'Te', [ -1, 1572863, 0, 0 ] );
		PeriodicTable.table[53] = PeriodicTable.getChemicalElementObject( 'iodine', 		'I',  [ -1, 2097151, 0, 0 ] );
		PeriodicTable.table[54] = PeriodicTable.getChemicalElementObject( 'xenon', 			'Xe', [ -1, 4194303, 0, 0 ] );
		PeriodicTable.table[55] = PeriodicTable.getChemicalElementObject( 'caesium', 		'Cs', [ -1, 8388607, 0, 0 ] );
		PeriodicTable.table[56] = PeriodicTable.getChemicalElementObject( 'barium', 		'Ba', [ -1, 16777215, 0, 0 ] );
		PeriodicTable.table[57] = PeriodicTable.getChemicalElementObject( 'lanthanum', 		'La', [ -1, 16777215, 64, 0 ] );
		PeriodicTable.table[58] = PeriodicTable.getChemicalElementObject( 'cerium', 		'Ce', [ -1, 33554431, 64, 0 ] );
		PeriodicTable.table[59] = PeriodicTable.getChemicalElementObject( 'praseodymium',	'Pr', [ -1, 369098751, 0, 0 ] );
		PeriodicTable.table[60] = PeriodicTable.getChemicalElementObject( 'neodymium', 		'Nd', [ -1, 1442840575, 0, 0 ] );
		PeriodicTable.table[61] = PeriodicTable.getChemicalElementObject( 'promethium', 	'Pm', [ -1, 1442840575, 1, 0 ] );
		PeriodicTable.table[62] = PeriodicTable.getChemicalElementObject( 'samarium', 		'Sm', [ -1, 1442840575, 5, 0 ] );
		PeriodicTable.table[63] = PeriodicTable.getChemicalElementObject( 'europium', 		'Eu', [ -1, 1442840575, 21, 0 ] );
		PeriodicTable.table[64] = PeriodicTable.getChemicalElementObject( 'gadolinium', 	'Gb', [ -1, 1442840575, 85, 0 ] );
		PeriodicTable.table[65] = PeriodicTable.getChemicalElementObject( 'terbium', 		'Tb', [ -1, 1610612735, 21, 0 ] );
		PeriodicTable.table[66] = PeriodicTable.getChemicalElementObject( 'dysprosium', 	'Dy', [ -1, 2147483647, 21, 0 ] );
		PeriodicTable.table[67] = PeriodicTable.getChemicalElementObject( 'holmium', 		'Ho', [ -1, -1, 21, 0 ] );
		PeriodicTable.table[68] = PeriodicTable.getChemicalElementObject( 'erbium', 		'Er', [ -1, -1, 23, 0 ] );
		PeriodicTable.table[69] = PeriodicTable.getChemicalElementObject( 'thulium', 		'Tm', [ -1, -1, 31, 0 ] );
		PeriodicTable.table[70] = PeriodicTable.getChemicalElementObject( 'ytterbium', 		'Yb', [ -1, -1, 63, 0 ] );
		PeriodicTable.table[71] = PeriodicTable.getChemicalElementObject( 'lutetium', 		'Lu', [ -1, -1, 127, 0 ] );
		PeriodicTable.table[72] = PeriodicTable.getChemicalElementObject( 'hafnium', 		'Hf', [ -1, -1, 383, 0 ] );
		PeriodicTable.table[73] = PeriodicTable.getChemicalElementObject( 'tantalum', 		'Ta', [ -1, -1, 1407, 0 ] );
		PeriodicTable.table[74] = PeriodicTable.getChemicalElementObject( 'tungsten', 		'W',  [ -1, -1, 5503, 0 ] );
		PeriodicTable.table[75] = PeriodicTable.getChemicalElementObject( 'rhenium', 		'Re', [ -1, -1, 21887, 0 ] );
		PeriodicTable.table[76] = PeriodicTable.getChemicalElementObject( 'osmium', 		'Os', [ -1, -1, 22015, 0 ] );
		PeriodicTable.table[77] = PeriodicTable.getChemicalElementObject( 'iridium', 		'Ir', [ -1, -1, 22527, 0 ] );
		PeriodicTable.table[78] = PeriodicTable.getChemicalElementObject( 'platinum', 		'Pt', [ -1, -1, 32765, 0 ] );
		PeriodicTable.table[79] = PeriodicTable.getChemicalElementObject( 'gold', 			'Au', [ -1, -1, 65533, 0 ] );
		PeriodicTable.table[80] = PeriodicTable.getChemicalElementObject( 'mercury', 		'Hg', [ -1, -1, 65535, 0 ] );
		PeriodicTable.table[81] = PeriodicTable.getChemicalElementObject( 'thallium', 		'Tl', [ -1, -1, 131071, 0 ] );
		PeriodicTable.table[82] = PeriodicTable.getChemicalElementObject( 'lead', 			'Pb', [ -1, -1, 393215, 0 ] );
		PeriodicTable.table[83] = PeriodicTable.getChemicalElementObject( 'bismuth', 		'Bi', [ -1, -1, 1441791, 0 ] );
		PeriodicTable.table[84] = PeriodicTable.getChemicalElementObject( 'polonium', 		'Po', [ -1, -1, 1572863, 0 ] );
		PeriodicTable.table[85] = PeriodicTable.getChemicalElementObject( 'astatine', 		'At', [ -1, -1, 2097151, 0 ] );
		PeriodicTable.table[86] = PeriodicTable.getChemicalElementObject( 'radon', 			'Rn', [ -1, -1, 4194303, 0 ] );
		PeriodicTable.table[87] = PeriodicTable.getChemicalElementObject( 'francium', 		'Fr', [ -1, -1, 8388607, 0 ] );
		PeriodicTable.table[88] = PeriodicTable.getChemicalElementObject( 'radium', 		'Ra', [ -1, -1, 16777215, 0 ] );
		PeriodicTable.table[89] = PeriodicTable.getChemicalElementObject( 'actinium', 		'Ac', [ -1, -1, 16777215, 64 ] );
		PeriodicTable.table[90] = PeriodicTable.getChemicalElementObject( 'thorium', 		'Th', [ -1, -1, 83886079, 192 ] );
		PeriodicTable.table[91] = PeriodicTable.getChemicalElementObject( 'protactinium',	'Pa', [ -1, -1, 100663295, 64 ] );
		PeriodicTable.table[92] = PeriodicTable.getChemicalElementObject( 'uranium', 		'U',  [ -1, -1, 369098751, 64 ] );
		PeriodicTable.table[93] = PeriodicTable.getChemicalElementObject( 'neptunium', 		'Np', [ -1, -1, 1442840575, 64 ] );
		PeriodicTable.table[94] = PeriodicTable.getChemicalElementObject( 'plutonium', 		'Pu', [ -1, -1, 1442840575, 5 ] );
		PeriodicTable.table[95] = PeriodicTable.getChemicalElementObject( 'americium', 		'Am', [ -1, -1, 1442840575, 21 ] );
		PeriodicTable.table[96] = PeriodicTable.getChemicalElementObject( 'curium', 		'Cm', [ -1, -1, 1442840575, 85 ] );
		PeriodicTable.table[97] = PeriodicTable.getChemicalElementObject( 'berkelium', 		'Bk', [ -1, -1, 1610612735, 21 ] );
		PeriodicTable.table[98] = PeriodicTable.getChemicalElementObject( 'californium', 	'Cf', [ -1, -1, 2147483647, 21 ] );
		PeriodicTable.table[99] = PeriodicTable.getChemicalElementObject( 'einsteinium', 	'Es', [ -1, -1, -1, 21 ] );
		PeriodicTable.table[100] = PeriodicTable.getChemicalElementObject( 'fermium', 		'Fm', [ -1, -1, -1, 23 ] );
		PeriodicTable.table[101] = PeriodicTable.getChemicalElementObject( 'mendelevium',	'Md', [ -1, -1, -1, 31 ] );
		PeriodicTable.table[102] = PeriodicTable.getChemicalElementObject( 'nobelium', 		'No', [ -1, -1, -1, 63 ] );
		PeriodicTable.table[103] = PeriodicTable.getChemicalElementObject( 'lawrencium', 	'Lr', [ -1, -1, -1, 65599 ] );
		PeriodicTable.table[104] = PeriodicTable.getChemicalElementObject( 'rutherfordium',	'Rf', [ -1, -1, -1, 383 ] );
		PeriodicTable.table[105] = PeriodicTable.getChemicalElementObject( 'dubnium', 		'Db', [ -1, -1, -1, 1407 ] );
		PeriodicTable.table[106] = PeriodicTable.getChemicalElementObject( 'seaborgium', 	'Sg', [ -1, -1, -1, 5503 ] );
		PeriodicTable.table[107] = PeriodicTable.getChemicalElementObject( 'bohrium', 		'Bh', [ -1, -1, -1, 21887 ] );
		PeriodicTable.table[108] = PeriodicTable.getChemicalElementObject( 'hassium', 		'Hs', [ -1, -1, -1, 22015 ] );
		PeriodicTable.table[109] = PeriodicTable.getChemicalElementObject( 'meitnerium', 	'Mt', [ -1, -1, -1, 22527 ] );
		PeriodicTable.table[110] = PeriodicTable.getChemicalElementObject( 'darmstadtium',	'Ds', [ -1, -1, -1, 24575 ] );
		PeriodicTable.table[111] = PeriodicTable.getChemicalElementObject( 'roentgenium',	'Rg', [ -1, -1, -1, 32767 ] );
		PeriodicTable.table[112] = PeriodicTable.getChemicalElementObject( 'copernicium',	'Cn', [ -1, -1, -1, 65535 ] );
		PeriodicTable.table[113] = PeriodicTable.getChemicalElementObject( 'nihonium', 		'Nh', [ -1, -1, -1, 131071 ] );
		PeriodicTable.table[114] = PeriodicTable.getChemicalElementObject( 'flerovium', 	'Fl', [ -1, -1, -1, 393215 ] );
		PeriodicTable.table[115] = PeriodicTable.getChemicalElementObject( 'moscovium', 	'Mc', [ -1, -1, -1, 1441791 ] );
		PeriodicTable.table[116] = PeriodicTable.getChemicalElementObject( 'livermorium',	'Lv', [ -1, -1, -1, 1572863 ] );
		PeriodicTable.table[117] = PeriodicTable.getChemicalElementObject( 'tennessine', 	'Ts', [ -1, -1, -1, 2097151 ] );
		PeriodicTable.table[118] = PeriodicTable.getChemicalElementObject( 'oganesson', 	'Og', [ -1, -1, -1, 4194303 ] );
	}

	static getChemicalElementObject( name, symbol, config ) {
		return { 'name': name, 'symbol': symbol, 'config': new ElemConfig( config ) };
	}

} // ---------------------------------------------


PeriodicTable.init();

module.exports = PeriodicTable;