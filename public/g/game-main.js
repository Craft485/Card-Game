const socket = io({transports: ['websocket'], upgrade: false})

const Game = {
    myHand: {},
    myCardsInPlay: {},
    opponentsHand: {},
    isMyTurn: false,
    opponentsHealth: 100,
    myHealth: 100,
    actionCount: 2,
    attackingCard: null,
    defendingCard: null,
    maxCardCount: 7,
    successfullAttackRes: true,
    canPlayCard: false
}

const _opHand  = document.getElementById('opponent-hand')
const _opField = document.getElementById('opponent-played')
const _myField = document.getElementById('my-played')
const _myHand  = document.getElementById('my-hand')

document.querySelector('#opponent-hand .health-display').onclick = () => {
    if (Game.defendingCard?.toLowerCase?.() !== 'player') for (let i = 0; i < _opField.children.length; i++) _opField.children[i].classList.remove('card-select-for-action')
    document.querySelector('#opponent-hand .health-display').classList[Game.defendingCard?.toLowerCase?.() === 'player' ? 'remove' : 'add']('card-select-for-action')
    Game.defendingCard = Game.defendingCard?.toLowerCase?.() === 'player' ? null : 'player'
}

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

function endTurn() {
    if (!Game.successfullAttackRes) return
    socket.emit('turn-end')
    Game.isMyTurn = false
    Game.canPlayCard = false
    Game.attackingCard = null
    Game.defendingCard = null
    // TODO: Maybe move this server side?
    if (!z) {
        const numOfCardsInHand = document.querySelectorAll('#my-hand > div').length
        const cardsToDraw = Game.maxCardCount - numOfCardsInHand
        // console.log(cardsToDraw)
        for (let i = 0; i < cardsToDraw; i++) socket.emit('draw')
    }
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
        // A hopefully temp fix to keeping count consistent between the game state and the ui
        const element = document.querySelector(`#${_myField.id} .${cardNameWithCount}`)
        element.classList.remove(cardNameWithCount)
        element.classList.add(cardName + "_" + count)
        Game.myCardsInPlay[cardName + `_${count}`] = card
        delete Game.myHand[cardNameWithCount]
        // Server doesn't care what count is
        socket.emit('play', [cardName])
    }
}

function action() {
    const attackingCard = Game.attackingCard
    const defendingCard = Game.defendingCard
    // Check if we are attacking the opponent players directly or if we are attacking a card
    const defendingEntity = defendingCard?.toLowerCase?.() === 'player' ? { type: 'player', health: Game.opponentsHealth } : defendingCard
    const attackingCardCount = document.querySelector(`#${_myField.id} > .card-select-for-action`)?.className.match(/\w+_\d/)[0].split('_')[1]
    const defendingCardCount = document.querySelector(`#${_opField.id} > .card-select-for-action`)?.className.match(/\w+_\d/)[0].split('_')[1] || 'player'
    if (Game.isMyTurn && attackingCard.props?.attack && attackingCardCount && defendingCardCount) socket.emit('attack', [attackingCard, defendingEntity, attackingCardCount, defendingCardCount])
}

/** 
 * @param {string} cardName 
 * @param {HTMLElement} cardElement 
 * @param {number | string} cardCount - Optional if already apart of cardName
 */
function selectCardForAction(cardName, cardElement, cardCount = null) {
    const field = cardElement.parentElement
    const isMyCard = cardElement.parentElement.id === _myField.id ? true : false
    const selection = isMyCard ? 'attackingCard' : 'defendingCard'
    const hand = isMyCard ? 'myCardsInPlay' : 'opponentsHand'
    // Count is going to be different than what would be passed to this function as the UI gets updated
    // Because of this, we must read the UI to dynamically determine what count should be
    let count = null
    if (isMyCard) count = cardElement.className.match(/\w+_\d/)[0].split('_')[1]
    if (cardElement.parentElement.id === _opField.id) document.querySelector('#opponent-hand .health-display').classList.remove('card-select-for-action')
    // Update game state
    Game[selection] = Game[hand][cardCount || count ? `${cardName}_${count || cardCount}` : cardName]
    // If we want to unselect a card we've selected
    if (cardElement.classList.contains('card-select-for-action')) {
        Game[selection] = null
        cardElement.classList.remove('card-select-for-action')
        return
    }
    // Clear any previous selections
    for (let i = 0; i < field.children.length; i++) field.children[i].classList.remove('card-select-for-action')
    // Update ui with new selection
    cardElement.classList.add('card-select-for-action')
}

// This variable is apart of a very dumb fix to a very dumb problem
// The variable, and the associated code, is in place to
// start the game, without this logic, the server dies.
// This variable is set to true if we haven't yet generated the starting hand
let z = true

socket.on('confirm', (msg, s) => {
    console.info(msg)
    Game.isMyTurn = s || false
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
    tick()
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
            newCard.onclick = ev => selectCardForAction(card.name, newCard, count)
            e.classList.add('moving')
            newCard.style.visibility = 'hidden'
            e.style = `--new-x: ${newCard.getBoundingClientRect().x}px;
            --current-x: ${e.getBoundingClientRect().x}px;
            --current-y: ${e.getBoundingClientRect().y}px;
            --new-y: ${newCard.getBoundingClientRect().y}px;`

            setTimeout(() => {
                e.remove()
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
    newOpCard.onclick = () => selectCardForAction(card.name, newOpCard, count)
    _opField.appendChild(newOpCard)
})

socket.on('attack-res', (res, attackingCardCount, defendingCardCount, specialConditions) => {
    // res[0] is the attacking card while res[1] is the defending card
    if (!res[0].name?.includes?.('_')) res[0].name += `_${attackingCardCount}`
    if (!res[1].name?.includes?.('_')) res[1].name += `_${defendingCardCount}`
    if (res) {
        // Reset game state and UI a bit
        Game.attackingCard = null
        Game.defendingCard = null
        if (Game.isMyTurn) document.querySelector('#my-played .card-select-for-action').classList.remove('card-select-for-action')
        // Prevent end of turn before we're finished
        Game.successfullAttackRes = false
        // If a player was attacked we can just update their health display and end
        if (defendingCardCount?.toLowerCase() === 'player') {
            document.querySelector(`#${!Game.isMyTurn ? 'my-hand' : 'opponent-hand'} .health-display`).innerText = res[1].props.health
            Game[Game.isMyTurn ? 'opponentsHealth' : 'myHealth'] = res[1].props.health
            if (!specialConditions) return
        }
        const cardElements = document.getElementsByClassName('card')
        for (let i = 0; i < cardElements.length; i++) {
            const card = cardElements[i]
            const parentElement = card.parentElement
            // If the card we are looking at is the one we need to change
            if (card.classList.contains(res[1].name)) {
                const isMyCard = parentElement.id === _myField.id ? true : false
                const hand = isMyCard ? 'myCardsInPlay' : 'opponentsHand'
                // Update game state
                Game[hand][res[1].name] = res[1]
                res[1].props?.defense >= 0
                ? Game[hand][res[1].name] = res[1] 
                : Game.myHealth = res[1].props.health
                // Update UI
                const newCard = generateHTML(res[1].props, `_${defendingCardCount}`)
                newCard.onclick = ev => selectCardForAction(res[1].name, newCard || ev.path[0])
                card.replaceWith(newCard)
            }
        }
        // Allow end of turn
        Game.successfullAttackRes = true
    }
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

socket.on('game-over', res => {
    // Create an overlay to block the player from interacting with the playing feild
    const overlay = document.createElement('div')
    overlay.className = 'game-end-overlay'
    const content = document.createElement('div')
    content.id = "overylay-content"
    content.innerText = `Winner:\n${res.w.props.id}\n\nLoser:\n${res.l.props.id}`
    overlay.appendChild(content)
    document.body.appendChild(overlay)
    socket.close()
    console.log(`Winner: ${res.w.props.id}\nLoser: ${res.l.props.id}`)
})
const btn = document.getElementById('submit')
// General UI managment in a response to the game state
function tick() {
    const isActionState = Game.attackingCard && Game.defendingCard
    btn.onclick = isActionState ? action : (Game.isMyTurn ? endTurn : null)
    btn.innerText = isActionState ? 'Attack' : 'End Turn'
    btn.style = `--color-start: ${isActionState ? 'rgb(255 136 136)' : 'rgb(83, 135, 153)'};
    --color-end: ${isActionState ? 'red' : 'darkblue'};`
    btn.classList[Game.isMyTurn ? 'remove' : 'add']('unavailable')
    
    for (let i = 0; i < document.getElementsByClassName('card').length; i++) if (!document.getElementsByClassName('card')[i].parentElement.id.includes('opponent')) document.getElementsByClassName('card')[i].classList[Game.isMyTurn ? 'remove' : 'add']('unavailable')
    setTimeout(tick, 500)
}

window.onload = socket.emit('join-game')