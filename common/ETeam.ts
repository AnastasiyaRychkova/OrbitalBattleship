export enum ETeam {
	/** Красные */
	Actinoids,
	/** Синие */
	Lanthanoids,
	/** Не установлено */
	None
};

export function getAnotherTeam( team: ETeam ): ETeam
{
	return team === ETeam.Actinoids ? ETeam.Lanthanoids : ETeam.Actinoids;
}

export function getRandomTeam(): ETeam
{
	return Math.random() > 0.5 ? ETeam.Actinoids : ETeam.Lanthanoids;
}