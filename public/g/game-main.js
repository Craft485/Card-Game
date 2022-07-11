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
    oppCardCountInPlay: 0,
    canPlayCard: false
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
    Game.canPlayCard = false
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
        // This looks very pointless but this is technically looking at a different part of the game state than the recurse in socket#on('newCard') is looking at and managing said state
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

function action(attackingCard = Game.attackingCard, defendingCard = Game.defendingCard) {
    // Check if we are attacking the opponent players directly or if we are attacking a card
    const defendingEntity = defendingCard?.toLowerCase?.() === 'player' ? { type: 'player', health: Game.opponentsHealth } : defendingCard
    const attackingCardCount = document.querySelector(`#${_myField.id} > .card-select-for-action`).classList[1].split('_')[1]
    const defendingCardCount = document.querySelector(`#${_opField.id} > .card-select-for-action`).classList[1].split('_')[1]
    console.log(defendingEntity)
    console.log(attackingCardCount)
    console.log(defendingCardCount)
    if (attackingCard.props?.attack && attackingCardCount && defendingCardCount) socket.emit('attack', [attackingCard, defendingEntity, attackingCardCount, defendingCardCount])
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
    document.querySelector('#my-hand .health-display').style.borderColor = Game.isMyTurn ? 'blue' : 'red'
    document.querySelector('#opponent-hand .health-display').style.borderColor = Game.isMyTurn ? 'red' : 'blue'
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
    Game.canPlayCard = true
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
        e.onclick = () => {
            if (!Game.canPlayCard || !Game.isMyTurn) return
            Game.canPlayCard = false
            // Changed from using outerHTML to regenerating the card html and appending it
            const generatedHTMLForCard = generateHTML(card, `_${count}`)
            document.getElementById('my-played').appendChild(generatedHTMLForCard)
            // At the point of this click event firing the element is a child of #my-played
            const newCard = document.querySelector(`#my-played .${card.name}_${count}`)
            // Setup cards onclick to be used to attack
            newCard.onclick = () => {
                // Remove css class from all other cards in _myField
                for (let i = 0; i < _myField.children.length; i++) _myField.children[i].classList.remove('card-select-for-action')
                Game.attackingCard = Game.myCardsInPlay[`${card.name}_${count}`]
                // Add css class to the newCard element
                newCard.classList.add('card-select-for-action')
            }
            e.classList.add('moving')
            newCard.style.visibility = 'hidden'
            e.style = `--new-x: ${newCard.getBoundingClientRect().x}px;
            --current-x: ${e.getBoundingClientRect().x}px;
            --current-y: ${e.getBoundingClientRect().y}px;
            --new-y: ${newCard.getBoundingClientRect().y}px;`

            setTimeout(() => {
                e.remove()
                Game.myCardCount--
                Game.myCardCountInPlay++
                newCard.style.visibility = 'visible'
                Game.canPlayCard = true
            }, 1900)

            play(card.name + `_${count}`)
        }
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
    document.getElementsByClassName('card-b')[0].remove()
    const newOpCard = generateHTML(card, `_${count}`)
    newOpCard.onclick = () => {
        Game.defendingCard = Game.opponentsHand[card.name + `_${count}`]
        for (let i = 0; i < _opField.children.length; i++) {
            _opField.children[i].classList.remove('card-select-for-action')
        }
        document.querySelector('#opponent-hand health-display').classList.remove('card-select-for-action')
        newOpCard.classList.add('card-select-for-action')
    }
    _opField.appendChild(newOpCard)
})

socket.on('attack-res', () => {

})

socket.on('player-left', () => {
    const overlay = document.createElement('div')
    overlay.className = 'game-end-overlay'
    const content = document.createElement('div')
    content.id = "overlay-content"
    content.innerText = 'Your opponent has left, the game has ended.'
    content.innerHTML += '<br/><button><a href="/">Return Home</a></button>'
    overlay.appendChild(content)
    document.body.appendChild(overlay)
    socket.close()
})

socket.on('game-over', () => {

})

window.onload = socket.emit('join-game')