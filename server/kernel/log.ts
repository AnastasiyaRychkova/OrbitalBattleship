// import colors from 'colors/safe';
const colors = require('colors/safe');

/**
 * Сообщение пользователю служебной информации (логирование)
 * @param type Тип сообщения `INFO`|`LOG`|`Debug`|`Event`|`Error`|`Cheater`|`MATCH RESULT`
 * @param message Сообщение
 */
function log(
	type: string,
	message: string | Error,
	path?: string,
	...restMessages: any[]
) {
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
				colorFunc = colors.yellow;
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
		console.log( colorFunc( type ), colorFunc( path !== undefined ? ( path + ': ' ) : '' ), colorFunc( message ), ...restMessages );
	}
}

export default log;