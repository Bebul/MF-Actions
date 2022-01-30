import {MF} from "./tournamentsData.mjs"
import {getPlayers, allMyTables, gameListData, updateMostActivePlayer, updateGoogleBar, gameListTable} from "./mondayFight.mjs"

export function createCrossTable(data, theFights, tableId) {
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
    data: getCrossData(data, theFights, players),
    columns: generateCrossTableColumns(data, theFights, players)
  });
  allMyTables.set(tableId, crossTable)
}

function getCrossData(data, theFights, players) {
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
    document.getElementById("gamesListTitle").innerText = playerA + " vs " + playerB;
    let gameData = gameListData(allGames(playerA, playerB))
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

export function seasonSelected(season, data, tableId) {
  switch (season) {
    case "all":
      createCrossTable(data, data.mondayFights(), tableId)
      break
    case "year":
      createCrossTable(data, MF.filterYear(data.mondayFights(), -1), tableId)
      break
    case "2020":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2020), tableId)
      break
    case "2021":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2021), tableId)
      break
    case "2022":
      createCrossTable(data, MF.filterYear(data.mondayFights(), 2022), tableId)
      break
  }
}
