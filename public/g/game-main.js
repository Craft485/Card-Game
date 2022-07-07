const socket = io({transports: ['websocket'], upgrade: false})

const Game = {
    myHand: {},
    myCardsInPlay: {},
    opponentsHand: {},
    isMyTurn: false,
    opponentsHealth: 500,
    myHealth: 500,
    actionCount: 2,
    attackingCard: null,
    defendingCard: null,
    maxCardCount: 7,
    myCardCount: 0,
    oppCardCount: 0,
    myCardCountInPlay: 0,
    oppCardCountInPlay: 0
}

const _opHand  = document.getElementById('opponent-hand')
const _opField = document.getElementById('opponent-played')
const _myField = document.getElementById('my-played')
const _myHand  = document.getElementById('my-hand')

function generateHTML(card, count) {
    const parent = document.createElement('div')
    // I'm aware this line makes little sense, but it works!
    parent.className = `card ${count ? card.name + count + ' ' + card.name : card.name}`
    // We don't use ids because of the scenario of a Poseidon being played by each player, it can't be unique
    // parent.id = count ? card.name + count : card.name
    // parent.style.backgroundImage = card.props.imageURL

    const title = document.createElement('h3')
    title.innerHTML = `<b>${card.name}</b>`

    const stats = document.createElement('div')
    stats.innerHTML = `<span class="card-defense-display">${card.props?.defense || card.defense}</span> / <span class="card-health-display">${card.props?.health || card.health}</span> / <span class="card-attack-display">${card.props?.attack || card.attack}</span>`

    parent.appendChild(title)
    parent.appendChild(document.createElement('br'))
    parent.appendChild(stats)

    return parent
}

const baseCardWithBG = function() {
    let _ = document.createElement('div')
    _.style.backgroundImage = `url(../favicon.png)`
    _.className = 'card card-b'
    return _
}

function draw() {
    if (_myHand.children.length < 7) socket.emit('draw')
}

function addOpponentsCardToPlay(newCard) {
    // Remove card from hand, doesn't matter which one
    _opHand.children[0].remove()
    // Create html element based off of card info and append new card
    const card = generateHTML(newCard)
    _opField.appendChild(card)
}

function endTurn() {
    socket.emit('turn-end')
    Game.isMyTurn = false
    Game.attackingCard = null
    Game.defendingCard = null
}

function play(cardNameWithCount) {
    console.log("Play card event")
    // Update client game state and ui as well as send update to server
    const card = Game.myHand[cardNameWithCount]
    // There are two different counts at play here, my brain doesn't enjoy this
    const cardName = cardNameWithCount.split('_')[0]
    if (card) {
        let count = 1
        !function recurse() {
            if (!Game.myCardsInPlay[`${cardName}_${count}`]) {
                Game.myCardsInPlay[`${cardName}_${count}`] = card
            } else {
                count++
                return recurse()
            }
        }()
        Game.myCardsInPlay[cardName + `_${count}`] = card
        delete Game.myHand[cardNameWithCount]
        // Server doesn't care what count is
        socket.emit('play', [cardName])
        // Update UI
        const newCard = generateHTML(card, `_${count}`)
        newCard.onclick = () => {
            Game.attackingCard = Game.myCardsInPlay[`${cardName}_${count}`]
            // There is a better way to do this yes, that isn't a question
            // Remove css class from all other cards in _myFeild
            for (let i = 0; i < _myField.children.length; i++) {
                _myField.children[i].classList.remove('card-select-for-action')
            }
            // Add css class to the newCard element
            newCard.classList.add('card-select-for-action')
        }
        _myField.appendChild(newCard)
    }
}

function drawCard() {
    if (Game.myCardCount === Game.maxCardCount) return
    // Add new card to "my-hand"
    const card = document.createElement('card')
    card.className = "card mycard"
    card.innerHTML = `<h1>test card</h1><br/><p>some card info</p><p class="card-data">some card data</p>`
    card.onclick = () => {
        if (Game.myCardCountInPlay === Game.maxCardCount) return
        document.getElementById('my-played').innerHTML += card.outerHTML
        const newCard = document.getElementById('my-played').children.item(document.getElementById('my-played').children.length - 1)
        card.classList.add('moving')
        newCard.style.visibility = 'hidden'
        card.style = `--new-x: ${newCard.getBoundingClientRect().x}px;
        --current-x: ${card.getBoundingClientRect().x}px;`
        setTimeout(() => {
            card.remove()
            Game.myCardCount--
            Game.myCardCountInPlay++
            newCard.style.visibility = 'visible'
        }, 1900)
    }
    document.getElementById('my-hand').appendChild(card)
    Game.myCardCount++
}

/**
 * Might not be needed
 */
function drawCardOp() {
    if (Game.oppCardCount === Game.maxCardCount) return
    // Add a new card to opponents hand
    const card = document.createElement('card')
    card.className = "card mycard"
    card.innerHTML = `<h1>test card</h1><br/><p>some card info</p><p class="card-data">some card data</p>`
    card.onclick = () => {
        if (Game.oppCardCountInPlay === Game.maxCardCount) return
        card.remove()
        document.getElementById('opponent-played').appendChild(card)
        Game.oppCardCount--
        Game.oppCardCountInPlay++
    }
    document.getElementById('opponent-hand').appendChild(card)
    Game.oppCardCount++
}

// This variable is apart of a very dumb fix to a very dumb problem
// The variable, and the associated code, is in place to
// start the game, without this logic, the server dies.
// This variable is set to true if we haven't yet generated the starting hand
let z = true

socket.on('confirm', (msg, s) => {
    console.info(msg)
    Game.isMyTurn = s || false
    // TODO: Use document#querySelector here
    _myHand.children[0].style.stroke = Game.isMyTurn ? 'blue' : 'red'
    _opHand.children[0].style.stroke = Game.isMyTurn ? 'red' : 'blue'
})

socket.on('err', errmsg => console.error(`Err: ${errmsg}`))

socket.on('game-begin', () => {
    // Gen initial hand
    if (Game.isMyTurn) {
        for (let i = 0; i < 7; i++) socket.emit('draw', [{ isGenStartUp: true }])
        endTurn()
        z = false
    }
    for (let i = 0; i < 7; i++) _opHand.appendChild(baseCardWithBG())
})

socket.on('turn-ended', () => {
    console.log('Turn ended, it is now your turn')
    Game.isMyTurn = true
    if (z) {
        for (let i = 0; i < 7; i++) socket.emit('draw', [{ isGenStartUp: true }])
        endTurn()
        z = false
    }
})

socket.on('no-play', msg => console.error(msg))

socket.on('newCard', card => {
    console.log(card)
    if (card) {
        // Client Side Game State
        let count = 1
        // Concise documentation is an unrealistic expectation
        !function recurse() {
            if (!Game.myHand[`${card.name}_${count}`]) {
                Game.myHand[`${card.name}_${count}`] = card
            } else {
                count++
                return recurse()
            }
        }()
        // UI
        const e = generateHTML(card, `_${count}`)
        e.onclick = () => { play(card.name + `_${count}`); e.remove() }
        _myHand.appendChild(e)
    }
})

socket.on('op-new-card', () => {
    _opHand.appendChild(baseCardWithBG())
})

socket.on('op-play', card => {
    console.log("Opponent played card")
    // Update game state
    let count = 1
    !function recurse() {
        if (!Game.opponentsHand[`${card.name}_${count}`]) {
            Game.opponentsHand[`${card.name}_${count}`] = card
        } else {
            count++
            return recurse()
        }
    }()
    // Update UI
    _opHand.children[0].remove()
    const newOpCard = generateHTML(card, `_${count}`)
    newOpCard.onclick = () => {
        Game.defendingCard = Game.opponentsHand[card.name + `_${count}`]
        for (let i = 0; i < _opField.children.length; i++) {
            _opField.children[i].classList.remove('card-select-for-action')
        }
        document.getElementsByTagName('svg')[0].classList.remove('card-select-for-action')
        newOpCard.classList.add('card-select-for-action')
    }
    _opField.appendChild(newOpCard)
})

socket.on('attack-res', () => {

})

socket.on('game-over', () => {

})

window.onload = socket.emit('join-game')