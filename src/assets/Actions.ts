interface _actionResProps {
    attackingCard?: Card
    defendingCard?: Card
    defendingPlayer?: Player
    attackingPlayer?: Player
    specialConditions?: any
}
class actionRes {
    attackingCard?: Card
    defendingCard?: Card
    defendingPlayer?: Player
    attackingPlayer?: Player
    specialConditions?: any
    constructor (props: _actionResProps) {
        this.attackingCard = props.attackingCard || null
        this.defendingCard = props.defendingCard || null
        this.defendingPlayer = props.defendingPlayer || null
        this.attackingPlayer = props.attackingPlayer || null
        this.specialConditions = props.specialConditions || null
    }
}

function _action(attackingCardData: Card, defendingCardData: Card, game: Game, attackingCardCount: number, defendingCardCount: number): actionRes | Error { 
    return new Error("Undefinded behavior, how did you even call this function?") 
}

function Zeus_Action(attackingCardData: Card, defendingCardData: Card, game: Game, attackingCardCount: number, defendingCardCount: number): actionRes | Error {
    defendingCardData.health -= attackingCardData.attack
    defendingCardData.props.health -= attackingCardData.props.attack
    // Deal excess damage to player
    if (defendingCardData.health < 0) var defendingPlayer = cardDeath(defendingCardData, game, defendingCardCount)
    return new actionRes({ attackingCard: attackingCardData, defendingCard: defendingCardData, defendingPlayer: defendingPlayer })
}

function Nectar_Action(selectedFriendlyCard: Card, selectedOpponentCard: Card, game: Game, attackingCardCount: number, defendingCardCount: number): actionRes | Error {
    selectedFriendlyCard.health = selectedFriendlyCard.health + 5 >= selectedFriendlyCard.maxHealth ? selectedFriendlyCard.maxHealth : selectedFriendlyCard.health + 5
    selectedFriendlyCard.props.health = selectedFriendlyCard.health
    return new actionRes({ attackingCard: selectedFriendlyCard })
}

// [name: string, action: Function]
const Actions = new Map([
    ['Zeus', Zeus_Action], ['Nectar', Nectar_Action]
])
module.exports.Actions = Actions