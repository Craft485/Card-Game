const { cards, items } = require('../src/assets/Cards.json')

interface _CardProps {
    name: string
    imgURL?: string
    description?: string
    health?: number
    attack?: number
    cost?: number
    typings?: {
        isMajorOlympian?: boolean
        isPrimordial?: boolean
        isUndead?: boolean
        isInPlay?: boolean
        isItem?: boolean
    }
}

class Card {
    props: _CardProps
    name: string
    description: string
    health: number
    maxHealth: number
    attack?: number
    cost?: number
    imgURL?: string
    constructor (props: _CardProps) {
        this.props = props
        this.name = props.name || "Could not find card name."
        this.description = props.description || 'Placeholder'
        this.health = props.health || 0
        this.maxHealth = props.health
        this.attack = props.attack || 0
        this.cost = props.cost || 0
        this.imgURL = props.imgURL || null
    }

    // Prototype/default function, action may be redefined on certain cards this is just a base
    action(attackingCardData: Card, defendingCardData: Card, game: Game, attackingCardCount: number, defendingCardCount: number): actionRes | Error {
        defendingCardData.health -= attackingCardData.attack
        defendingCardData.props.health -= attackingCardData.props.attack
        // Deal excess damage to player
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

interface _ItemProps extends _CardProps {
    requireEnemyCardSelection?: boolean
    requireMyOwnCardSelection?: boolean
}

class Item extends Card {
    requireEnemyCardSelection: boolean
    requireMyOwnCardSelection: boolean
    checkForCanBePlayed: Function
    constructor(props: _ItemProps) {
        super(props)
        this.props = props
        this.props.typings.isItem = true
        this.requireEnemyCardSelection = props.requireEnemyCardSelection || false
        this.requireMyOwnCardSelection = props.requireMyOwnCardSelection || false
        this.checkForCanBePlayed = () => { throw new Error('Undefined Item check') }
    }
}

const _cardList = {}

cards.forEach((cardData: _CardProps | _ItemProps) => {
    const cardAction/**: Function */ = Actions.get(cardData.name) || null
    // Create a new card based on what we pulled from the json file
    const newCard: Card | Item = !cardData.typings.isItem ? new Card(cardData) : new Item(cardData)
    // Override action prototype
    if (cardAction !== null) newCard.action = cardAction
    if (newCard instanceof Item) newCard.checkForCanBePlayed = Checks.get(cardData.name)
    _cardList[cardData.name] = newCard
})

module.exports.Card = Card
module.exports.Item = Item
module.exports._cardList = _cardList