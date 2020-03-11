/** ============================================
 * Электронная конфигурация химического элемента
 * =============================================
 * @property {Int32Array[4]} config электронная конфигурация
 */
class ElemConfig {

	constructor( buf ) {
		if ( buf === undefined || ( !( buf instanceof Array ) && !( buf instanceof Int32Array ) ) ) {
			this.config = new Int32Array([0, 0, 0, 0]);
		}
		else {
			if( buf.length === 4 ) {
				this.config = new Int32Array( buf );
				return;
			}

			this.config = new Int32Array( 4 );
			let i = 0;
			for( ; i < buf.length && i < 4; i++ )
				this.config[i] = buf[i];
			for( ; i < 4; i++ )
				this.config[i] = 0;
		}
	}


	/**
	 * Сравнивает два элемента и возвращает истину только в том случае, если они правильные и эквивалентные
	 * @param {ElemConfig} elem1 Конфигурация первого элемента
	 * @param {ElemConfig} elem2 Конфигурация второго элемента
	 */
	static isEqual( elem1, elem2 ) {
		if( !( elem1 instanceof ElemConfig ) ||!( elem2 instanceof ElemConfig ) ) {
			log( `Compared objects are invalid ( Elem1: ${elem1 instanceof ElemConfig}, Elem2: ${elem2 instanceof ElemConfig} )`, 'Debug')
			return false;
		}

		if( elem1.config.length != 4 || elem2.config.length != 4 ) {
			log( `Some objects have not got configuration length ( Elem1: ${elem1.config.length}, Elem2: ${elem2.config.length})`, 'Debug')
		}

		for( let i = 0; i < 4; i++ )
			if( elem1.config[i] != elem2.config[i] )
				return false;
			
		return true;
	}


	/**
	 * Отмечен ли в данной конфигурации спин
	 * @param {Number} num Номер спина
	 */
	hasSpin( num ) {
		let mask = 1;
		mask <<= ( num - 1 ) % 32;
		return ( this.config[ ( ( num - 1 ) / 32 ) | 0 ] & mask ) != 0;
	}


	/**
	 * Отметить спин в объекте конфигурации элемента
	 * @param {Number} num Порядковый номер химического элемента
	 * @param {Bool} state Отмечен ли спин
	 */
	write( num, state ) {
		if( num >= 1 && num <= 118 )
			state ? this._add( num - 1 )
				: this._remove( num - 1 );
		else 
			log( new Error( `Write: Invalid element number : ${num}`, 'error' ));
	}

	/**
	 * Отметить спин
	 * @param {Number} index Индекс спина
	 */
	_add( index ) {
		let mask = 1;
		mask <<= index % 32;
		this.config[ ( index / 32 ) | 0 ] |= mask;
	}

	/**
	 * Снять отметку со спина
	 * @param {Number} index Индекс спина
	 */
	_remove( index ) {
		let mask = 1;
		mask <<= index % 32;
		this.config[ ( index / 32 ) | 0 ] &= ~mask;
	}

} // ---------------------------------------------

module.exports = ElemConfig;