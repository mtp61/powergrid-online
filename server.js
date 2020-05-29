if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
  
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const favicon = require('serve-favicon');
const path = require('path')

// io
const server = require('http').Server(app)
const io = require('socket.io')(server)

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  username => users.find(user => user.username === username),
  id => users.find(user => user.id === id)
)

// setup favicon
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

const users = []

app.set('view-engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('index.ejs', { username: req.user.username, games: getGames() })
  } else {
    res.render('index_default.ejs', { games: getGames() })      
  }
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      username: req.body.username,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/')
})

app.get('/game-info', (req, res) => {
  res.render('game_info.ejs')
})

server.listen(3331)

// socket io shit
io.on('connection', socket => {
  socket.on('index_connection', onConnectIndex)

  socket.on('game_connection', onConnectGame)

  socket.on('chat-message', onMessage)

  socket.on('disconnect', onDisconnect)
})

function onMessage(data) {
  let gameName = data['gameName'], username = data['username'], message = data['message']
  gameManager.games[gameName].message_queue.push({'username': username, 'message': message})
}

function onConnectIndex() {
  gameManager.indexConnection(this)
}

function onConnectGame(data) {
  let gameName = data['gameName'], username = data['username']
  gameManager.gameConnection(this, gameName, username)
}

function onDisconnect () {
  gameManager.removeConnection(this)
}


// game shit
// create a new game
app.post('/game', (req, res) => {
  // check if there is a game with that name
  if (gameManager.existsName(req.body.game)) {
    return res.redirect('/')
  }
  gameManager.newGame(req.body.game)

  res.redirect(req.body.game)
})

// goto a game 
app.get('/:game', (req, res) => {
  if (!gameManager.existsName(req.params.game)) { // check if game exists
    return res.redirect('/')
  }
  // check if logged in
  if (req.isAuthenticated()) {
    username = req.user.username
  } else {
    username = randUser() // get a random username
  }
  res.render('game.ejs', { gameName: req.params.game, username: username })
})


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// Setup the game
const GameManager = require('./gameManager')
const gameManager = new GameManager(4); // arg is tickrate

function getGames() {
  return gameManager.getGameInfo()
}

function randUser() { // generate a random username
  // return 'anon-'.concat(randHex(8)) // old simple
  
  // todo move this to a seperate file
  const name_1_options = ['Raze', 'MMC', "CiW", "Astralis", "Cloud9", 'Booler', 'Big Bot', 'Ragger',
                      'KiS^', "PIMP", 'pan fried', 'Ojibwe Chief', 'cs.money']
  const name_2_options = ['Rival', 'JWorlds', 'metra', 'jonathanp', 'Jetboost', 'Lakes', 'Oubre', 
                    'Macaw', 'y tho', 'Ninja', 'Zebruh', 'Box']
  

  let name_1 = name_1_options[Math.floor(Math.random() * name_1_options.length)]
  let name_2 = name_2_options[Math.floor(Math.random() * name_2_options.length)]
  let name_3 = Math.floor(Math.random() * 100)

  return name_1.concat(' ', name_2, name_3)
}

function randHex(len) { // only used for generating simple usernames
  const maxlen = 16,
    min = Math.pow(16,Math.min(len,maxlen)-1),
    max = Math.pow(16,Math.min(len,maxlen)) - 1,
    n   = Math.floor( Math.random() * (max-min+1) ) + min,
    r   = n.toString(16);
  while ( r.length < len ) {
     r = r + randHex( len - maxlen );
  }
  return r;
}