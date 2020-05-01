

class Game {
    constructor(gameName) {
        this.gameName = gameName;

        this.player_sockets = {}
        this.observer_sockets = {}

        this.message_queue = []

        this.game_state = {}
        // generate an id TODO
    }

    update() {
        this.game_state['messages'] = []
        
        // process messages
        this.message_queue.forEach(message => { // add to game state
            this.game_state['messages'].push(message['username'].concat(": ", message['message']))
        })
        // parse messages
        // todo
        this.message_queue = [] // reset queue




        // send game states
        Object.keys(this.player_sockets).forEach(socket_id => {
            this.player_sockets[socket_id]['socket'].emit('game_state', this.game_state)
        })

        Object.keys(this.observer_sockets).forEach(socket_id => {
            this.observer_sockets[socket_id]['socket'].emit('game_state', this.game_state)
        })
    }

    newConnection(socket, username) {
        this.observer_sockets[socket.id] = { 'socket': socket, 'username': username }
    }


}

module.exports = Game;
