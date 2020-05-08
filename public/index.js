const socket = io('174.141.194.194:80')

const gameContainer = document.getElementById('game-container')

// send connection message
socket.emit('index_connection')
console.log('connected using index conneciton')

socket.on('game_created', gameName => {
    const gameElement = document.createElement('div')
    gameElement.id = gameName
    gameElement.class = "game"
    const gameLink = document.createElement('a')
    gameLink.href = `/${gameName}`
    gameLink.innerText = gameName
    gameElement.append(gameLink)
    gameContainer.append(gameElement)
})

socket.on('game_removed', game => {
    // todo
})