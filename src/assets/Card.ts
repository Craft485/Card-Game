const { cards } = require('../src/assets/Cards.json')
// const { Actions } = require('./Actions.js')

interface _CardProps {
    name: string,
    imgURL?: string
    health?: number,
    attack?: number,
    defense?: number,
    cost?: number,
    typings?: {
        isMajorOlympian?: boolean
        isPrimordial?: boolean
        isUndead?: boolean
        isInPlay?: boolean
    }
}

class Card {
    props: _CardProps
    name: string
    health?: number
    attack?: number
    defense?: number
    cost?: number
    imgURL?: string
    constructor (props: _CardProps) {
        this.props = props
        this.name = props.name || "Could not find card name."
        this.health = props.health || 0
        this.attack = props.attack || 0
        this.defense = props.defense || 0
        this.cost = props.cost || 0
        this.imgURL = props.imgURL || null
    }

    // Prototype/default function, action may be redefined on certain cards this is just a base
    action(attackingCardData: Card, defendingCardData: Card, game: Game, attackingCardCount: number, defendingCardCount: number): actionRes | Error {
        defendingCardData.health -= attackingCardData.attack
        defendingCardData.props.health -= attackingCardData.props.attack
        // Deal excess damage to player
        console.log(defendingCardCount)
        if (defendingCardData.health < 0) var defendingPlayer = cardDeath(defendingCardData, game, defendingCardCount)
        return new actionRes({ attackingCard: attackingCardData, defendingCard: defendingCardData, defendingPlayer: defendingPlayer || null })
    }
}

function cardDeath(defendingCardData: Card, game: Game, defendingCardCount: number): Player {
    const defendingPlayer: Player = game.Players.find((p: Player) => !p.isTakingTurn)
    defendingPlayer.health -= Math.abs(defendingCardData.health)
    defendingPlayer.props.health -= Math.abs(defendingCardData.health)
    delete game.playingField[defendingPlayer.id].cards[defendingCardData.name.includes('_') ? defendingCardData.name : `${defendingCardData.name}_${defendingCardCount}`]
    return defendingPlayer
}
const _cardList = {}

cards.forEach((cardData: Card) => {
    const cardAction/**: Function */ = Actions.get(cardData.name) || null
    // Create a new card based on what we pulled from the json file
    const newCard: Card = new Card(cardData)
    // Override action prototype
    if (cardAction !== null) newCard.action = cardAction
    _cardList[cardData.name] = newCard
})

module.exports.Card = Card
module.exports._cardList = _cardList