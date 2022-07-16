/**
 * Prototype function
 * @param {Card} attackingCardData 
 * @param {Card} defendingCardData 
 * @returns {Card[] | Error}
 */
function _action(attackingCardData: Card, defendingEntity: Card, game: Game): Card[] | Error { 
    return new Error("Undefinded behavior, how did you even call this function?") 
}

function Zeus_Action(attackingCardData: Card, defendingEntity: Card, game: Game): Card[] | Error {
    defendingEntity.health -= attackingCardData.attack
    defendingEntity.props.health -= attackingCardData.props.attack
    return [attackingCardData, defendingEntity]
}

// [name: string, action: Function]
const Actions = new Map([
    ['Zeus', Zeus_Action]
])
module.exports.Actions = Actions