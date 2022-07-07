/**
 * Prototype function
 * @param {Card} attackingCardData 
 * @param {Card} defendingCardData 
 * @returns {Card[] | Error}
 */
function _action(attackingCardData: Card, defendingCardData: Card): Card[] | Error { 
    return new Error("Undefinded behavior, how did you even call this function?") 
}

function Zeus_Action(attackingCardData: Card, defendingCardData: Card): Card[] | Error {
    defendingCardData.health -= attackingCardData.attack
    return [attackingCardData, defendingCardData]
}

// [name: string, action: Function]
const Actions = new Map([
    ['Zeus', Zeus_Action]
])
module.exports.Actions = Actions