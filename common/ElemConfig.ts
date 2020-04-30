import SpinState from './SpinState.js';

/**
 * Электронная конфигурация химического элемента
 * ---------------------------------------------
 * Конфигурация храниться в бинарном виде.
 * 118 состояний спинов разделены на 4 группы:
 * 3 группы по 32 спина и 1 на 22.
 */
class ElemConfig
{
	/** Конфигурация элемента в бинарном виде */
	private _config: Int32Array;

	constructor( buf?: Int32Array | number[] )
	{
		if( buf === undefined )
		{
			this._config = new Int32Array( [ 0, 0, 0, 0 ] );
		}
		else
		{
			if( buf.length === 4 )
			{
				this._config = new Int32Array( buf );
				return;
			}

			this._config = new Int32Array( 4 );

			let i = 0;
			/* Если переданный буфер имеет нестандартную длину, 
			то необходимо скопировать, что есть,
			а оставшиеся значения заполнить нулями */
			for( ; i < buf.length && i < 4; i++ )
				this._config[ i ] = buf[ i ];
			for( ; i < 4; i++ )
				this._config[ i ] = 0;
		}
	}


	/**
	 * Сравнивает два элемента и возвращает истину только в том случае,
	 * если они правильные и эквивалентные
	 * 
	 * @param elem1 Конфигурация первого элемента
	 * @param elem2 Конфигурация второго элемента
	 */
	static isEqual( elem1: ElemConfig, elem2: ElemConfig ): boolean
	{
		for( let i = 0; i < 4; i++ )
			if( elem1._config[ i ] != elem2._config[ i ] )
				return false;

		return true;
	}


	/**
	 * Отмечен ли в данной конфигурации спин
	 * 
	 * @param spinNum Номер спина
	 */
	hasSpin( spinNum: number ): boolean
	{
		let mask = 1;
		mask <<= ( spinNum - 1 ) % 32;
		return ( this._config[ ( ( spinNum - 1 ) / 32 ) | 0 ] & mask ) != 0;
	}


	/**
	 * Отметить спин в объекте конфигурации элемента
	 * 
	 * @param spinNum Порядковый номер спина
	 * @param state Отмечен ли спин
	 */
	write( spinNum: number, state: boolean ): void
	{
		if( spinNum >= 1 && spinNum <= 118 )
			state ? this._add( spinNum - 1 )
				  :	this._remove( spinNum - 1 );
	}

	/**
	 * Отметить спин
	 * 
	 * @param index Индекс спина
	 */
	private _add( index: number ): void
	{
		let mask = 1;
		mask <<= index % 32;
		this._config[ ( index / 32 ) | 0 ] |= mask;
	}

	/**
	 * Снять отметку со спина
	 * 
	 * @param index Индекс спина
	 */
	private _remove( index: number ): void
	{
		let mask = 1;
		mask <<= index % 32;
		this._config[ ( index / 32 ) | 0 ] &= ~mask;
	}

	/**
	 * Получить числовой массив из битовой модели
	 */
	toArray(): SpinState[]
	{
		const result: SpinState[] = [ 118 ];

		let spin: number = 0;
		do
		{
			const i = spin / 32 | 0;
			const j = spin % 32;
			result[ spin ] = ( this._config[ i ] >> j ) & 1;
			spin++;
		}
		while( spin < 118 );

		return result;
	}

	/**
	 * Преобразовать в числовой массив.
	 * Небезопасен!
	 */
	toNumArray(): number[]
	{
		return [
			this._config[0],
			this._config[1],
			this._config[2],
			this._config[3],
		];
	}

	/**
	 * Получить массив, отражающий полное состояние диаграммы:
	 * отметки, попадания, промахи.
	 * 
	 * @param diagram Диаграмма
	 * @param shots Выстрелы по переданной диаграмме
	 */
	static getDiagramState( diagram: ElemConfig, shots: ElemConfig, onlyResult: boolean = false ): SpinState[]
	{
		const result: SpinState[] = [ 118 ];
		
		const diagramArray = diagram.toArray();
		const shotsArray = shots.toArray();

		const calcState: (i: number) => number = onlyResult ?
			( i: number ) =>
			{
				const state: number = 2 * shotsArray[ i ] + diagramArray[ i ];
				return state === SpinState.on ? SpinState.off : state;
			}
			:
			( i: number ) => 2 * shotsArray[ i ] + diagramArray[ i ];

		for( let i = 0; i < 118; i++ )
			result[ i ] = calcState( i );
		
		return result;
	}
} // ---------------------------------------------

export default ElemConfig;
