class Game {
    Players: Array<Player>
    playingField: { player?: {id?: string, cards?: {}} }
    discard: Array<Card>
    constructor () {
        this.Players = []
        this.playingField = {}
        this.discard = []
    }
    join(id: string): void {
        if (this.Players.length < 3) {
            const f = this.Players.length === 0 ? true : false
            // Multiple test decks are needed because Objects are reference types, meaning 2 games at the same time won't work currently.
            // This should be fixed once I do db stuff
            const p = new Player({ id: id, deck: f ? _tDeck1 : _tDeck2, isTakingTurn: f, health: 100/*, mana: 5 */})
            this.Players.push(p)
            // Init players field object
            this.playingField[id] = {id: id, cards: {}}
        }
    }
    playCard(cardData: Card, socketID: string): void {
        if (!cardData.props.typings.isItem) {
            let count = 1
            const gameInstance = this
            !function recurse() {
                if (!gameInstance.playingField[socketID].cards[cardData.name + '_' + count]) {
                    gameInstance.playingField[socketID].cards[cardData.name + '_' + count] = cardData
                } else {
                    count++
                    return recurse()
                }
            }()
        } else {
            // Add item to discard
            this.discard.push(cardData)
        }
    }
    drawCard(playerID: string): Card | Error {
        // Get the player
        const player: Player = this.Players.find(player => player.props.id === playerID)
        // Draw a card, make sure we actually can draw a card
        if (/*player.isTakingTurn &&*/ this.Players.length === 2) {
            const card: Card = player.props.deck.draw()
            if (!card) console.error('Could not draw card')
            return card
        }
    }
    endTurn() {
        // Simply update game state
        this.Players[0].isTakingTurn = this.Players[0].isTakingTurn ? false : true
        this.Players[1].isTakingTurn = this.Players[1].isTakingTurn ? false : true
    }
    isGameOver(): { w: Player, l: Player } | Boolean {
        const P1 = this.Players[0]
        const P2 = this.Players[1]
        if (P1.props.health <= 0 || P2.props.health <= 0) {
            return { w: P1.props.health > 0 ? P1 : P2, l: P1.props.health <= 0 ? P1 : P2 }
        }
        return false
    }
}

module.exports.Game = Game