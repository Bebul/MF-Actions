import {MFPodium} from "./podium.mjs"
import {toNDJson} from "./mondayFight.mjs"

export function processAnalyze(data) {
  let allFights = data.jouzoleanAndBebulsTournaments()

  const adminStuff = document.createElement("div");
  adminStuff.style.display = "block"

  adminStuff.innerHTML = "      <div style=\"margin: 10px 0\">\n" +
    "            <div>Zadej id konkrétní hry, kterou chceš analyzovat:\n" +
    "                <input type=\"text\" id=\"gameID\" style=\"width:100%\">\n" +
    "                <button id=\"analyze\">Analyze</button><button id=\"analyzeAll\">Analyze ALL</button>" +
    "            </div>\n" +
    "        </div>\n" +
    "        <hr>" +
    "        <div id='analyzeStatus'></div>" +
    "        <div id='analyzeResult'></div>"

  document.body.appendChild(adminStuff)

  document.getElementById("analyze").onclick = function() {
    var gameId = document.getElementById("gameID").value
    analyzeGame(data, gameId, reporter())
  }

  document.getElementById("analyzeAll").onclick = function() {
    analyzeAll(data, reporter())
  }
}

export let AnalyzeKeyList =   [
  "sensation", "smothered", "centerMate", "castling", "promotion", "enPassant", "sacrifice",
  "queens", "epCheck", "monkey"
]

function reporter() {
  return {
    line: function(html) {
      let resultEl = document.getElementById("analyzeResult")
      let lineDiv = document.createElement("div")
      lineDiv.innerHTML = html
      resultEl.appendChild(lineDiv)
    },
    status: function(html) {
      let resultEl = document.getElementById("analyzeStatus")
      resultEl.innerHTML = html
    }
  }
}

async function reportHeadline(g, report) {
  await report.line(`
    <h1>${g.players.white.user.name} : ${g.players.black.user.name}, ${g.winner} wins</h1>
    <h2>${g.opening.name}</h2>
    ${g.moves}`
  )
}

function algebraic(i, j) {
  return 'abcdefgh'.substring(j, j + 1) + '87654321'.substring(i, i + 1)
}

function squareIsSmothered(board, i,j) {
  let c = board[i][j].color
  for (let r=i-1; r<i+2; r++) {
    for (let f=j-1; f<j+2; f++) {
      if (r>=0 && r<8 && f>=0 && f<8 && (!board[r][f] || board[r][f].color!=c)) return false
    }
  }
  return true
}

function countQueens(board, color) {
  let queens = 0
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      let sq = board[i][j]
      if (sq && sq.type=="q" && sq.color==color)
        queens++
    }
  }
  return queens
}

function findKing(color, board) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      let sq = board[i][j]
      if (sq && sq.type=="k" && sq.color==color) {
        // detect smothered position
        let ret = {square: algebraic(i,j)}
        if (squareIsSmothered(board, i, j)) ret.smothered = true
        if (i>=3 && i<5 && j>=3 && j<5) ret.centerMate = true
        return ret
      }
    }
  }
  return null
}

var CHESS_SQUARES = {
  a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
  a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
  a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
  a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
  a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
  a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
  a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
  a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
}

function file88(i) {
  return i & 15
}

function rank88(i) {
  return i >> 4
}

function squaresAreSymmetric(a, b) {
  let sqa = CHESS_SQUARES[a]
  let sqb = CHESS_SQUARES[b]
  return rank88(sqa) === 7-rank88(sqb) && file88(sqa) === file88(sqb)
}

function monkeyPlay(history) {
  for (let i=2; i<=history.length; i+=2) {
    let mw = history[i-2]
    let mb = history[i-1]

    if (!squaresAreSymmetric(mw.from, mb.from) || !squaresAreSymmetric(mw.to, mb.to)) return (i-2)/2
  }
  return Math.floor(history.length / 2)
}

function queenSacrificeMatingAttack(history) {
  if (history.length >= 11) {
    let captured = {w: 0, b: 0}
    let promoted = {w: 0, b: 0}
    for (let i=history.length-11; i<history.length; i++) {
      let m = history[i]
      if (m.captured && m.captured==="q") captured[m.color]++
      if (i < history.length-1 && m.flags && m.flags.includes("p")) promoted[m.color]++
    }
    let winner = history[history.length-1].color
    let loser = history[history.length-2].color
    return captured[loser]>0 && (captured[winner] + promoted[winner] - captured[loser] < 0)
  }
  return false
}

async function analyzeMoves(g, report) {
  let moves = g.moves.split(" ")
  let chess = new Chess()
  let pgn = MFPodium.toPGN(g, true)
  chess.load_pgn(pgn)

  let history = chess.history({verbose: true})

  let stats = {}
  for(let prop in chess.FLAGS) {
    stats[chess.FLAGS[prop]] = {w:0, b:0}
  }
  stats.epCheck = {w:0, b:0}

  let board = chess.board()

  let queens = {w:0, b:0}
  for (let color of ["w", "b"]) {
    queens[color] = countQueens(board, color)
  }
  stats.queens = queens

  let monkeyMoves = monkeyPlay(history)
  stats.monkey = {w:0, b: monkeyMoves}

  history.forEach(function(m) {
    for (let i = 0; i < m.flags.length; i++) {
      stats[m.flags.charAt(i)][m.color]++
      if (m.flags.includes("e") && m.san.includes("+")) stats.epCheck[m.color]++
    }
  })

  // now mate
  let mate = (g.status=="mate") ? function(){
    let loseColor = (g.winner == "white") ? "b" : "w"
    let lastMove = history[history.length-1]

    let mate = findKing(loseColor, board)
    mate.piece = lastMove.piece
    mate.to = lastMove.to
    if (lastMove.flags.includes("k") || lastMove.flags.includes("q")) mate.castling = true
    if (lastMove.flags.includes("p")) mate.promotion = true
    if (lastMove.flags.includes("e")) mate.enPassant = true
    if (queenSacrificeMatingAttack(history)) mate.sacrifice = true

    return mate
  }() : null

  if (mate) stats.mate = mate

  if (report) await report.line(`moves ply ${moves.length} stats ${JSON.stringify(stats)}`)

  return stats
}

async function analyzeGame(data, gameId, report) {
  let g = data.findGame(gameId)
  if (g) {
    await Promise.resolve()
      .then(result => reportHeadline(g, report))
      .then(result => addStats(g, report))
  } else  {
    report(`<h1>Game ${gameId} not found</h1>`)
  }
}

async function analyzeAll(data, report) {
  await addAllStats(data, report)
    .then(result => {
      console.log("ALL DONE")
      download("tournamentGames.ndjson", toNDJson(data.tournamentGames()))
    })
}

async function addStats(g, report) {
  //console.log(`called ${g.id}`)
  await analyzeMoves(g, report)
    .then(function(result) {
        for(let side in g.players) {
          let player = g.players[side]
          let color = (side == "white") ? "w" : "b"
          let stats = player.stats || {} // because sensation is already calculated in addExtras

          if (result.e[color] > 0) stats.ep = result.e[color]      // number of en passant moves
          if (result.p[color] > 0) stats.promo = result.p[color]   // number of promotions
          if (result.epCheck[color] > 0) stats.epCheck = true
          if (result.queens[color] > 2) stats.queens = result.queens[color]
          if (result.monkey[color] >= 5) stats.monkey = result.monkey[color]
          if (g.winner==side && result.mate) stats.mate = result.mate
          if (Object.keys(stats).length > 0) {
            if (stats.queens) console.log(`${g.id} has ${stats.queens} queens`)
            if (stats.mate && stats.mate.enPassant) console.log(`${g.id} player delivered enPassant mate`)
            if (stats.epCheck) console.log(`${g.id} player delivered en passant check`)
            if (stats.mate && stats.mate.smothered) console.log(`${g.id} smothered mate`)
            if (stats.mate && stats.mate.centerMate) console.log(`${g.id} center mate`)
            if (stats.mate && stats.mate.promotion) console.log(`${g.id} promotion mate`)
            if (stats.mate && stats.mate.castling) console.log(`${g.id} castling mate`)
            if (stats.mate && stats.mate.queenSac) console.log(`${g.id} queen sacrifice attack`)
            if (stats.mate && stats.mate.piece == "k") console.log(`${g.id} mate by king move`)
            if (stats.mate && (stats.mate.to == "f2" || stats.mate.to == "f7")) console.log(`${g.id} weak square f7 / f2`)
            if (stats.monkey) console.log(`${g.id} monkey play ${stats.monkey} moves`)

            player.stats = stats
          } // and add it finally
        }
      }
    )
}

async function addGamesStats(data, games, report) {
  let gamesCount = games.length

  Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
  }

  function getStatus(g) {
    let html = `<h2>Processing: ${gamesCount - games.length}/${gamesCount}</h2>`

    let d = new Date(g.createdAt);
    var day = days[d.getDay() ];
    let date = [d.getDate(), d.getMonth()+1].join('.')+' '+d.getFullYear()+' '+[d.getHours(), d.getMinutes().padLeft()].join(':')+' '+day;
    html += `<h2>${date}</h2>`
    return html
  }

  async function nextStat(data, games, report) {
    let timeout = 0
    const promiseTimeout = time => result => new Promise(resolve => setTimeout(resolve, time, result));

    let g = games.shift()
    if (g) {
      if (report) report.status(getStatus(g))
      await addStats(g)
        .then(promiseTimeout(timeout))
        .then(result => nextStat(data, games, report))
    }
  }

  await nextStat(data, games, report)
}

async function addAllStats(data, report) {
  let games = []
  data.forEachGame(g => games.push(g))
  await addGamesStats(data, games, report)
}

export async function addNewGamesStats(data, newGames, report) {
  let games = []
  newGames.forEach(function(g) {
    games = games.concat(g.games)
  })
  await addGamesStats(data, games, report)
    .then(result => console.log("addNewGamesStats is DONE"))
}