var app = require('express')()
var http = require('http').Server(app)
var bodyParser = require('body-parser')
var port = Number(process.env.PORT || 5000)

var origin = (process.env.DOMAIN || "http://localhost:1337")

var pg = require('pg')
var conString = (process.env.POSTGRES || 'postgres://postgres:postpass@localhost/postgres')

// handle ACAO
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", origin)
  res.header("Access-Control-Allow-Headers", "X-Requested-With")
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use('/record', bodyParser.json())

app.post('/record', function (req, res) {
  var player = req.body.player
    , score = req.body.score
    , maze = req.body.maze

  console.log(req.body)
  if (maze != (new Date().setHours(0, 0, 0, 0)).toString(32).substr(0, 8)) {
    res.status(403).send({"message": "Not current maze"})
    return
  }

  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err)
    }

    client.query('INSERT INTO highscores ("player", "score", "maze") VALUES ($1, $2, $3)', [player, score, maze], function (err, result) {
      if (err) {
        return console.error('error fetching client from pool', err)
      } else {
        done()

        res.send(result.rows)
      }
    })
  })
})

app.get('/currentmaze', function (req, res) {
  var maze = (new Date().setHours(0, 0, 0, 0)).toString(32).substr(0, 8)

  res.send(maze)
})

app.get('/best/:maze/:limit', function (req, res) {
  var maze = req.params.maze
    , limit = req.params.limit

  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err)
    }

    client.query('SELECT * FROM highscores WHERE "maze" = $1 ORDER BY score DESC LIMIT $2', [maze, limit], function (err, result) {
      if (err) {
        return console.error('error fetching client from pool', err)
      } else {
        done()

        res.send(result.rows)
      }
    })
  })
})

app.get('/best/today', function (req, res) {
  var maze = (new Date().setHours(0, 0, 0, 0)).toString(32).substr(0, 8)

  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err)
    }

    client.query('SELECT * FROM highscores WHERE "maze" = $1 ORDER BY score DESC LIMIT 5', [maze], function (err, result) {
      if (err) {
        return console.error('error fetching client from pool', err)
      } else {
        done()

        res.send(result.rows)
      }
    })
  })
})

http.listen(port, function(){
  console.log('listening on *:'+port)
})