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

    // Prototype function, action should be redefined on each card
    action(attackingCardData: Card, defendingCardData: Card): Card[] | Error {
        try {
            defendingCardData.health -= attackingCardData.attack
            return [attackingCardData, defendingCardData]
        } catch (err) {
            return new Error(`Action failed on card: ${this.name}\n${err}`)
        }
    }
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