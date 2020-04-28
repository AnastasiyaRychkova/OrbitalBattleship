import UpdaterBase from "./UpdaterBase.js";
import type { ClientStatistics } from './types.js';

class StatUpdater extends UpdaterBase
{
	/** Нумерованный список со статистикой о клиентах */
	private list: HTMLElement;

	/** Счетчик онлайн клиентов */
	private onlineClients: HTMLElement;

	/** Общее количество клиентов, о которых имеется информация на сервере */
	private totalClients: HTMLElement;

	constructor()
	{
		super();

		this.list = document.getElementById( 'client-list' )!;

		this.onlineClients = document.querySelector( '.client-counter > .online-players > span' ) as HTMLElement;
		this.totalClients = document.querySelector( '.client-counter > .all-players > span' ) as HTMLElement;

	}

	updateClient( name: string, bIsOnline: boolean, statistics?: ClientStatistics ): void
	{
		const li: HTMLElement | null = document.getElementById( 'cl-' + name );
		
		if ( li == null )
		{
			/** Создание элемента
			 * - - - - - - - - - - - - - - - - - - - - - - - -
			 * <li class="client" data-offline="true">
					<span class="client-name">Player3</span>
					<span class="client-games">14</span>
					<span class="client-victories">11</span>
					<span class="client-total-time">58</span>
					<span class="client-avg-time">4</span>
				</li>
			 */
			this.list.insertAdjacentHTML(
				"beforeend",
				`<li class="client" data-online="${bIsOnline}">\
				\n	<span class="client-name">${name}</span>\
				\n	<span class="client-games">${( statistics && statistics.counter ) ? statistics.counter.games : 0}</span>\
				\n	<span class="client-victories">${( statistics && statistics.counter ) ? statistics.counter.victories : 0}</span>\
				\n	<span class="client-total-time">${( statistics && statistics.timing ) ? statistics.timing.totalTime : 0}</span>\
				\n	<span class="client-avg-time">${( statistics && statistics.timing ) ? statistics.timing.AVGTime : 0}</span>\
				\n</li>`
			);
		}
		else
		{
			li.setAttribute( 'data-online', bIsOnline.toString() );

			if ( statistics?.counter )
			{
				if ( statistics.counter.games !== undefined ) // TODO: сортировка
				{
					li.getElementsByClassName( 'client-games' )[0].textContent = statistics.counter.games.toString();
					li.getElementsByClassName( 'client-victories' )[0].textContent = statistics.counter.victories.toString();

				}

				if ( statistics.timing !== undefined )
				{
					li.getElementsByClassName( 'client-total-time' )[0].textContent = statistics.timing.totalTime.toString();
					li.getElementsByClassName( 'client-avg-time' )[0].textContent = statistics.timing.AVGTime.toString();
				}
			}
		}
	}

	updateClientCounter( online: number, total: number ): void
	{
		this.totalClients.textContent = total.toString();
		this.onlineClients.textContent = online.toString();
	}
}


export default StatUpdater;