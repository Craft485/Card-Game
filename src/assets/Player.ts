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
        this.deck = props.deck
    }
}

module.exports.Player = Player