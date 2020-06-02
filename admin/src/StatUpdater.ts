import UpdaterBase from "./UpdaterBase.js";
import { Statistics } from "../../common/messages.js";


/**
 * Перевод миллисекунд в минуты с округлением
 * @param ms Миллисекунды
 */
function msToMin( ms: number ): number
{
	return Math.round( ms / 60000 );
}



class StatUpdater extends UpdaterBase
{
	/** Нумерованный список со статистикой о клиентах */
	private list: HTMLUListElement;

	/** Счетчик онлайн клиентов */
	private onlineClients: HTMLElement;

	/** Общее количество клиентов, о которых имеется информация на сервере */
	private totalClients: HTMLElement;

	constructor()
	{
		super();

		this.list = document.getElementById( 'client-list' )! as HTMLUListElement;

		this.onlineClients = document.querySelector( '.client-counter > .online-players > span' ) as HTMLElement;
		this.totalClients = document.querySelector( '.client-counter > .all-players > span' ) as HTMLElement;

	}

	updateClient( name: string, bIsOnline: boolean, statistics?: Statistics, rating?: number ): void
	{
		const li: HTMLElement | null = document.getElementById( 'cl-' + name );
		
		if ( li == null )
		{
			/** Создание элемента
			 * - - - - - - - - - - - - - - - - - - - - - - - -
			 * <li id="cl-name" class="client" data-offline="true">
					<span class="client-name">Player3</span>
					<span class="client-games">14</span>
					<span class="client-victories">11</span>
					<span class="client-total-time">58</span>
					<span class="client-avg-time">4</span>
				</li>
			 */

			if ( statistics )
				this.list.insertAdjacentHTML(
					"beforeend",
					`<li id="${'cl-'+name}" class="client" data-online="${bIsOnline}" data-rating="${rating !== undefined ? rating : 0}">\
					\n	<span class="client-name">${name}</span>\
					\n	<span class="client-games">${statistics.games}</span>\
					\n	<span class="client-victories">${statistics.victories}</span>\
					\n	<span class="client-total-time">${msToMin( statistics.totalTime )}</span>\
					\n	<span class="client-avg-time">${msToMin( statistics.totalTime / statistics.games )}</span>\
					\n</li>`
				);
			else
				this.list.insertAdjacentHTML(
					"beforeend",
					`<li id="${'cl-'+name}" class="client" data-online="${bIsOnline}" data-rating="0">\
					\n	<span class="client-name">${name}</span>\
					\n	<span class="client-games">0</span>\
					\n	<span class="client-victories">0</span>\
					\n	<span class="client-total-time">0</span>\
					\n	<span class="client-avg-time">0</span>\
					\n</li>`
				);
		}
		else
		{
			li.dataset.online = bIsOnline.toString();

			if ( statistics )
			{
					li.getElementsByClassName( 'client-total-time' )[0].textContent = msToMin( statistics.totalTime ).toString();
					li.getElementsByClassName( 'client-avg-time' )[0].textContent = msToMin( statistics.totalTime / statistics.games ).toString();

					li.getElementsByClassName( 'client-games' )[0].textContent = statistics.games.toString();
					li.getElementsByClassName( 'client-victories' )[0].textContent = statistics.victories.toString();

					if ( rating !== undefined )
					li.dataset.rating = rating.toString();
			}
		}

		if ( rating !== undefined )
			this.sort();
	}

	updateClientCounter( online: number, total: number ): void
	{
		this.totalClients.textContent = total.toString();
		this.onlineClients.textContent = online.toString();
	}


	private sort()
	{
		this.list.querySelectorAll
		const nodeList = this.list.children;
		var itemsArray: HTMLElement[] = [];
		for (var i = 0; i < nodeList.length; i++)
			itemsArray.push( this.list.removeChild( nodeList[i] ) as HTMLElement );

		itemsArray.sort(
			( nodeA: HTMLElement, nodeB: HTMLElement ) =>
			{
				const numberA = parseInt( nodeA.dataset.rating! );
				const numberB = parseInt( nodeB.dataset.rating! );
				if ( numberA != numberB ) return numberA - numberB;
				
				const nameA = nodeA.id.slice(3);
				const nameB = nodeB.id.slice(3);
				if ( nameA < nameB ) return -1;
				if ( nameA > nameB ) return 1;
				return 0;
			}
		)
		.forEach(
			( node: HTMLElement ) =>
			{
				this.list.append( node );
			}
		);
	}

	clear(): void
	{
		while( this.list.hasChildNodes() )
			this.list.lastChild!.remove();
	}
}


export default StatUpdater;