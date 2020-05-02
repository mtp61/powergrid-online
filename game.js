

class Game {
    constructor(gameName) {
        this.gameActive = false;

        this.gameName = gameName;

        this.player_sockets = {}
        this.observer_sockets = {}

        this.message_queue = []

        this.game_state = {'players': {}}

        this.static_game_info = {"active": false,
                                "regions": [1]} // todo set regions to be all by default
        
        this.default_colors = ["purple", "blue", "green", "red", "black", "yellow"]

        this.plug_plants = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        this.socket_plants = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 44, 46, 50]

        this.plant_deck = []

        this.helpers = {'phase': 1, 'step': 1}
    }

    update() {
        this.game_state['messages'] = []
        
        // parse messages
        this.message_queue.forEach(message => { // add to game state
            const m = message['message']
            const u = message['username']
            if (m.slice(0, 1) === "!") { // message is a command
                const args = m.split(" ")
                switch (args[0]) {
                    case "!ready":
                        if (!this.gameActive && this.game_state['players'][u] == null && Object.keys(this.game_state['players']).length < 6) {
                            this.game_state['players'][u] = {}
                            this.serverMessage(u.concat(" joined the game"))
                        }
                        break;
                    case "!start": 
                    // todo change 1 to 3
                        if (!this.gameActive && Object.keys(this.game_state['players']).length >= 1) { // start the game
                            console.log('game starting:', this.gameName)

                            this.serverMessage("game starting")
                            this.gameActive = true;
                            this.game_state['info'] = this.static_game_info
                            this.game_state['active'] = true
                            // setup players
                            Object.keys(this.game_state['players']).forEach(username => {
                                let player_info = {}
                                
                                // color
                                let randNum = Math.floor(Math.random() * Object.keys(this.game_state['players']).length)
                                player_info['color'] = this.default_colors[randNum]
                                this.default_colors.splice(randNum, 1) // make sure no one else can get that color
                                player_info['money'] = 50 // money
                                player_info['plants'] = [] // just the plant number
                                player_info['cities'] = {} // city: 10 15 or 20
                                player_info['resources'] = {'coal': 0, 'oil': 0, 'trash': 0, 'uranium': 0} // number of resources
                                
                                // update game_state
                                this.game_state['players'][username] = player_info 
                            })
                            // setup map state in the game
                            this.game_state['map'] = {}
                            this.game_state['info']['regions'].forEach(regionNum => {
                                for (let i = 7 * (regionNum - 1) + 1; i <= regionNum * 7; i++) {
                                    this.game_state['map'][i] = {10: null, 15: null, 20: null}
                                }
                            })
                            // setup plants
                            let numPlayers = Object.keys(this.game_state['players']).length
                            // if 5 or 6 remove none
                            let removed_plants = []
                            if (numPlayers == 4) { // remove 1 plug 3 socket
                                for (let i = 0; i < 1; i++) { // remove 1 plug
                                    let randNum = Math.floor(Math.random() * this.plug_plants.length)
                                    removed_plants.push(this.plug_plants[randNum])
                                    this.plug_plants.splice(randNum, 1)
                                }
                                for (let i = 0; i < 3; i++) { // remove 3 socket
                                    let randNum = Math.floor(Math.random() * this.socket_plants.length)
                                    removed_plants.push(this.socket_plants[randNum])
                                    this.socket_plants.splice(randNum, 1)
                                }
                            } else { // remove 2 plug 6 socket
                                for (let i = 0; i < 2; i++) { // remove 2 plug
                                    let randNum = Math.floor(Math.random() * this.plug_plants.length)
                                    removed_plants.push(this.plug_plants[randNum])
                                    this.plug_plants.splice(randNum, 1)
                                }
                                for (let i = 0; i < 6; i++) { // remove 6 socket
                                    let randNum = Math.floor(Math.random() * this.socket_plants.length)
                                    removed_plants.push(this.socket_plants[randNum])
                                    this.socket_plants.splice(randNum, 1)
                                }
                            }
                            this.serverMessage("plants removed: ".concat(JSON.stringify(removed_plants)))
                            // shuffle plants
                            let shuffle_plug_plants = []
                            let shuffle_socket_plants = []
                            while (this.plug_plants.length > 0) {
                                let randNum = Math.floor(Math.random() * this.plug_plants.length)
                                shuffle_plug_plants.push(this.plug_plants[randNum])
                                this.plug_plants.splice(randNum, 1)
                            }
                            while (this.socket_plants.length > 0) {
                                let randNum = Math.floor(Math.random() * this.socket_plants.length)
                                shuffle_socket_plants.push(this.socket_plants[randNum])
                                this.socket_plants.splice(randNum, 1)
                            }

                            // make market
                            this.game_state['market'] = []
                            for (let i = 0; i < 8; i++) {
                                this.game_state['market'].push(shuffle_plug_plants.pop())
                            }
                            this.game_state['market'].sort((a,b) => a-b)
                            
                            // make deck
                            this.plant_deck.push(-1) // -1 represents the phase 3 card
                            while (shuffle_socket_plants.length > 0) {
                                this.plant_deck.push(shuffle_socket_plants.pop())
                            }
                            while (shuffle_plug_plants.length > 0) {
                                this.plant_deck.push(shuffle_plug_plants.pop())
                            }
                            
                            // starting resources
                            this.game_state['resources'] = {'c': 24, 'o': 18, 't': 9, 'u': 2}

                            // randomize order
                            this.game_state['order'] = []

                            let temp_player_list = []
                            Object.keys(this.game_state['players']).forEach(username => {
                                temp_player_list.push(username)
                            })
                            
                            while (temp_player_list.length > 0) {
                                let randNum = Math.floor(Math.random() * temp_player_list.length)
                                this.game_state['order'].push(temp_player_list[randNum])
                                temp_player_list.splice(randNum, 1)
                            }

                            // setup server helper variables for understanding what the current action is
                            // TODO
                        }
                        break;
                    default:
                        this.serverMessage(u.concat(": unknown command"))
                }
            }
        })
        // process messages
        this.message_queue.forEach(message => { // add to game state
            this.game_state['messages'].push(message['username'].concat(": ", message['message']))
        })
        this.message_queue = [] // reset queue

        // if game active...
        if (this.gameActive) {

        }

        // send game states
        // need to do this even if not active because game state contains message info
        Object.keys(this.player_sockets).forEach(socket_id => {
            this.player_sockets[socket_id]['socket'].emit('game_state', this.game_state)
        })

        Object.keys(this.observer_sockets).forEach(socket_id => {
            this.observer_sockets[socket_id]['socket'].emit('game_state', this.game_state)
        })
    }

    newConnection(socket, username) {
        if (this.gameActive && this.game_state['players'][username] != null) {
            this.player_sockets[socket.id] = { 'socket': socket, 'username': username }
        } else {
            this.observer_sockets[socket.id] = { 'socket': socket, 'username': username }
        }
    }

    serverMessage (message) {
        this.message_queue.push({'username': 'Server', 'message': message})
    }

    newPlayer(username, socket) {
        this.game_state['players'][username] = {}

        // update sockets
        delete this.observer_sockets[socket.id]
        this.player_sockets[socket.id] = { 'socket': socket, 'username': username }
    }
}

module.exports = Game;
