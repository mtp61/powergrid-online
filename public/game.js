const socket = io('http://localhost:3000')

const messageContainer = document.getElementById('message-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// send connection message
socket.emit('game_connection', gameName, username) // gamename, username
console.log('connected using game conneciton')

console.log(gameName, username)

// new game state
socket.on('game_state', game_state => {
    console.log('new game state')
    
    // update messages
    game_state['messages'].forEach(message => {
        appendMessage(message)
    })

    // render the new info
    render(game_state)
})

var map_setup = false

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

// render canvas
function render(game_state) {
    // testing
    console.log(JSON.stringify(game_state))
    
    
    
    if (game_state['active']) {
        if (!map_setup) {
            map_setup = true
            setupMap(game_state['info'])
        }
    }
    // wipe canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // get dims
    const width = canvas.width
    const height = canvas.height

    // draw different aspects
    // draw the map
    drawMap(0, 0, 0, 0)

    // draw the info
    drawInfo(0, 0, 0, 0)

    // draw the plants
    drawPlants(0, 0, 0, 0)

    // draw resources
    drawResources(0, 0, 0, 0)

    // draw the current action
    drawAction(0, 0, 0, 0)
}

function drawMap(x_offset, y_offset, width, height) {

}

function drawInfo(x_offset, y_offset, width, height) {

}

function drawPlants(x_offset, y_offset, width, height) {

}

function drawResources(x_offset, y_offset, width, height) {

}

function drawAction(x_offset, y_offset, width, height) {

}

function setupMap(game_info) {
    // setup map
    // remove cities in wrong regions
    let regions = game_info["regions"]
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
            }
        })
    })
}
