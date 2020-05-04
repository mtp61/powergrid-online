const plants = require('./resources/plants.js')
const power_money = require('./resources/power_money.js')
const map = require('./resources/america.js')
const restocks = require('./resources/restocks.js')

class Game {
    constructor(gameName) {
        this.gameActive = false;
        this.gameFinished = false;

        this.gameName = gameName;

        this.player_sockets = {}
        this.observer_sockets = {}

        this.message_queue = []

        this.game_state = {'players': {}, 'action': []}

        this.static_game_info = {"active": false,
                                "regions": [1, 2, 3, 4, 5, 6]}
        
        this.default_colors = ["purple", "blue", "green", "red", "black", "orange"]

        this.plug_plants = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        this.socket_plants = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 44, 46, 50]

        this.plant_deck = []
        
        this.first_turn = true

        this.logging = true

        this.helpers = {}
    }

    update() {
        this.game_state['messages'] = []
        
        // parse messages
        this.message_queue.forEach(message => { // add to game state
            const m = message['message']
            const u = message['username']
            if (m.slice(0, 1) === "!") { // message is a command
                if (!this.gameFinished) { // no commands if the game is finished
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
                                    let randNum = Math.floor(Math.random() * this.default_colors.length)
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

                                // setup server helper variables for understanding what the current action is
                                this.game_state['step'] = 1
                                this.game_state['phase'] = 1
                                // TODO
                            }

                            this.first_turn = true; // not actually needed, for testing
                            break;
                        default:
                            // in this case we need to look at the actions
                            // check if person doing request is the actioner
                            // if an action is processed ignore all other commands TODO
                            this.game_state['action'].forEach(([username, action]) => {
                                if (username == u && "!".concat(action) == args[0]) {
                                    switch (args[0]){
                                        case '!nominate':
                                            if (args.length > 1) { // not passing
                                                let nom = parseInt(args[1])
                                                if (!isNaN(nom)) { // make sure is int
                                                    // make sure the plant is in the market
                                                    // todo make this work for phase 3 also
                                                    let nomIndex = this.game_state['market'].indexOf(nom)
                                                    if (nomIndex >= 4 || nomIndex == -1) {
                                                        break
                                                    }

                                                    // make sure have enough money
                                                    if (nom > this.game_state['players'][username]['money']) {
                                                        break
                                                    }

                                                    // helpers
                                                    this.helpers['currentPlant'] = nom
                                                    this.helpers['canBid'] = this.helpers['toNominate']
                                                    this.helpers['lastBid'] = nom
                                                    this.helpers['lastBidder'] = username

                                                    // reset action - this is ok because we aren't skipping to step 5 where we may have multiple
                                                    this.game_state['action'] = []
                                                }
                                            } else { // passing
                                                // helpers, remove from toNom
                                                this.helpers['toNominate'].splice(0, 1)

                                                // reset action
                                                this.game_state['action'] = []
                                            }
                                            break;
                                        case '!bid':
                                            if (args.length > 1) { // not passing
                                                let bid = parseInt(args[1])
                                                if (!isNaN(bid)) {// bid is a number 
                                                    // check if bid is greater than previous
                                                    if (bid <= this.helpers['lastBid']) {
                                                        break
                                                    }
                                                    
                                                    // check if bid is less than or equal to player money
                                                    if (bid > this.game_state['players'][username]['money']) {
                                                        break
                                                    }
                                                    // update helpers
                                                    this.helpers['lastBid'] = bid
                                                    this.helpers['lastBidder'] = username

                                                    // reset action
                                                    this.game_state['action'] = []

                                                }
                                            } else { // passing
                                                // helpers, remove from canbid
                                                let bidderIndex = this.helpers['canBid'].indexOf(username)
                                                this.helpers['canBid'].splice(bidderIndex, 1)

                                                // reset action
                                                this.game_state['action'] = []
                                            }
                                            break;
                                    }
                                    
                                    //console.log('someone tried to do somethings they are allowed to do!!!')
                                }
                            })
                            

                            //this.serverMessage(u.concat(": out of turn command"))
                    } 

                } else {
                    this.serverMessage("no commands after the game is over")
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
            switch (this.game_state['step']) {
                case 1: // determine order
                    if (this.first_turn) {
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
                    } else {
                        this.determineOrder()
                    }
                    
                    this.serverMessage("new order - ".concat(JSON.stringify(this.game_state['order'])))
                    this.log("reordered players")

                    // setup for later
                    this.game_state['step'] = 2
                    //this.game_state['action'] = [[this.game_state['order'][0], "nominate"]]
                    this.setupHelpers2()
                    this.serverMessage('now bidding on plants')
                    break;
                case 2: // buy plants
                    if (this.game_state['action'].length == 0) { // no action
                        if (this.helpers['currentPlant'] == -1) { // no plant
                            if (this.helpers['toNominate'].length == 0) { // no one can nominate
                                this.log("plants done")
                                this.serverMessage("plants done")
                                this.game_state['step'] = 3
                                this.setupHelpers3()
                            } else { // someone can nominate a plant
                                this.game_state['action'] = [[this.helpers['toNominate'][0], 'nominate']]
                            }
                        } else { // there is a plant
                            if (this.helpers['canBid'].length == 1) { // only one person still in, they get it
                                // give them the plant, todo recycle if needed
                                this.game_state['players'][this.helpers['lastBidder']]['plants'].push(this.helpers['currentPlant'])
                                
                                // todo recycle resources if can't store


                                // remove them from nominating
                                let lastBidderIndex = this.helpers['toNominate'].indexOf(this.helpers['lastBidder'])
                                this.helpers['toNominate'].splice(lastBidderIndex, 1)

                                // remove plant, draw a new one
                                this.drawPlant(this.helpers['currentPlant'])

                                // reset helpers
                                this.helpers['currentPlant'] = -1

                            } else { // someone else needs to bid
                                let lastBidIndex = this.helpers['canBid'].indexOf(this.helpers['lastBidder'])
                                if (lastBidIndex + 1 == this.helpers['canBid'].length) {
                                    let nextBidder = this.helpers['canBid'][0]
                                } else {
                                    let nextBidder = this.helpers['canBid'][lastBidIndex + 1]
                                }
                                
                                this.game_state['action'] = [[nextBidder , 'bid']]
                            }
                        }
                        
                    } // if there is an action we don't need to do anything

                    break;
                case 3: // buy resources
                    if (this.first_turn) { // redo order on the first turn
                        this.determineOrder()
                    }
                    this.game_state['step'] = 1


                    break;
                case 4: // build cities
                    //this.game_state['step'] = 1

                    break;
                case 5: // bureaucracy
                    //this.game_state['step'] = 1

                    // currently will just auto power all plants

                    if (this.first_turn) {
                        this.first_turn = false
                    }

                    break;
            }
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

    log(message) {
        if (this.logging) {
            console.log("log: ".concat(message))
        }
    }

    // game functions
    setupHelpers2() {
        this.helpers = {} // reset helpers

        this.helpers['toNominate'] = this.game_state['order'] // nominate in order
        this.helpers['currentPlant'] = -1 
        this.helpers['canBid'] = []
        this.helpers['lastBid'] = -1
        this.helpers['lastBidder'] = ""
    }

    setupHelpers3() {
        this.helpers = {} // reset helpers


    }

    determineOrder() {
        this.game_state['order'] = [] // reset order

        let playerScores = {} // determine scores, sort by score
        Object.keys(this.game_state['players']).forEach(username => {
            let numCities = Object.keys(this.game_state['players'][username]['cities']).length
            let money = this.game_state['players'][username]['money']
            playerScores[username] = 1000 * numCities + money
        })
        // sort
        while (Object.keys(playerScores).length > 0) {
            let top_score = -1, top_username = ""
            Object.keys(playerScores).forEach(username => {
                if (playerScores[username] > top_score) {
                    top_score = playerScores[username]
                    top_username = username
                }
            })

            // put next in order
            this.game_state['order'].push(top_username)
            delete playerScores[username]
        }
    }

    drawPlant( toRemoveNumber ) {
        let newPlant = this.plant_deck.pop()
       
        // remove from plants
        let toRemoveIndex = this.game_state['market'].indexOf(toRemoveNumber)
        this.game_state['market'].splice(toRemoveIndex, 1)
        
        // insert into plants, mainting sort
        for (let i = 0; i < this.game_state['market'].length; i++) {
            if (newPlant < this.game_state['market'][i]) {
                this.game_state['market'].splice(i, 0, newPlant)
                return newPlant
            }
        }

        this.game_state['market'].push(newPlant) // put at end
        return newPlant
    }
}

module.exports = Game;
