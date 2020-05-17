const Game = require('./game')

class GameManager {
    constructor(tickrate) {
        this.games = {}
        this.index_sockets = {}
        
        // update tickrate times per second
        setInterval(this.tick.bind(this), 1000 / tickrate);
    }

    tick() {
        // update games
        Object.keys(this.games).forEach(gameName => {
            this.games[gameName].update()
        })

        // console.log('tick')
    }

    newGame(gameName) {
        this.games[gameName] = new Game(gameName)
        console.log('new game:', gameName)

        Object.keys(this.index_sockets).forEach(socket_id => {
            this.index_sockets[socket_id].emit('game_created', gameName)
        })
    }

    getGameInfo() {
        let gameInfo = {}
        Object.keys(this.games).forEach(gameName => {
            gameInfo[gameName] = {}
        }) 
        return gameInfo
    }

    existsName(n) { // check if game name exists
        for (let g of Object.keys(this.games)) {
            if (this.games[g].gameName === n) {
                return true;
            }
        }
        return false; // no games with name
    }

    // networking
    indexConnection(socket) {
        //console.log('index socket connect:', socket.id)
        this.index_sockets[socket.id] = socket
    }

    gameConnection(socket, gameName, username) {
        //console.log('game', gameName, 'socket connect:', socket.id, username)
        this.games[gameName].newConnection(socket, username)
        this.games[gameName].serverMessage(username.concat(" connected"))
    }

    removeConnection(socket) {
        // check if in index connections
        if (this.index_sockets[socket.id] != null) {
            //console.log('index socket disconnect:', socket.id)
            delete this.index_sockets[socket.id]
            return
        }

        // check if in game connections
        for (let g of Object.keys(this.games)) {
            if (this.games[g].observer_sockets[socket.id] != null) {
                //console.log('game socket disconnect:', socket.id, this.games[g].observer_sockets[socket.id]['username'])
                // send message
                this.games[g].serverMessage(this.games[g].observer_sockets[socket.id]['username'].concat(" disconnected"))
                delete this.games[g].observer_sockets[socket.id]
                return
            }
            if (this.games[g].player_sockets[socket.id] != null) {
                //console.log('game socket disconnect:', socket.id, this.games[g].player_sockets[socket.id]['username'])
                // send message
                this.games[g].serverMessage(this.games[g].player_sockets[socket.id]['username'].concat(" disconnected"))
                delete this.games[g].player_sockets[socket.id]
                return
            }
        }
    }
}

module.exports = GameManager;
