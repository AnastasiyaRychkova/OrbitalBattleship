type AppModel = {
	openDiagram( player: string ): void;
	closeDiagram(): void;
}

/**
 * Обработка действий пользователя
 */
class Controller
{
	/** Открыть окно с диаграммой данного игрока */
	openDiagram: ( event: Event ) => void;

	reopenDiagram: ( event: Event ) => void;

	constructor( model: AppModel )
	{
		this.openDiagram = ( event: Event ) => {
			model.openDiagram( ( event.currentTarget as HTMLElement ).id.slice( 2 ) );
		}

		this.reopenDiagram = ( event: Event ) => {
			const name: string | null = ( event.currentTarget as HTMLElement ).textContent;
			model.openDiagram( name != null ? name : '' );
		}

		document.getElementById( 'd-close' )!.addEventListener(
			'click',
			() =>
			{
				model.closeDiagram();
			}
		);
	}

	clientOnHover( event: Event ): void
	{
		const elem = event.currentTarget as HTMLElement;
		let client;
		let player;
		let name: string = '';

		if ( elem.className === 'client' )
		{
			name = elem.id.slice( 3 );
			client = elem;
			player = document.getElementById( 'g-'+name );
		}
		else
		{
			name = elem.id.slice( 2 );
			player = elem;
			client = document.getElementById( 'cl-'+name );
		}
		
		if ( player == null || client == null )
			return;

		client.setAttribute( 'data-selected', 'true' );
		player.setAttribute( 'data-selected', 'true' );
	}

	clientOnUnhover( event: Event ): void
	{
		const elem = event.currentTarget as HTMLElement;
		let client;
		let player;
		let name: string = '';
		if ( elem.className === 'client' )
		{
			name = elem.id.slice( 3 );
			client = elem;
			player = document.getElementById( 'g-'+name );
		}
		else
		{
			name = elem.id.slice( 2 );
			player = elem;
			client = document.getElementById( 'cl-'+name );
		}

		client?.removeAttribute( 'data-selected' );
		player?.removeAttribute( 'data-selected' );
	}
}


export default Controller;