const express = require('express')
const app = express()
const http = require('http').createServer(app)
const fs = require('fs')
const io = require('socket.io')(http)
const { Game, _cardList:cardList } = require('./assets.js')

app.use(express.static('../public'))

const currentPlayers = {}
const games = []
let isCurrentGame = false

io.on('connection', socket => {
    console.info(`Connection received: ${socket.id}`)

    socket.on("join-game", args => {
        // If there is a game waiting for a second player, join that one, else create a new game instance and join that one
        if (isCurrentGame) {
            // Calling Game#join() on the last element in the games array
            // Once user ids exist we will switch all instances of socket ids to those
            games[games.length - 1].join(socket.id)
            isCurrentGame = false
        } else {
            // Create a new Game instance and join it
            const newGame = new Game()
            games.push(newGame)
            games[games.length - 1].join(socket.id)
            isCurrentGame = true
        }
        currentPlayers[socket.id] = games[games.length - 1]
        const firstTurn = currentPlayers[socket.id].Players[0].props.id === socket.id ? true : false
        socket.emit('confirm', 'Joined game', firstTurn)
        // If isCurrentGame is false that means that at the beginning of this event it was true meaning the game is now ready to start
        if (!isCurrentGame) {
            socket.emit('game-begin')
            // Let opponent know the game has begun
            io.sockets.sockets.get(currentPlayers[socket.id].Players.find(p => p.props.id !== socket.id).props.id).emit('game-begin')
        }
    })

    socket.on("draw", async (args = []) => {
        console.log("Draw call received")
        const g = currentPlayers[socket.id]
        const op = g.Players.find(p => p.props.id !== socket.id)
        const newCard = await g.drawCard(socket.id)
        if (newCard instanceof Error) {
            socket.emit('err', 'An error occured | ACTION: Draw Card')
        } else {
            socket.emit('newCard', newCard)
            // Are we drawing the initial cards? If so the opponent's client doesn't care
            if(!args[0]?.isGenStartUp) io.sockets.sockets.get(op.props.id).emit('op-new-card')
        }
    })

    socket.on("play", args => {
        console.log("Play event")
        const cName = args[0]
        const isValidCard = Object.values(cardList).find((card: { props: { name: string } } ) => card.props.name.toLowerCase() === cName.toLowerCase())
        const g = currentPlayers[socket.id]
        // Find the player
        const player = g.Players.find(player => player.props.id === socket.id)
        if (isValidCard && g && player.isTakingTurn) {
            // Tell the other player that a card was played
            const p = g.Players.find(player => !player.isTakingTurn)
            io.sockets.sockets.get(p.props.id).emit('op-play', isValidCard)
        } else {
            socket.emit('no-play', 'Invalid card or other condition')
        }
    })

    socket.on("attack", async ([attackingCardData, defendingCardData, attackingCardCount, defendingCardCount]) => {
        console.log("Attack event")
        // Get the current game object and players
        const game = currentPlayers[socket.id]
        const attacker = game.Players.find(player => player.props.id === socket.id)
        const defender = game.Players.find(player => player.props.id !== socket.id)
        const attackingCardAction = cardList[Object.keys(cardList).find((cardName: string) => cardName.toLowerCase() === attackingCardData.props.name.toLowerCase())].action

        if(attacker?.isTakingTurn && attackingCardData?.props?.attack && (defendingCardData?.props?.health || defendingCardData?.health)) {
            // Call action method and return result
            const defendingEntity = defendingCardData?.type?.toLowerCase() === 'player' ? defender : defendingCardData
            const attackResult = await attackingCardAction(attackingCardData, defendingEntity, attacker, defender)
            if (attackResult instanceof Error) {
                console.error(attackResult)
                socket.emit('err', 'Attack event failed')
                return
            }
            // Send result back to client and opponent
            socket.emit('attack-res', attackResult, attackingCardCount, defendingCardCount)
            io.sockets.sockets.get(defender.props.id).emit('attack-res', attackResult, attackingCardCount, defendingCardCount)
            const gameOver = game.isGameOver()
            if (gameOver) {
                socket.emit('game-over', gameOver)
                io.sockets.sockets.get(defender.props.id).emit('game-over', gameOver)
            }
        } else {
            socket.emit('err', 'Conditions for attacking not met')
        }
    })

    socket.on("turn-end", () => {
        const g = currentPlayers[socket.id]
        g.endTurn()
        const defender = g.Players.find(player => player.props.id !== socket.id)
        io.sockets.sockets.get(defender.props.id).emit('turn-ended')
    })
    // Disconnect event clears games/currentPlayers and informs the other player
    socket.on("disconnect", () => {
        console.info(`${socket.id} Disconnected`)
        // Clear any player data from the game instance, then alert the remaining player, if there is one, that the game has ended
        try {
            io.sockets.sockets.get(currentPlayers[socket.id].Players.find(p => p.props.id !== socket.id).props.id).emit('player-left')
        } catch (error) {/* Theres no need to do anything with the error */}
        delete currentPlayers[socket.id]
        const index = games.findIndex(game => game.Players.find(player => player.props.id === socket.id))
        // If index exists, then the game object exists in the games array
        if (index >= 0) {
            const playerIndex = games[index].Players.findIndex(player => player.props.id === socket.id)
            games[index].Players.splice(playerIndex, 1)
            games.splice(index, 1)
        }
    })
})

http.listen(process.argv[2] || 8080, console.info('Online!'))