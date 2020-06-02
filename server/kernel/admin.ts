import { Socket } from "socket.io";
import type { AnyServerMessage, AdminUser } from '../../common/messages.js';
import log from "./log.js";

type ClientType = {
	createAdminUser(): AdminUser,
};

let admin: Socket | null = null;

/**
 * Инициализировать работу средства мониторинга
 * @param socket Сокет
 * @param clientList Хранилище сервера
 */
export function start( socket: Socket, clientList: Map<string, ClientType> ): void
{
	admin = socket;
	updateAdmin( clientList );
}

/**
 * Отправить команду средству мониторинга
 * @param message Команда с сопутствующей информацией
 */
export function toAdmin( message: AnyServerMessage ): void
{
	admin?.emit( 'admin', message );
}

/** Обновить все содержимое страницы администратора */
function updateAdmin( clientList: Map<string, ClientType> ): void
{
	const result: AdminUser[] = [];
	for ( const info of clientList.values() )
	{
		const user: AdminUser = info.createAdminUser();
		result.push( user );
	}
	toAdmin(
		{
			action: 'reloadAdmin',
			model: result,
		}
	);
}