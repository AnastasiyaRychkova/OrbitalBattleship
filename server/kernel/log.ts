import colors from 'colors/safe';

/**
 * Сообщение пользователю служебной информации (логирование)
 * @param type Тип сообщения
 * @param message Сообщение
 */
function log( type: string, message: string | Error, path?: string ) {
	if( message instanceof Error )
		switch (type) {
			case 'Error':
				console.error( message );
				break;
			case 'Warn':
				console.warn( message );
				break;
		
			default:
				console.log( message.stack );
				break;
	}
	else {
		let colorFunc: ( str: string ) => string;
		switch (type) {
			case 'INFO':
				colorFunc = colors.black;
				type += ':';
				break;
			case 'LOG':
			case 'Debug':
				colorFunc = colors.gray;
				type += ':';
				break;
			case 'Event':
				colorFunc = colors.green;
				type += ':';
				break;
			case 'Error':
			case 'Cheater':
				colorFunc = colors.red;
				type += ':';
				break;
			case 'MATCH RESULT':
				colorFunc = colors.bgBlue;
				type += '~~~~~';
				break;
			default:
				type += '>';
				colorFunc = colors.white;
				break;
		}
		console.log( colorFunc( type ), colorFunc( path !== undefined ? ( path + ': ' ) : '' ), colorFunc( message ) );
	}
}

export default log;