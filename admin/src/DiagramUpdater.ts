import UpdaterBase from "./UpdaterBase.js";
import type { PlayerUpdInfo } from "./types.js";
import { EState, ETeam, ElemConfig, SpinState } from '../../common/general.js';
import type { ChemicalElement, UserInfo, DiagramView } from '../../common/messages.js';
import { stateTooltip } from "./tooltips.js";

type ControllerType = {
	reopenDiagram( event: Event ): void;
}


class DiagramUpdater extends UpdaterBase
{

	private bHidden: boolean;
	/** Имя клиента, информация о котором отображается в данном окне */
	private name: HTMLElement;

	private opponentName: HTMLElement;

	private opponentStatus: HTMLElement;

	/** Окно с диаграммой
	 * * Закрыто ли: `[data-close = boolean]`
	 * * Команда игрока: `[data-team = "Actinoids" | "Lanthanoids"]`
	 * * Статус соединения: `[data-online = boolean]`
	 */
	private window: HTMLElement;

	/** Элемент, отображающий иконку состояния 
	 * * Состояние игры: `class="state periodictable|preparing|match|celebration"`
	*/
	private state: HTMLElement;

	private opponentState: HTMLElement;

	/** Химический элемент, загаданный игроком
	 * * Элемент: `.innerHTML( '<sub>${elem.number}</sub>${elem.symbol}' )`
	 */
	private element: HTMLElement;

	/** Иконка, отображающая прошла ли диаграмма проверку 
	 * * Корректность: `[data-active = boolean]`
	*/
	private check: HTMLElement;

	/** Иконка, отображающая имеет ли игрок право хода
	 * * Право хода: `[data-active = boolean]`
	 */
	private rightMove: HTMLElement;

	/** Непосредственно сама диаграмма
	 * * Начался ли матч: `[data-match = boolean]`
	 */
	private diagram: HTMLElement;

	/** Массив со стрелками
	 * * Состояние стрелки: `[data-spin-state = "off|on|hit|miss"]`
	 * * Индекс спина: `[data-spin = number]`
	 */
	private spins: HTMLCollectionOf<SVGSVGElement>;

	/** Метод, который необходимо повесить на элемент игрока, чтобы открыть окно диаграммы */
	reopenDiagram: ( event: Event ) => void;

	constructor()
	{
		super();
		this.bHidden 	= true;
		this.name 		= document.getElementById( 'player-name' )!;

		this.window 	= document.getElementById( 'diagram' )!;
		this.state 		= document.getElementById( 'player-state' )!;
		this.element 	= document.getElementById( 'element' )!;
		this.check 		= document.getElementById( 'd-check' )!;
		this.rightMove  = document.getElementById( 'rm' )!;
		this.diagram 	= document.getElementById( 'diagram-grid' )!;
		this.spins 		= this.diagram.getElementsByTagName( 'svg' );
		this.opponentName 	= document.getElementById( 'opponent-name' )!;
		this.opponentStatus = document.getElementById( 'opponent' )!;
		this.opponentState 	= document.getElementById( 'opponent-state' )!;

		this.reopenDiagram = () => {};
	}

	init( controller: ControllerType ): void
	{
		this.reopenDiagram = controller.reopenDiagram;
	}

	updateClient( name: string, bIsOnline: boolean ): void
	{
		if ( this.bHidden )
			return;

		if ( name === this.opponentName.textContent )
		{
			this.updOpConnection( bIsOnline );
			return;
		}

		if ( name === this.name.textContent )
			this.updConnection( bIsOnline );
	}

	updatePlayer( player: PlayerUpdInfo ): void
	{
		if ( this.bHidden )
			return;

		if ( player.name === this.opponentName.textContent )
		{
			if ( player.state )
				this.updOpState( player.state );
			return;
		}

		if ( player.name !== this.name.textContent )
			return;

		for (const prop in player) {
			const clientData = player[ prop as keyof PlayerUpdInfo ];
			if ( clientData === undefined )
				continue;

			switch ( prop ) {
				case 'state':
					this.updState( clientData as EState );
					break;

				case 'team':
					this.updTeam( clientData as ETeam );
					break;

				case 'element':
					this.updElement( clientData as ChemicalElement );
					break;

				case 'diagramCheck':
					this.updDiagramCheck( clientData as boolean );
					break;

				case 'rightMove':
					this.updRightMove( clientData as boolean );
					break;

				case 'diagram':
					this.updDiagram( clientData as DiagramView );
					break;
			}
			
		}
	}

	updateDiagramHidden( newHidden: boolean, info?: UserInfo, opponent?: UserInfo ): void
	{
		if ( newHidden )
		{
			this.window.dataset.close = 'true';
			this.updName( '', this.name );
			this.updName( '', this.opponentName );
		}
		else
		{
			if ( info === undefined )
				return;

			this.opponentName.removeEventListener(
				'click',
				this.reopenDiagram
			);
			this.updName( info.client.name, this.name );
			this.updConnection( info.client.bIsOnline );

			this.updState( info.player.state );
			this.updTeam( info.player.team );
			this.updElement( info.player.element );
			this.updDiagramCheck( info.player.diagramCheck );
			this.updDiagram( info.player.diagram );
			this.updRightMove( info.player.rightMove );

			console.log( 'updateDiagramHidden', newHidden, info, opponent );

			if ( opponent === undefined )
			{
				this.updName( 'unknown', this.opponentName );
				this.updOpConnection( false );
				this.updOpState( EState.Celebration );
			}
			else
			{
				this.updName( opponent.client.name, this.opponentName );
				this.updOpConnection( opponent.client.bIsOnline );
				this.updOpState( opponent.player.state );

				this.opponentName.addEventListener(
					'click',
					this.reopenDiagram
				);
			}

			this.window.dataset.close = 'false';
		}

		this.bHidden = newHidden;
	}

	removePlayer( name: string ): void
	{
		if ( this.bHidden )
			return;

		if ( name === this.name.textContent )
		{
			this.updateDiagramHidden( true );
			return;
		}
		
		if ( name === this.opponentName.textContent )
		{
			this.updName( 'unknown', this.opponentName );
			this.updOpConnection( false );
			this.updOpState( EState.Celebration );
			this.opponentName.dataset.disable = 'true';
			this.opponentName.removeAttribute( 'data-tooltip' );
			this.opponentName.removeEventListener( 'click', this.reopenDiagram );
		}
	}

	/**
	 * Обновить отображение имени клиента
	 * @param name Имя клиента
	 */
	private updName( name: string, node:HTMLElement ): void
	{
		node.textContent = name;
	}

	/**
	 * Обновить отображение статуса соединения
	 * @param bIsOnline Статус соединения
	 */
	private updConnection( bIsOnline: boolean ): void
	{
		this.window.dataset.online = bIsOnline.toString();
	}

	/**
	 * Обновить отображение статуса соединения соперника
	 * @param bIsOnline Статус соединения
	 */
	private updOpConnection( bIsOnline: boolean ): void
	{
		this.opponentStatus.dataset.online = bIsOnline.toString();
	}

	/**
	 * Обновить отображение состояния игры
	 * @param state Состояние игры
	 */
	private updState( state: EState ): void
	{
		this.state.className = "state " + EState[ state ].toLowerCase();
		this.state.dataset.tooltip = stateTooltip.get( state );
		this.diagram.dataset.match = ( state === EState.Match || state === EState.Celebration ).toString();
	}

	
	/**
	 * Обновить отображение состояния игры
	 * @param state Состояние игры
	 */
	private updOpState( state: EState ): void
	{
		this.opponentState.className = "state " + EState[ state ].toLowerCase();
		this.opponentState.dataset.tooltip = stateTooltip.get( state );
	}

	/**
	 * Обновить отображение команды игрока
	 * @param team Команда игрока
	 */
	private updTeam( team: ETeam ): void
	{
		this.window.dataset.team = ETeam[ team ];
	}

	/**
	 * Обновить отображение загаданного элемента
	 * @param element Загаданный элемент
	 */
	private updElement( element: ChemicalElement ): void
	{
		if ( element.number < 1 )
			this.element.innerHTML = '<sub>??</sub>??';
		else
			this.element.innerHTML = `<sub>${element.number}</sub>${element.symbol}`;
	}

	/**
	 * Обновить отображение результата проверки заполнения диаграммы
	 * @param checkResult Результат проверки заполнения диаграммы
	 */
	private updDiagramCheck( checkResult: boolean ): void
	{
		this.check.dataset.active = checkResult.toString();
	}

	/**
	 * Обновить отображение права хода
	 * @param rightMove Право хода
	 */
	private updRightMove( rightMove: boolean ): void
	{
		this.rightMove.dataset.active = rightMove.toString();
	}

	/**
	 * Обновить отображение диаграммы
	 * @param diagram Диаграмма
	 */
	private updDiagram( diagram: DiagramView ): void
	{
		const mainArray: number[] = new ElemConfig( diagram.main ).toArray();
		const baseArray: number[] = new ElemConfig( diagram.base ).toArray();


		for ( const spin of this.spins ) {
			const i: number = parseInt( spin.getAttribute( 'data-spin' )! );
			spin.dataset.spinState = SpinState[ 2 * mainArray[ i ] + baseArray[ i ] ];
		}
	}
}


export default DiagramUpdater;