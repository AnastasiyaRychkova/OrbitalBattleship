import UpdaterBase from "./UpdaterBase.js";
import { Statistics, AdminUser } from "../../common/messages.js";


/**
 * Перевод миллисекунд в минуты с округлением
 * @param ms Миллисекунды
 */
function msToMin( ms: number ): number
{
	return Math.round( ms / 60000 );
}

/**
 * Среднее арифметическое
 * @param A Делимое
 * @param B Делитель
 */
function avg( A: number, B: number ): number
{
	return B ? A / B : 0;
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
					\n	<span class="client-avg-time">${msToMin( avg( statistics.totalTime, statistics.games ) )}</span>\
					\n	<span class="client-rating">${rating?.toFixed(2) || 0.00}</span>\
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
					\n	<span class="client-rating">0.00</span>\
					\n</li>`
				);
		}
		else
		{
			li.dataset.online = bIsOnline.toString();

			if ( statistics )
			{
					li.getElementsByClassName( 'client-total-time' )[0].textContent = msToMin( statistics.totalTime ).toString();
					li.getElementsByClassName( 'client-avg-time' )[0].textContent = msToMin( avg( statistics.totalTime, statistics.games ) ).toString();

					li.getElementsByClassName( 'client-games' )[0].textContent = statistics.games.toString();
					li.getElementsByClassName( 'client-victories' )[0].textContent = statistics.victories.toString();

					if ( rating !== undefined )
					{
						li.dataset.rating = rating.toString();
						li.getElementsByClassName( 'client-rating' )[0].textContent = rating.toFixed(2).toString();
					}
					
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

		const nodeList: HTMLCollection = this.list.children;
		const n = nodeList.length;
		if ( n === 0 )
			return;

		const itemsArray: HTMLElement[] = [];
		for (var i = n - 1; i >= 0; i--)
		{
			const elem = nodeList.item(i);
			itemsArray.push( elem as HTMLElement );
			elem?.remove();
		}

		itemsArray.sort(
			( nodeA: HTMLElement, nodeB: HTMLElement ) =>
			{
				const numberA = parseFloat( nodeA.dataset.rating! );
				const numberB = parseFloat( nodeB.dataset.rating! );
				if ( numberA != numberB ) return numberB - numberA;

				const nameA = nodeA.id;
				const nameB = nodeB.id;
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
		console.log( 'SORT' );
	}

	clear(): void
	{
		while( this.list.hasChildNodes() )
			this.list.lastChild!.remove();
	}

	reload( model: AdminUser[] ): void
	{
		this.clear();

		for ( const [ name, info, rating ] of model )
			this.list.insertAdjacentHTML(
				"beforeend",
				`<li id="${'cl-'+name}" class="client" data-online="${info.bIsOnline}" data-rating="${rating !== undefined ? rating : 0}">\
				\n	<span class="client-name">${name}</span>\
				\n	<span class="client-games">${info.statistics.games}</span>\
				\n	<span class="client-victories">${info.statistics.victories}</span>\
				\n	<span class="client-total-time">${msToMin( info.statistics.totalTime )}</span>\
				\n	<span class="client-avg-time">${msToMin( avg( info.statistics.totalTime, info.statistics.games ) )}</span>\
				\n	<span class="client-rating">${rating?.toFixed(2) || 0.00}</span>\
				\n</li>`
			);

		this.sort();
	}
}


export default StatUpdater;