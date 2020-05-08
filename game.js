const plants = require('./resources/plants.js')
const power_money = require('./resources/power_money.js')
const map = require('./resources/america.js')
const restocks = require('./resources/restocks.js')
const win_cities = require('./resources/win_cities.js')
const phase2_cities = require('./resources/phase2_cities.js')

class Game {
    constructor(gameName) {
        this.gameName = gameName;

        this.player_sockets = {}
        this.observer_sockets = {}

        this.message_queue = []

        this.game_state = {'players': {}, 
                           'action': [], 
                           "regions": [1, 2, 3, 4, 5, 6], 
                           "active": false, 
                           "finished": false}

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
                if (!this.game_state['finished']) { // no commands if the game is finished
                    const args = m.split(" ")
                    switch (args[0]) {
                        case "!regions":
                            // simple implementation, need to make stronger
                            try {
                                this.game_state['regions'] = []
                                for (let i = 1; i < args.length; i++) {
                                    this.game_state['regions'].push(parseInt(args[i]))
                                }
                                this.serverMessage('updated regions')
                            } catch {
                                this.serverMessage('bad region input')
                            }
                            break
                        case "!ready":
                            if (!this.game_state['active'] && this.game_state['players'][u] == null && Object.keys(this.game_state['players']).length < 6) {
                                this.game_state['players'][u] = {}
                                this.serverMessage(u.concat(" joined the game"))
                            }
                            break;
                        case "!start": 
                        // todo change 1 to 3 once testing is done
                            if (!this.game_state['active'] && Object.keys(this.game_state['players']).length >= 1) { // start the game
                                console.log('game starting:', this.gameName)

                                this.serverMessage("game starting")
                                this.game_state['active'] = true;
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
                                    player_info['resources'] = {'c': 0, 'o': 0, 't': 0, 'u': 0} // number of resources
                                    
                                    // update game_state
                                    this.game_state['players'][username] = player_info 
                                })
                                // setup map state in the game
                                this.game_state['map'] = {}
                                this.game_state['regions'].forEach(regionNum => {
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
                                this.plant_deck.push(333) // 333 represents the phase 3 card
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
                                                    let nomIndex = this.game_state['market'].indexOf(nom)
                                                    if (this.game_state['phase'] != 3) { // not phase 3
                                                        if (nomIndex >= 4 || nomIndex == -1) {
                                                            this.serverMessage('cant nominate that plant')
                                                            break
                                                        }
                                                    } else { // phase 3
                                                        if (nomIndex >= this.game_state['market'].length || nomIndex == -1) {
                                                            this.serverMessage('cant nominate that plant')
                                                            break
                                                        }
                                                    }

                                                    // make sure have enough money
                                                    if (nom > this.game_state['players'][username]['money']) {
                                                        break
                                                    }

                                                    // helpers
                                                    this.helpers['currentPlant'] = nom
                                                    this.helpers['canBid'] = [...this.helpers['toNominate']]
                                                    this.helpers['lastBid'] = nom
                                                    this.helpers['lastBidder'] = username

                                                    // reset action - this is ok because we aren't skipping to step 5 where we may have multiple
                                                    this.game_state['action'] = []
                                                }
                                            } else { // passing
                                                if (this.first_turn) {
                                                    this.serverMessage('cant pass on first turn')
                                                    break
                                                }

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
                                                        this.serverMessage('bid less than previous')
                                                        break
                                                    }
                                                    
                                                    // check if bid is less than or equal to player money
                                                    if (bid > this.game_state['players'][username]['money']) {
                                                        this.serverMessage('bid more than money')
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
                                        case '!buy':
                                            if (args.length % 2 == 0) { // make sure even args (not inc. first)
                                                this.serverMessage('bad number of args')
                                                break
                                            }
                                            let c = 0, o = 0, t = 0, u = 0 // resource buy amounts

                                            let argError = false // some bot shit happening here with old code, variable name just error
                                            for (let i = 1; i < args.length; i += 2) {
                                                let r = args[i] // resource
                                                let a = parseInt(args[i + 1]) // amount
                                                if (r != "c" && r != "o" && r != "t" && r != "u") { // bad resource type
                                                    argError = true
                                                }
                                                if (isNaN(a)) { // amount not a number
                                                    argError = true
                                                }
                                                switch (r) {
                                                    case 'c':
                                                        c += a
                                                        break
                                                    case 'o':
                                                        o += a
                                                        break
                                                    case 't':
                                                        t += a
                                                        break
                                                    case 'u':
                                                        u += a
                                                        break
                                                }
                                            }
                                            if (argError) {
                                                this.serverMessage('argument error')
                                                break
                                            }
                                                                                        
                                            let cost = this.totalPrice(c, o, t, u)

                                            if (cost >= 0) {
                                                if (cost <= this.game_state['players'][username]['money']) { // can afford
                                                    if (this.canHold(username, c, o, t, u)) { // can hold 
                                                        // can afford and is not too much and can hold
                                                        // update market resources
                                                        this.game_state['resources']['c'] -= c
                                                        this.game_state['resources']['o'] -= o
                                                        this.game_state['resources']['t'] -= t
                                                        this.game_state['resources']['u'] -= u
                                                       
                                                        // update player resources
                                                        this.game_state['players'][username]['resources']['c'] += c
                                                        this.game_state['players'][username]['resources']['o'] += o
                                                        this.game_state['players'][username]['resources']['t'] += t
                                                        this.game_state['players'][username]['resources']['u'] += u
                                                        
                                                        // update player money
                                                        this.game_state['players'][username]['money'] -= cost
                                                        
                                                        // update helpers
                                                        let toBuyIndex = this.helpers['toBuy'].indexOf(username)
                                                        this.helpers['toBuy'].splice(toBuyIndex, 1)

                                                        // reset action
                                                        this.game_state['action'] = []
                                                    } else {
                                                        this.serverMessage('cant hold those resources')
                                                    }
                                                } else {
                                                    this.serverMessage('you')
                                                }
                                            } else {
                                                this.serverMessage('you tried to buy too much of a resource')
                                            }

                                            break
                                        case '!build':
                                            // check args
                                            // make city list
                                            let cities = []
                                            this.game_state['regions'].forEach(region => {
                                                for (let i = 1; i <= 7; i++) { // loop thru cities in region
                                                    cities.push((region - 1) * 7 + i)
                                                }
                                            })
                                            let badArg = false
                                            args.slice(1).forEach(arg => {
                                                // arg options
                                                arg = arg.split('-')
                                                if (arg.length == 1) { // city
                                                    if (isNaN(arg[0])) {
                                                        badArg = true
                                                    } else {
                                                        if (!cities.includes(parseInt(arg[0]))) { // city isnt in map
                                                            badArg = true
                                                        }
                                                    }                                                
                                                } else if (arg.length == 2) { // connection
                                                    if (isNaN(arg[0])) {
                                                        badArg = true
                                                    } else {
                                                        if (!cities.includes(parseInt(arg[0]))) { // first city isnt in map
                                                            badArg = true
                                                        }
                                                    }
                                                    if (isNaN(arg[1])) {
                                                        badArg = true
                                                    } else {
                                                        if (!cities.includes(parseInt(arg[1]))) { // second city isnt in map
                                                            badArg = true
                                                        }
                                                    }
                                                } else {
                                                    badArg = true
                                                }
                                            })
                                            if (badArg) {
                                                this.serverMessage(username.concat(" - bad build args"))
                                                break
                                            }  

                                            // check if build works and can afford
                                            let buildCost = this.buildCost(username, args.slice(1))
                                            if (buildCost >= 0) { // build possible
                                                if (buildCost <= this.game_state['players'][username]['money']) {// can afford
                                                
                                                } else {
                                                    this.serverMessage(" - cant afford build")
                                                    break
                                                }
                                            } else {
                                                this.serverMessage(" - build not possible")
                                                break
                                            }

                                            // execute build
                                            args.slice(1).forEach(arg => {
                                                if (arg.split('-').length == 1) { // is a city
                                                    arg = parseInt(arg)

                                                    // update map, players cities
                                                    let mapCity = this.game_state['map'][arg]

                                                    if (mapCity[10] == null) { // 10 open
                                                        this.game_state['map'][arg][10] = username
                                                        this.game_state['players'][username]['cities'][arg] = 10
                                                    } else if (mapCity[15] == null) { // 15 open
                                                        this.game_state['map'][arg][15] = username
                                                        this.game_state['players'][username]['cities'][arg] = 15
                                                    } else { // only 20 open
                                                        this.game_state['map'][arg][20] = username
                                                        this.game_state['players'][username]['cities'][arg] = 20
                                                    }
                                                }
                                            })

                                            // subtract money
                                            this.game_state['players'][username]['money'] -= buildCost

                                            // update helpers
                                            let toBuildIndex = this.helpers['toBuild'].indexOf(username)
                                            this.helpers['toBuild'].splice(toBuildIndex, 1)

                                            // reset action
                                            this.game_state['action'] = []

                                            break
                                        case '!power':
                                            // probs want to restructure this
                                            let toPower = []

                                            // check args
                                            let error = false
                                            if (args.length == 1) { // power as many as possible TODO
                                                //toPower = [...this.game_state['players'][username]['plants']]
                                                toPower = []
                                            } else {
                                                args.slice(1).forEach(plantNum => {
                                                    if (!isNaN(plantNum)) { // is number
                                                        if (this.game_state['players'][username]['plants'].includes(parseInt(plantNum))) {
                                                            toPower.push(plantNum)
                                                        } else {
                                                            this.serverMessage('dont have plant')
                                                            error = true
                                                        }
                                                    } else {
                                                        this.serverMessage('non int input')
                                                        error = true
                                                    }
                                                })                                       
                                            }
                                            if (error) {
                                                break
                                            }
                                            
                                            // check if have enough resources
                                            // temp vars 
                                            let tempC = this.game_state['players'][username]['resources']['c']
                                            let tempO = this.game_state['players'][username]['resources']['o']
                                            let tempT = this.game_state['players'][username]['resources']['t']
                                            let tempU = this.game_state['players'][username]['resources']['u']
                                            let tempH = 0

                                            let numPowered = 0
                                            toPower.forEach(plantNum => {
                                                numPowered += plants[plantNum]['out']
                                                
                                                switch (plants[plantNum]['type']) {
                                                    case 'c':
                                                        tempC -= plants[plantNum]['in']
                                                        break
                                                    case 'o':
                                                        tempO -= plants[plantNum]['in']
                                                        break
                                                    case 't':
                                                        tempT -= plants[plantNum]['in']
                                                        break
                                                    case 'u':
                                                        tempU -= plants[plantNum]['in']
                                                        break
                                                    case 'h':
                                                        tempH -= plants[plantNum]['in']
                                                        break
                                                }
                                            })

                                            if (tempC < 0 || tempO < 0 || tempT < 0 || tempU < 0 || tempC + tempO + tempH < 0) { // cant afford to power
                                                this.serverMessage('requires too many resources')
                                                break
                                            }
                                            
                                            // check numPowered
                                            let numCities = Object.keys(this.game_state['players'][username]['cities']).length
                                            if (numPowered > numCities) {
                                                numPowered = numCities
                                            }

                                            // update helpers
                                            let toPowerIndex = this.helpers['toPower'].indexOf(username)
                                            this.helpers['toPower'].splice(toPowerIndex, 1)
                                            this.helpers['numPowered'][username] = numPowered
                                            this.helpers['plantsPowered'][username] = [...toPower]
                    
                                            // reset action - need to be careful on this one
                                            let actionIndex = this.game_state['action'].indexOf([username, '!power'])
                                            this.game_state['action'].splice(actionIndex, 1)

                                            console.log(JSON.stringify(this.helpers))
                                            console.log(JSON.stringify(this.game_state['action']))

                                            break
                                        default:
                                            this.serverMessage('bad command')
                                    }
                                    
                                }
                            })
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
        if (this.game_state['active']) {
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
                    
                    this.serverMessage("step 1 done - new order - ".concat(JSON.stringify(this.game_state['order'])))
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
                                this.serverMessage("step 2 done")
                                this.game_state['step'] = 3
                                this.setupHelpers3()
                                this.checkPhase3()
                            } else { // someone can nominate a plant
                                this.game_state['action'] = [[this.helpers['toNominate'][0], 'nominate']]
                            }
                        } else { // there is a plant
                            if (this.helpers['canBid'].length == 1) { // only one person still in, they get it
                                // recycle if needed todo make a new choose action
                                let numPlants = this.game_state['players'][this.helpers['lastBidder']]['plants'].length
                                if (numPlants == 3) { // need to recycle
                                    let lowPlant = 100
                                    this.game_state['players'][this.helpers['lastBidder']]['plants'].forEach(plantNum => {
                                        if (plantNum < lowPlant) {
                                            lowPlant = plantNum
                                        }
                                        let lowIndex = this.game_state['players'][this.helpers['lastBidder']]['plants'].indexOf(lowPlant)
                                        this.game_state['players'][this.helpers['lastBidder']]['plants'].splice(lowIndex, 1)

                                        this.serverMessage('getting rid of lowest plant')
                                    })
                

                                }
                                
                                
                                // give them the plant
                                this.game_state['players'][this.helpers['lastBidder']]['plants'].push(this.helpers['currentPlant'])
                                
                                
                                


                                // todo recycle resources if can't store
                                

                                // update money
                                this.game_state['players'][this.helpers['lastBidder']]['money'] -= this.helpers['lastBid']

                                // remove them from nominating
                                let lastBidderIndex = this.helpers['toNominate'].indexOf(this.helpers['lastBidder'])
                                this.helpers['toNominate'].splice(lastBidderIndex, 1)

                                // remove plant, draw a new one
                                this.drawPlant(this.helpers['currentPlant'], false)

                                // reset helpers
                                this.helpers['currentPlant'] = -1

                            } else { // someone else needs to bid
                                let lastBidIndex = this.helpers['canBid'].indexOf(this.helpers['lastBidder'])
                                let nextBidder
                                if (lastBidIndex + 1 == this.helpers['canBid'].length) {
                                    nextBidder = this.helpers['canBid'][0]
                                } else {
                                    nextBidder = this.helpers['canBid'][lastBidIndex + 1]
                                }
                                
                                this.game_state['action'] = [[nextBidder , 'bid']]
                            }
                        }
                        
                    } // if there is an action we don't need to do anything

                    break;
                case 3: // buy resources
                    if (this.first_turn && !this.first_turn_updated) { // redo order on the first turn
                        this.determineOrder()
                        // need to redo helper
                        this.setupHelpers3()
                        // reset this so we don't hit this loop every time
                        this.first_turn_updated = true
                    }
                    
                    if (this.game_state['action'].length == 0) { // no action
                        if (this.helpers['toBuy'].length == 0) { // everyone already bought
                            this.serverMessage('step 3 done')
                            this.game_state['step'] = 4
                            this.setupHelpers4()
                        } else { // next person buys
                            let nextBuyIndex = this.helpers['toBuy'].length - 1
                            
                            // add to action
                            this.game_state['action'].push([this.helpers['toBuy'][nextBuyIndex], 'buy'])
                        }
                    }
                    // rest while action exists                    

                    break;
                case 4: // build cities
                    if (this.game_state['action'].length == 0) { // no action
                        if (this.helpers['toBuild'].length == 0) { // everyone already built
                            this.serverMessage('step 4 done')
                            this.game_state['step'] = 5
                            this.setupHelpers5()
                        } else { // next person builds
                            let nextBuildIndex = this.helpers['toBuild'].length - 1
                            
                            // add to action
                            this.game_state['action'].push([this.helpers['toBuild'][nextBuildIndex], 'build'])
                        }
                    }
                    // rest while action exists                    

                    break;
                case 5: // bureaucracy
                    //this.game_state['step'] = 1

                    // check if action
                    if (this.game_state['action'].length == 0) { // no action
                        if (this.helpers['toPower'].length == 0) { // all players have powered
                            this.doBureaucracy()
                            if (this.first_turn) {
                                this.first_turn = false
                            }
                            this.game_state['step'] = 1
                            this.serverMessage('step 5 done')
                        } else { // still need to setup actions
                            this.helpers['toPower'].forEach(username => {
                                this.game_state['action'].push([username, 'power'])
                            })
                        }
                    } 
                    // rest while action exists
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
        if (this.game_state['active'] && this.game_state['players'][username] != null) {
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

        this.helpers['toNominate'] = [...this.game_state['order']] // nominate in order
        this.helpers['currentPlant'] = -1 
        this.helpers['canBid'] = []
        this.helpers['lastBid'] = -1
        this.helpers['lastBidder'] = ""
    }

    setupHelpers3() {
        this.helpers = {} // reset helpers

        this.helpers['toBuy'] = [...this.game_state['order']]
    }

    setupHelpers4() {
        this.helpers = {} // reset helpers

        this.helpers['toBuild'] = [...this.game_state['order']]
    }

    setupHelpers5() {
        this.helpers = {} // reset helpers

        this.helpers['toPower'] = [...this.game_state['order']] // won't actually go in order
        this.helpers['numPowered'] = {} // number of cities powered
        this.helpers['plantsPowered'] = {} // plants powered for each user
        this.helpers['toPower'].forEach(username => { // setup numPowered and plantsPowered
            this.helpers['numPowered'][username] = 0
            this.helpers['plantsPowered'][username] = []
        })
    }

    determineOrder() {
        this.game_state['order'] = [] // reset order

        let playerScores = {} // determine scores, sort by score
        Object.keys(this.game_state['players']).forEach(username => {
            let numCities = Object.keys(this.game_state['players'][username]['cities']).length
            let topPlant = 0
            this.game_state['players'][username]['plants'].forEach(plantNum => {
                if (plantNum > topPlant) {
                    topPlant = plantNum
                }
            })
            playerScores[username] = 100 * numCities + topPlant
        })
        // sort
        while (Object.keys(playerScores).length > 0) {
            let top_score = -1, top_username
            Object.keys(playerScores).forEach(username => {
                if (playerScores[username] > top_score) {
                    top_score = playerScores[username]
                    top_username = username
                }
            })

            // put next in order
            this.game_state['order'].push(top_username)
            delete playerScores[top_username]
        }
    }

    drawPlant( toRemoveNumber, recycle ) {
        // deck shit - if is a recycle need to add to end of deck
        if (recycle) {
            this.plant_deck.splice(0, 0, toRemoveNumber)
        }

        // remove from plants
        let toRemoveIndex = this.game_state['market'].indexOf(toRemoveNumber)
        this.game_state['market'].splice(toRemoveIndex, 1)

        if (this.plant_deck.length != 0) {
            let newPlant = this.plant_deck.pop()    
            
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

    totalPrice(c, o, t, u) { // calculate the total price of a resource buy
        // check if there is enough of the resources
        if (c > this.game_state['resources']['c'] ||
            o > this.game_state['resources']['o'] ||
            t > this.game_state['resources']['t'] ||
            u > this.game_state['resources']['u']) {
            return -1
        }

        // calculate the money 
        let cost = 0
        
        // c o t
        for (let i = 0; i < c; i++) { // buy c coals
            cost += 8 - Math.floor((this.game_state['resources']['c'] - i - 1) / 3)
        }
        for (let i = 0; i < o; i++) { // buy o oil
            cost += 8 - Math.floor((this.game_state['resources']['o'] - i - 1) / 3)
        }
        for (let i = 0; i < t; i++) { // buy t trash
            cost += 8 - Math.floor((this.game_state['resources']['t'] - i - 1) / 3)
        }

        // u
        for (let i = 0; i < u; i++) {
            switch (this.game_state['resources']['u'] - i) { // ammt of u in market
                case 1:
                    cost += 16
                    break
                case 2:
                    cost += 14
                    break
                case 3:
                    cost += 12
                    break
                case 4:
                    cost += 10
                    break
                default:
                    cost += 13 - this.game_state['resources']['u']
            }
        }

        return cost      
    }

    canHold(username, c, o, t, u) { // return false if user can't hold res, true ow
        let playerPlants = this.game_state['players'][username]['plants']
        let res = this.game_state['players'][username]['resources']

        // add on player resources
        c += res['c']
        o += res['o']
        t += res['t']
        u += res['u']
        let h = c + o

        let capacity = {'c': 0, 'o': 0, 't': 0, 'u': 0, 'h': 0}
        playerPlants.forEach(plantNum => {
            let plantType = plants[plantNum]['type']
            if (plantType != 'r') { // not renewable
                capacity[plantType] += 2 * plants[plantNum]['in']
            }
        })

        // check trash and uranium
        if (capacity['t'] < t || capacity['u'] < u) {
            this.serverMessage('you cant store all of those damn resourceis')
            return false
        }

        // check coal and oil
        if (c > capacity['c'] || o > capacity['o']) { // c or o over cap
            if (c + h > capacity['c'] + capacity['h'] || o + h > capacity['o'] + capacity['h'] || c + o + h > capacity['c'] + capacity['o'] + capacity['h']) {
                this.serverMessage('you cant store all of those damn resourceis')
                return false
            }
        }

        return true
    }

    doBureaucracy() { // do the bureaucracy steps 
        // check end game conditions
        let numPlayers = Object.keys(this.game_state['players']).length
        if (numPlayers < 3) { numPlayers = 3 }
        let winCities = win_cities[numPlayers]
        Object.keys(this.game_state['players']).forEach(username => {
            let numCities = Object.keys(this.game_state['players'][username]['cities']).length
            if (numCities >= winCities) { // someone has hit win cities
                this.game_state['active'] = false
                this.game_state['finished'] = true
            }
        })

        if (this.game_state['finished']) { // if game over 
            // determine winner
            let win_username = ""
            let win_score = -1
            Object.keys(this.game_state['players']).forEach(username => {
                let numPowered = this.helpers['numPowered'][username]
                let money = this.game_state['players'][username]['money']
                let playerScore = numPowered * 1000 + money
                if (playerScore > win_score) {
                    win_score = playerScore
                    win_username = username
                }
            })

            this.serverMessage(win_username.concat(' won the game'))
        } else { // do normal bur
            // check phase 2
            if (this.game_state['phase'] == 1) { // if phase 1
                let phase2Cities = phase2_cities[numPlayers] // numplayers should already be defined

                Object.keys(this.game_state['players']).forEach(username => {
                    let playerCities = Object.keys(this.game_state['players']).length
                    if (playerCities >= phase2Cities) { // it is phase 2
                        this.game_state['phase'] = 2
                    }
                })

                if (this.game_state['phase'] == 2) { // do the start of phase 2 things
                    this.serverMessage('phase 2')

                    // remove lowest plant
                    this.drawPlant(this.game_state['market'][this.game_state['market'].length - 1], true)
                }
            }

            // earn cash
            Object.keys(this.game_state['players']).forEach(username => {
                // add cash for the username based on number of plants
                this.game_state['players'][username]['money'] += power_money[this.helpers['numPowered'][username]]

                let hPlants = []
                // spend plant resources
                this.helpers['plantsPowered'][username].forEach(plantNum => {  // spend for each fired plant
                    switch (plants[plantNum]['type']) {
                        case 'c':
                            this.game_state['players'][username]['resources']['c'] -= plants[plantNum]['in']
                            break
                        case 'o':
                            this.game_state['players'][username]['resources']['o'] -= plants[plantNum]['in']
                            break
                        case 't':
                            this.game_state['players'][username]['resources']['t'] -= plants[plantNum]['in']
                            break
                        case 'u':
                            this.game_state['players'][username]['resources']['u'] -= plants[plantNum]['in']
                            break
                        case 'r':
                            // don't need to do anything for renewable
                            break
                        case 'h':
                            hPlants.push(plantNum)
                            break
                        default:
                            this.serverMessage("shouldn't be here db")
                    }
                })

                // deal with hybrids 
                hPlants.forEach(plantNum => { // prioritizes burning coal
                    let playerC = this.game_state['players'][username]['resources']['c']
                    let plantIn = plants[plantNum]['in']
                    if (plantIn <= playerC) { // can power off of coal
                        this.game_state['players'][username]['resources']['c'] -= plantIn
                    } else {
                        // coal to zero, subtract remaining oil needed
                        this.game_state['players'][username]['resources']['c'] = 0
                        this.game_state['players'][username]['resources']['o'] -= plantIn - playerC
                    }
                })
            })

            // resupply res market
            this.restockResources()
        
            // update plants
            if (this.game_state['phase'] == 3) {
                this.drawPlant(this.game_state['market'][0], false)
            } else { // phase 1 or 2
                this.drawPlant(this.game_state['market'][this.game_state['market'].length - 1], true)
            }

            // check for phase 3
            this.checkPhase3()
        }
    }

    checkPhase3() { // check for phase 3 and do the required changes
        // check if not phase 3
        if (this.game_state['phase'] != 3) {
            // check if phase 3 card is out
            if (this.game_state['market'][this.game_state['market'].length - 1] == 333) {
                this.serverMessage('phase 3')
                
                // start phase 3
                this.game_state['phase'] = 3

                // remove phase 3 card
                this.game_state['market'].splice(this.game_state['market'].length - 1, 1)

                // remove lowest plant
                this.game_state['market'].splice(0, 1)

                // shuffle deck
                let deckLen = this.plant_deck.length
                let new_deck = [], randIndex, newDeckLen
                for (let i = 0; i < deckLen; i++) {
                    newDeckLen = new_deck.length
                    randIndex = Math.floor(Math.random() * newDeckLen)
                    new_deck.splice(randIndex, 0, this.plant_deck.pop())
                }
                this.plant_deck = [...new_deck]
            }
        }
        // do nothing if already phase 3
    }

    buildCost (username, args) { // return cost if possible, -1 if not, don't worry about money
        let buildCost = 0
        let canBuild = true

        let boughtCities = [...Object.keys(this.game_state['players'][username]['cities'])] // temp var to store bought cities
        let canBuyCities = [] // temp var, includes cities connected to

        for (let i = 0; i < boughtCities.length; i++) { // this is bot shit not sure why its needed......
            boughtCities[i] = parseInt(boughtCities[i])
        }

        let noCities = false
        if (boughtCities.length == 0) {
            noCities = true
        } 

        // go thru vars
        args.forEach(arg => {
            arg = arg.split('-')
            if (arg.length == 1) { // city
                let city = parseInt(arg[0])

                if (noCities) { // havent built any cities
                    // find lowest cost
                    if (this.game_state['map'][city][10] == null) { // can build 10
                        buildCost += 10
                        boughtCities.push(city)
                    } else if (this.game_state['map'][city][15] == null && this.game_state['phase'] >= 2) { // can build 15
                        buildCost += 15
                        boughtCities.push(city)
                    } else if (this.game_state['map'][city][20] == null && this.game_state['phase'] == 3) { // can build 20
                        buildCost += 20
                        boughtCities.push(city)
                    } else { // city full
                        canBuild = false
                        this.log('city full, has not built first')
                    }

                    noCities = false // now has built a city
                } else if (canBuyCities.includes(city)) { // has built cities, can go to city
                    // remove from canbuycities
                    canBuyCities.splice(canBuyCities.indexOf(city), 1)
                    // find lowest cost
                    if (this.game_state['map'][city][10] == null) { // can build 10
                        buildCost += 10
                        boughtCities.push(city)
                    } else if (this.game_state['map'][city][15] == null && this.game_state['phase'] >= 2) { // can build 15
                        buildCost += 15
                        boughtCities.push(city)
                    } else if (this.game_state['map'][city][20] == null && this.game_state['phase'] == 3) { // can build 20
                        buildCost += 20
                        boughtCities.push(city)
                    } else { // city full
                        canBuild = false
                        this.log('city full, has built first')
                    }
                } else {
                    canBuild = false
                    this.log('not allowed to buy city')
                }
            } else if (arg.length == 2) { // connection
                let city1 = parseInt(arg[0]), city2 = parseInt(arg[1])
                console.log(city1, city2)
                console.log(JSON.stringify(boughtCities), JSON.stringify(canBuyCities))
                console.log(boughtCities.includes(city1), [1].includes(1))
                let bCity1 = boughtCities.includes(city1) || canBuyCities.includes(city1)
                let bCity2 = boughtCities.includes(city2) || canBuyCities.includes(city2)
                console.log(bCity1)
                if (bCity1 && bCity2) { // own both ends of the connection
                    canBuild = false
                    this.log('own both ends of connection')
                } else if (bCity1) { // own city1
                    let connectionCost = map[city1]['connections'][city2]
                    if (!isNaN(connectionCost)) { // cities connected
                        buildCost += connectionCost // add cost
                        canBuyCities.push(city2) // add to canBuyCities
                    } else {
                        canBuild = false
                        this.log('connection doesnt exist')
                    }
                } else if (bCity2) { // own city2
                    let connectionCost = map[city2]['connections'][city1]
                    if (!isNaN(connectionCost)) { // cities connected
                        buildCost += connectionCost // add cost
                        canBuyCities.push(city1) // add to canBuyCities
                    } else {
                        canBuild = false
                        this.log('connection doesnt exist')
                    }
                } else { // own neither end of the connection
                    canBuild = false
                    this.log('own neither end of the connection')
                }
            } else {
                this.serverMessage('shouldnt get here buildcost')
            }
        })

        if (canBuild) {
            return buildCost
        } else {
            return -1
        }
    }

    restockResources() { // restock resource market
        let numPlayers = Object.keys(this.game_state['players']).length
        if (numPlayers < 3) {
            numPlayers = 3
        }

        // increase resource amounts
        this.game_state['resources']['c'] += restocks[numPlayers][this.game_state['phase']]['c']
        this.game_state['resources']['o'] += restocks[numPlayers][this.game_state['phase']]['o']
        this.game_state['resources']['t'] += restocks[numPlayers][this.game_state['phase']]['t']
        this.game_state['resources']['u'] += restocks[numPlayers][this.game_state['phase']]['u']
    
        // make sure not too much
        if (this.game_state['resources']['c'] > 24) {
            this.game_state['resources']['c'] = 24
        }
        if (this.game_state['resources']['o'] > 24) {
            this.game_state['resources']['o'] = 24
        }
        if (this.game_state['resources']['t'] > 24) {
            this.game_state['resources']['t'] = 24
        }
        if (this.game_state['resources']['u'] > 12) {
            this.game_state['resources']['u'] = 12
        }
    }
}

module.exports = Game;
