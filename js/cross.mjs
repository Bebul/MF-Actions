import {MF} from "./tournamentsData.mjs"
import {getPlayers, allMyTables, gameListData, updateMostActivePlayer, updateGoogleBar, gameListTable} from "./mondayFight.mjs"
import {positionAfter} from "./analyze.mjs"

export function createCrossTable(data, theFights, tableId, criterion = "score") {
  let players = getPlayers(theFights).sort(function(a, b){
    var x = a.toLowerCase();
    var y = b.toLowerCase();
    if (x < y) {return -1;}
    if (x > y) {return 1;}
    return 0;
  });
  document.getElementById(tableId.substring(1)).innerHTML = ""
  let crossTable = new Tabulator(tableId, {
    layout: "fitDataTable",
    data: getCrossData(data, theFights, players, criterion),
    columns: generateCrossTableColumns(data, theFights, players)
  });
  allMyTables.set(tableId, crossTable)
}

function getCrossData(data, theFights, players, criterion) {
  if (criterion === "score") {
    function addPlayerCrossData(player, scores, columns) {
      let ix = 0
      players.forEach( pl => {
          let score = scores.get(player).get(pl);
          let plid = "pl"+ix++
          if (score[0]==0 && score[1]==0) columns[plid] = ""
          else columns[plid] = score[0]  + "-" + score[1]
        }
      )
    }
    let tableData = [];
    let scores = getScores(data, players, theFights)
    let crossScores = getCrossScores(data, players, theFights)
    players.forEach( player => {
        let thePlayer = {
          name: player,
          nameUrl: "https://lichess.org/@/" + player,
          score: scores.get(player)[0] + " - " + scores.get(player)[1]
        }
        addPlayerCrossData(player, crossScores, thePlayer)
        tableData.push(thePlayer);
      }
    )
    return tableData;
  } else { // assume it is rating
    function addPlayerCrossData(player, scores, columns) {
      let ix = 0
      players.forEach( pl => {
          let score = scores.get(player).get(pl);
          let plid = "pl"+ix++
          if (score > 0) columns[plid] = `+${score}`
          else columns[plid] = `${score}`
        }
      )
    }
    let tableData = [];
    let scores = getRatingScores(data, players, theFights)
    let crossScores = getCrossRatingScores(data, players, theFights)
    players.forEach( player => {
        let thePlayer = {
          name: player,
          nameUrl: "https://lichess.org/@/" + player,
          score: scores.get(player)
        }
        addPlayerCrossData(player, crossScores, thePlayer)
        tableData.push(thePlayer);
      }
    )
    return tableData;
  }

}

function getScores(data, players, fights) {
  let playerScore = new Map();
  players.forEach( pl => playerScore.set(pl, [0,0,0]) )

  function updateNoStart(name) {
    let data = playerScore.get(name)
    data[2]++
  }
  function updateDraw(name) {
    let data = playerScore.get(name)
    data[0]+=0.5
    data[1]+=0.5
  }
  function updateWin(name) {
    let data = playerScore.get(name)
    data[0]++
  }
  function updateLoss(name) {
    let data = playerScore.get(name)
    data[1]++
  }

  fights.forEach( fight => {
    let games = data.tournamentGames().find(tg => tg.id==fight.id);
    if (games !== undefined) {
      games.games.forEach(game => {
        if (game.status === "noStart") {
          updateNoStart(game.players.white.user.name)
          updateNoStart(game.players.black.user.name)
        } else if (game.winner === undefined) {
          updateDraw(game.players.white.user.name)
          updateDraw(game.players.black.user.name)
        } else if (game.winner === "white") {
          updateWin(game.players.white.user.name)
          updateLoss(game.players.black.user.name)
        } else if (game.winner === "black") {
          updateLoss(game.players.white.user.name)
          updateWin(game.players.black.user.name)
        }
      })
    }
  })
  return playerScore
}

function getCrossScores(data, players, fights) {
  let playerScore = new Map();
  function emptyMap() {
    let theMap = new Map();
    players.forEach( pl => theMap.set(pl, [0,0]) )
    return theMap;
  }
  players.forEach( pl => playerScore.set(pl, emptyMap()) )

  function updateDraw(a,b) {
    let data = playerScore.get(a).get(b)
    data[0]+=0.5
    data[1]+=0.5
  }
  function updateWin(a,b) {
    let data = playerScore.get(a).get(b)
    data[0]++
  }
  function updateLoss(a,b) {
    let data = playerScore.get(a).get(b)
    data[1]++
  }

  fights.forEach( fight => {
    let games = data.tournamentGames().find(tg => tg.id==fight.id);
    if (games !== undefined) {
      games.games.forEach(game => {
        let white = game.players.white.user.name
        let black = game.players.black.user.name
        if (game.status === "noStart") {}
        else if (game.winner === undefined) {
          updateDraw(white, black)
          updateDraw(black, white)
        } else if (game.winner === "white") {
          updateWin(white, black)
          updateLoss(black, white)
        } else if (game.winner === "black") {
          updateWin(black, white)
          updateLoss(white, black)
        }
      })
    }
  })
  return playerScore
}

function getRatingScores(data, players, fights) {
  let playerScore = new Map();
  players.forEach( pl => playerScore.set(pl, "") )

  function updatePlayerScore(player) {
    if (player.ratingDiff) {
      let data = playerScore.get(player.user.name)
      if (data==="") data=player.ratingDiff
      else data += player.ratingDiff
      playerScore.set(player.user.name, data)
    }
  }

  fights.forEach( fight => {
    let games = data.tournamentGames().find(tg => tg.id==fight.id);
    if (games !== undefined) {
      games.games.forEach(game => {
        if (game.status !== "noStart") {
          updatePlayerScore(game.players.white)
          updatePlayerScore(game.players.black)
        }
      })
    }
  })
  return playerScore
}

function getCrossRatingScores(data, players, fights) {
  let playerScore = new Map();
  function emptyMap() {
    let theMap = new Map();
    players.forEach( pl => theMap.set(pl, "") )
    return theMap;
  }
  players.forEach( pl => playerScore.set(pl, emptyMap()) )

  function updatePlayerScore(player, oponent) {
    if (player.ratingDiff) {
      let plData = playerScore.get(player.user.name)
      let data = plData.get(oponent.user.name)
      if (data==="") data=player.ratingDiff
      else data += player.ratingDiff
      plData.set(oponent.user.name, data)
    }
  }

  fights.forEach( fight => {
    let games = data.tournamentGames().find(tg => tg.id==fight.id);
    if (games !== undefined) {
      games.games.forEach(game => {
        if (game.status !== "noStart") {
          updatePlayerScore(game.players.white, game.players.black)
          updatePlayerScore(game.players.black, game.players.white)
        }
      })
    }
  })
  return playerScore
}

function updateScore(g, scr) {
  // suppose score = {w:8, b:3, draw: 4}
  let score = scr || {w:0, b:0, draw:0}
  if (g.winner === "white") score.w++
  else if (g.winner === "black") score.b++
  else score.draw++
  return score
}

function scoreStr(score) {
  return `${score.w}-${score.draw}-${score.b}`
}

/**
 * @returns {Map<fen, position> where position is {count, id, createdAt, score, opening}}
 * with id, createdAt matching last game reaching the fen after ply for player playing as color
 * and score is {w, draw, b}
 */
function positionsAfter(games, player, color, ply) {
  let positions = new Map();
  games.forEach(
    function (g) {
      if (g.players[color].user.name === player) {
        let fen = positionAfter(g, ply)
        if (fen) {
          if (positions.has(fen)) {
            let pos = positions.get(fen)
            pos.score = updateScore(g, pos.score)
            if (pos.createdAt < g.createdAt) {
              positions.set(fen, {
                count: pos.count + 1,
                id: g.id,
                createdAt: g.createdAt,
                score: pos.score,
                opening: g.opening
                }
              )
            } else {
              pos.count++
              positions.set(fen, pos)
            }
          } else {
            positions.set(fen, {
              count: 1,
              id: g.id,
              createdAt: g.createdAt,
              score: updateScore(g),
              opening: g.opening
            })
          }
        }
      }
    }
  )
  return positions
}

function myCellClick(data, players, fights){
  function allGames(playerA, playerB) {
    let selectedGames = []
    fights.forEach( fight => {
      let games = data.tournamentGames().find(tg => tg.id==fight.id);
      if (games !== undefined) {
        games.games.forEach(game => {
          let white = game.players.white.user.name
          let black = game.players.black.user.name
          if ((white == playerA && black == playerB) || (white == playerB && black == playerA)) selectedGames.push(game)
        })
      }
    })
    return {"games": selectedGames}
  }

  function mcl(e, cell) {
    let playerA = cell._cell.row.data.name
    let playerB = players[cell._cell.column.field.substring(2)]
    console.log("cell click: " + playerA + " vs " + playerB)
    document.getElementById("gamesList").style.display = "block";
    let games = allGames(playerA, playerB)
    let gameData = gameListData(games)
    document.getElementById("gamesListTitle").innerHTML = `<h1>${playerA} vs ${playerB}</h1>`
    updateMostOftenPositions(games.games, playerA, playerB)
    updateMostActivePlayer("gameListTable", gameData)
    updateGoogleBar("gameListTableBar", gameData)
    gameListTable.setData(gameData).then(function(){
      gameListTable.redraw(true)
    })
    //e - the click event object
    //cell - cell component
  }
  return mcl
}


function updateMostOftenPositions(games, playerA, playerB) {
  function updateBoards(positions, id, caption, ply) {
    let max = 0
    positions.forEach(
      function(p, fen) {
        if (p.count > max) max = p.count
      }
    )

    let el = document.getElementById(id)
    let html = ""
    if (max > 1) {
      positions.forEach( function(value, key) {
          if (value.count == max) {
            html += `<h2>${value.count}x: ${caption} ${scoreStr(value.score)}</h2><h3>${value.opening.name}</h3>`
            html += `<iframe src="https://lichess.org/embed/game/${value.id}?theme=auto&bg=light#${ply}" width=600 height=397 frameborder=0></iframe><br>`
          }
        }
      )
    }
    el.innerHTML = html
  }

  updateBoards(positionsAfter(games, playerA, "white", 9), "mostlyAsWhite", `${playerA}-${playerB}`, 9)
  updateBoards(positionsAfter(games, playerA, "black", 10), "mostlyAsBlack", `${playerB}-${playerA}`, 10)
}

function generateCrossTableColumns(data, theFights, players) {
  let leaderboardColumns = [
    {title: "Name", field: "nameUrl", resizable:false, formatter:"link", formatterParams:{ labelField:"name", target:"_blank"}},
    {title: "Score", field: "score", resizable:false, hozAlign:"center", headerSortStartingDir:"desc"},
  ]

  let columnsBuilder = leaderboardColumns;
  function pushPlayer(player, ix) {
    columnsBuilder.push(
      {
        title: player,
        field: "pl"+ix,
        resizable:false,
        cellClick: myCellClick(data, players, theFights),
        hozAlign: "center",
        headerVertical: true
      }
    )
  }

  let ix = 0
  players.forEach( player => {
    pushPlayer(player, ix++)
  });

  return columnsBuilder;
}

export function criterionChanged(data, tableId) {
  let season = document.querySelector('input[name="season"]:checked').value
  let criterion = document.querySelector('input[name="criterion"]:checked').value
  console.log(`selected season: ${season} criterion ${criterion}`)
  switch (season) {
    case "all":
      createCrossTable(data, data.mondayFights(), tableId, criterion)
      break
    case "year":
      createCrossTable(data, MF.filterYear(data.mondayFights(), -1), tableId, criterion)
      break
    case "2020":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2020), tableId, criterion)
      break
    case "2021":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2021), tableId, criterion)
      break
    case "2022":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2022), tableId, criterion)
      break
  }
}
