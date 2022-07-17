interface _PlayerProps {
    deck: Deck
    id: string | number
    health: number
    isTakingTurn?: boolean
}

class Player {
    props: _PlayerProps
    deck: Deck
    id: string | number
    health: number
    isTakingTurn: boolean
    constructor (props: _PlayerProps) {
        this.props = props
        this.id = props.id
        this.deck = props.deck
        this.isTakingTurn = props.isTakingTurn || false
    }
}

module.exports.Player = Player