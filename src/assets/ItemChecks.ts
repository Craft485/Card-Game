interface _itemCheckResProps {
    success: boolean
    reasonForFailure?: string

}

class itemCheckRes {
    constructor (props: _itemCheckResProps) {

    }
}
// const Game = {
//     myHand: {},
//     myCardsInPlay: {},
//     opponentsHand: {},
//     isMyTurn: false,
//     opponentsHealth: 100,
//     myHealth: 100,
//     actionCount: 2,
//     attackingCard: null,
//     defendingCard: null,
//     maxCardCount: 7,
//     successfullAttackRes: true,
//     canPlayCard: false
// }
class clientSideGameState {
    attackingCard: Card
    defendingCard: Card
    opponentsHealth: number
    myHealth: number
    myCardsInPlay: { cardNameWithCount: Card }
    opponentsHand: { cardNameWithCount: Card }
}
// These functions are going to be ran client side so the game object is going to be different
// The Game arg here just represents for us what the client side Game object is going to look like
function check(Game: clientSideGameState): boolean | Error {
    return new Error("Undefined behavior, how do you manage this?")
}

function Nectar_Check(Game: clientSideGameState): boolean | Error {
    return Game.attackingCard?.props.typings?.isMajorOlympian
}

const Checks = new Map([
    ['Nectar', Nectar_Check]
])

module.exports.Checks = Checks