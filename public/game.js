const socket = io('powergrid.life') // powergrid.life

console.log('updated this')

const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// send connection message
socket.emit('game_connection', gameName, username) // gamename, username
console.log('connected using game conneciton')

console.log(gameName, username)

// new game state
socket.on('game_state', game_state => {    
    // update messages
    game_state['messages'].forEach(message => {
        appendMessage(message)
    })

    // render the new info
    render(game_state)
})

// map shit has to go somewhere..
var map_setup = false
var connections = []

// send messge
messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    if (message != "") {
        socket.emit('chat-message', gameName, username, message)
    }
    messageInput.value = ''
})


// add message to page
function appendMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageContainer.append(messageElement)
    messageContainer.scrollTop = messageContainer.scrollHeight
}

var old_game_state

// render canvas
function render(game_state) {
    // testing
    let string_state = JSON.stringify(game_state)
    if (string_state !== old_game_state) {
        console.log(string_state)
        old_game_state = string_state
    }
    

    // static vars
    const rightBarWidth = 80
    const topBarHeight = 100
    const actionWidth = 200

    // wipe canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // get dims
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    const width = canvas.width
    const height = canvas.height
    
    if (game_state['active'] || game_state['finished']) {
        if (!map_setup) {
            map_setup = true
            setupMap(game_state['regions'])
        }

        // draw different aspects
        // draw the map
        drawMap(0, topBarHeight, width - rightBarWidth, height - topBarHeight, game_state)

        // draw the info
        drawInfo(0, 0, width - actionWidth, topBarHeight, game_state)

        // draw the plants
        drawPlants(width - rightBarWidth, topBarHeight + 30, rightBarWidth, (height - topBarHeight) / 2, game_state)

        // draw resources
        drawResources(width - rightBarWidth, topBarHeight + (height - topBarHeight) / 2, rightBarWidth, (height - topBarHeight) / 2, game_state)

        // draw the current action
        drawAction(width - actionWidth, 0, actionWidth, topBarHeight, game_state)
    }
    
}

function drawMap(x_offset, y_offset, width, height, game_state) {
    const sideGap = 30
    
    // determine placement
    let minX = 100, minY = 100, maxX = 0, maxY = 0, cityX, cityY
    Object.keys(map).forEach(city_number => {
        cityX = map[city_number]["x"]
        cityY = map[city_number]["y"]
        if (cityX < minX) { minX = cityX }
        if (cityX > maxX) { maxX = cityX }
        if (cityY < minY) { minY = cityY }
        if (cityY > maxY) { maxY = cityY }
    })
    let sizeX = maxX - minX, sizeY = maxY - minY
    let gapX = (width - 2 * sideGap) / sizeX, gapY = (height - 2 * sideGap) / sizeY

    ctx.font = "11px Georgia"

    // loop thru cities
    const vGap = 12
    Object.keys(map).forEach(city_number => {
        let cityX = x_offset + sideGap + gapX * (map[city_number]["x"] - minX)
        let cityY = y_offset + sideGap + gapY * (map[city_number]["y"] - minY)

        let city_text = [[city_number, "black"], [map[city_number]['name'], "black"]]
        
        Object.keys(game_state['map'][city_number]).forEach(cost => {
            if (game_state['map'][city_number][cost] == null) {
                city_text.push(["", "black"]) // cost.concat(": none")
            } else {
                let username = game_state['map'][city_number][cost]
                city_text.push(["", "black"])
                //city_text.push([cost.concat(": ", username.slice(0, 5)), game_state['players'][username]['color']])
                
                // circle
                let circleX = cityX + 22 * ((cost - 15) / 5)
                let circleY = cityY + 8
                ctx.fillStyle = game_state['players'][username]['color'] // color
                ctx.beginPath()
                ctx.arc(circleX, circleY, 8, 0, 2 * Math.PI, false)
                ctx.fill()
            }
        })

        let numLines = Object.keys(city_text).length
        let lines = 0
        // draw the city_text
        city_text.forEach(([line, color]) => {
            // set the color
            ctx.fillStyle = color
            // draw the line
            let w = ctx.measureText(line).width
            ctx.fillText(line, cityX - w / 2, cityY - vGap * (numLines / 2.0 - 1) + vGap * lines)  // TODO THIS MAY BE A BIT WRONG

            lines++
        })
    })

    // loop thru connections
    const connectionCityBuffer = 40, connectionCostBuffer = 10, connectionVGap = 3
    ctx.fillStyle = "black"
    connections.forEach(connection => {
        // get endpoints
        let c1 = connection[0], c2 = connection[1]
        let c1X = x_offset + sideGap + gapX * (map[c1]["x"] - minX)
        let c1Y = y_offset + sideGap + gapY * (map[c1]["y"] - minY)
        let c2X = x_offset + sideGap + gapX * (map[c2]["x"] - minX)
        let c2Y = y_offset + sideGap + gapY * (map[c2]["y"] - minY)
        
        // midpoint
        let mX = (c1X + c2X) / 2, mY = (c1Y + c2Y) / 2

        // draw connection text
        let cost = map[c1]["connections"][c2]
        ctx.fillText(cost, mX - ctx.measureText(cost).width / 2, mY + connectionVGap)

        // math line shit
        let theta = Math.atan2(c2Y - c1Y, c2X - c1X)

        let dist = Math.sqrt((c2Y - c1Y) ** 2 + (c2X - c1X) ** 2)

        let c1bX = connectionCityBuffer * Math.cos(theta) + c1X
        let c1bY = connectionCityBuffer * Math.sin(theta) + c1Y

        let m1bX = (dist / 2 - connectionCostBuffer) * Math.cos(theta) + c1X
        let m1bY = (dist / 2 - connectionCostBuffer) * Math.sin(theta) + c1Y
        
        // draw first line
        ctx.beginPath()
        ctx.moveTo(c1bX, c1bY)
        ctx.lineTo(m1bX, m1bY)
        ctx.stroke()

        let c2bX = connectionCityBuffer * Math.cos(theta + Math.PI) + c2X
        let c2bY = connectionCityBuffer * Math.sin(theta + Math.PI) + c2Y

        let m2bX = (dist / 2 - connectionCostBuffer) * Math.cos(theta + Math.PI) + c2X
        let m2bY = (dist / 2 - connectionCostBuffer) * Math.sin(theta + Math.PI) + c2Y

        // draw first line
        ctx.beginPath()
        ctx.moveTo(c2bX, c2bY)
        ctx.lineTo(m2bX, m2bY)
        ctx.stroke()

    })
}

function drawInfo(x_offset, y_offset, width, height, game_state) {
    // setup text
    ctx.font = "11px Georgia"
    ctx.fillStyle = "black"
    const yGap = 15

    /*let playerIndex = 1
    playerStringArray(game_state).forEach(([playerStr, color]) => {
        ctx.fillStyle = color
        
        ctx.fillText(playerStr, x_offset + 5, y_offset + playerIndex * yGap)
        
        playerIndex++
    })*/

    let playerIndex = 1
    game_state['order'].forEach(username => {
        ctx.fillStyle = game_state['players'][username]['color']

        let numCities = Object.keys(game_state['players'][username]['cities']).length
        let money = game_state['players'][username]['money']

        let plantStr = ""
        let plants = [...game_state['players'][username]['plants']]
        plants.forEach(plant => {
            plantStr = plantStr.concat(plantToString(plant), ",  ")
        })
        plantStr = plantStr.slice(0, -3)

        // username, cities, money, plants, resources
        ctx.fillText(playerIndex.toString().concat(" - ", username), x_offset + 5, y_offset + playerIndex * yGap)
        ctx.fillText(numCities.toString().concat(' cities'), x_offset + 110, y_offset + playerIndex * yGap)
        ctx.fillText("$".concat(money.toString()), x_offset + 165, y_offset + playerIndex * yGap)
        ctx.fillText(plantStr, x_offset + 200, y_offset + playerIndex * yGap)
        ctx.fillText(JSON.stringify(game_state['players'][username]['resources']).slice(1, -1), x_offset + 450, y_offset + playerIndex * yGap)

        playerIndex++
    })


}

function drawPlants(x_offset, y_offset, width, height, game_state) {
    // setup text
    ctx.font = "11px Georgia"
    ctx.fillStyle = "black"
    const yGap = 15

    ctx.fillText("Plant Market", x_offset, y_offset + yGap)

    let plantIndex = 2

    // check if one active
    if (game_state['helpers']['oneActive']) {
        ctx.fillStyle = "blue"
        ctx.fillText('1 active', x_offset, plantIndex * yGap + y_offset)

        plantIndex++
    }

    game_state['market'].forEach(plantNum => {
        if (plantNum == 333) {// phase 3 card 
            ctx.fillStyle = "black"
        } else { // not phase 3 card
            // color
            switch (plants[plantNum]['type']) {
                case 'c':
                    ctx.fillStyle = "brown"
                    break
                case 'o':
                    ctx.fillStyle = "black"
                    break
                case 't':
                    ctx.fillStyle = "orange"
                    break
                case 'u':
                    ctx.fillStyle = "red"
                    break
                case 'h':
                    ctx.fillStyle = "black"
                    break
                case 'r':
                    ctx.fillStyle = "green"
                    break
                default:
                    ctx.fillStyle = "black"
            }
        }
        
        if (game_state['phase'] != 3 && plantNum == game_state['market'][4]) { // draw a new line between the halves of the market
            // draw the break
            ctx.fillText("", x_offset, plantIndex * yGap + y_offset)
            plantIndex++
        }

        // draw the text
        ctx.fillText(plantToString(plantNum), x_offset, plantIndex * yGap + y_offset)
        plantIndex++
    })

    /*
    // testing
    ctx.beginPath();
    ctx.moveTo(x_offset, y_offset);
    ctx.lineTo(x_offset + width, y_offset + height);
    ctx.stroke();*/
}

function drawResources(x_offset, y_offset, width, height, game_state) {
    // setup text
    ctx.font = "11px Georgia"
    ctx.fillStyle = "black"
    const yGap = 15

    ctx.fillText("Resources", x_offset, y_offset + yGap)

    let resIndex = 2
    resourceStringArray(game_state).forEach(([resStr, color]) => {
        ctx.fillStyle = color
        ctx.fillText(resStr, x_offset, resIndex * yGap + y_offset)
        resIndex++
    })
    
    /*
    // testing
    ctx.beginPath();
    ctx.moveTo(x_offset, y_offset);
    ctx.lineTo(x_offset + width, y_offset + height);
    ctx.stroke();*/
}

function drawAction(x_offset, y_offset, width, height, game_state) {
    // setup text
    ctx.font = "11px Georgia"
    ctx.fillStyle = 'black'

    const yGap = 15
    let actionIndex = 2
    
    ctx.fillText("phase ".concat(game_state['phase'].toString(), ', step ', game_state['step'].toString()), x_offset + 5, y_offset + yGap)    

    game_state['action'].forEach(action => {
        ctx.fillStyle = game_state['players'][action[0]]['color']
        ctx.fillText(JSON.stringify(action), x_offset + 5, y_offset + actionIndex * yGap)
        actionIndex++
    })

    /*
    // testing
    ctx.beginPath();
    ctx.moveTo(x_offset, y_offset);
    ctx.lineTo(x_offset + width, y_offset + height);
    ctx.stroke(); */
}

function setupMap(regions) {
    // setup map
    // remove cities in wrong regions
    Object.keys(map).forEach(city => {
        if (!regions.includes(map[city]["region"])) {
            delete map[city]
        }
    })

    // remove connections
    let cities = Object.keys(map)

    Object.keys(map).forEach(city => {
        Object.keys(map[city]["connections"]).forEach(connection => {
            if (!cities.includes(connection)) {                
                delete map[city]["connections"][connection]
            } else {
                if (connections.toString().indexOf([connection, city].toString()) < 0) {
                    connections.push([city, connection])
                }
            }
        })
    })
}

function plantToString(plantNum) {
    if (plantNum == 999) { // placeholder high card
        return '999' // testing, should change to blank string
    }

    if (plantNum == 333) { // phase 3 card
        return "333"
    } else { // not phase 3 card
        let plantInfo = plants[plantNum]
        return plantNum.toString().concat(": ", plantInfo['in'].toString(), " ", plantInfo['type'], " => ", plantInfo['out'].toString())
    }
}

function resourceStringArray(game_state) { // todo make this better
    // each res is [res, color]
    // get ammounts
    let c = game_state['resources']['c']
    let o = game_state['resources']['o']
    let t = game_state['resources']['t']
    let u = game_state['resources']['u']

    // compute costs
    let costC = 8 - Math.floor((game_state['resources']['c'] - 1) / 3)
    let costO = 8 - Math.floor((game_state['resources']['o'] - 1) / 3)
    let costT = 8 - Math.floor((game_state['resources']['t'] - 1) / 3)
    let costU
    switch (game_state['resources']['u']) { // ammt of u in market
        case 1:
            costU = 16
            break
        case 2:
            costU = 14
            break
        case 3:
            costU = 12
            break
        case 4:
            costU = 10
            break
        default:
            costU = 13 - game_state['resources']['u']
    }

    // make strings
    let cString = "c: ".concat(c, ' - $', costC)
    let oString = "o: ".concat(o, ' - $', costO)
    let tString = "t: ".concat(t, ' - $', costT)
    let uString = "u: ".concat(u, ' - $', costU)

    return [[cString, "brown"], [oString, 'black'], [tString, 'orange'], [uString, "red"]]
}

function playerStringArray(game_state) {
    // each player is [string, color]
    // in order TODO
    var playerArr = []
    game_state['order'].forEach(username => {
        // color
        let color = game_state['players'][username]['color']

        // player string
        let cities = Object.keys(game_state['players'][username]['cities']).length.toString()
        let money = game_state['players'][username]['money'].toString()
        let plants = ""
        game_state['players'][username]['plants'].forEach(plantNum => {
            plants = plants.concat(' ' , plantToString(plantNum))
        })

        let playerString = username.concat(": ", cities, " cities, $", money, ",", plants, ", ", JSON.stringify(game_state['players'][username]['resources']))

        playerArr.push([playerString, color])
    })

    return playerArr
}