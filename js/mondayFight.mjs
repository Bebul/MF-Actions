import {MF} from "./tournamentsData.mjs"
import {LAPI} from "./lichessAPIdownloader.mjs"
import {addNewGamesStats} from "./analyze.mjs"
import {Avatars, getTrophies} from "./podium.mjs"

function playerRank(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined) return undefined
  return player.rank
}

function playerScore(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.score
}

function playerPresence(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return 1
}

function playerRatingDiff(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.diff
}

function playerFastestMate(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.mate
}

function playerFastestGame(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.fast
}

function playerSensation(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.sensation
}


function playerPerformance(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  return player.performance
}

function playerAvgOponent(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || player.avgOponent === undefined) return 0
  return player.avgOponent
}

function playerPoints(fight, playerName) {
  if (!fight) return [0,0]
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || player.points === undefined || !MF.playedAGame(player)) return [0,0]
  return player.points
}

function playerPointsOld(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return [0, 0]
  let myPts = 0
  let opPts = 0
  if (Array.isArray(player.sheet.scores)) {
    player.sheet.scores.forEach( score => {
      let pts = 0
      if (Array.isArray(score)) {
        if (score[0] <= 1) pts = score[0]/2
        else if (score[0] == 2) {
          if (score[1] == 3) pts = 0.5
          else pts = 1
        } else pts = 1
      } else pts = score / 2
      myPts += pts
      opPts += 1-pts
    })
  } else if (typeof player.sheet.scores == "string" || player.sheet.scores instanceof String){
    let streak = 0
    player.sheet.scores.split("").reverse().forEach(function(score) {
      // 0 is always loss
      // 1 is always draw
      // 2 is win for no fire and draw otherwise
      // 3 is always win with berserk and no fire
      // 4 is always win
      // 5 is always win
      let pts = 1 // assume we won
      if (streak < 2) pts = Math.min(score,2) / 2
      else if (score <=2) pts = score / 4
      if (pts === 1) streak++
      else streak = 0
      myPts += pts
      opPts += 1-pts
    })
  }
  return [myPts, opPts]
}

function jouzocoins(fight, playerName) {
  let player = fight.standing.players.find( pl => pl.name==playerName )
  if (player === undefined || !MF.playedAGame(player)) return 0
  let plCount = MF.playersCountWhoPlayed(fight)
  let rank = player.rank
  if (plCount >= 10 && rank <= 6) return [11, 8, 6, 4, 2, 2][rank-1]
  else if (rank <= 4) return [10, 7, 5, 3][rank-1]
  return 1
}

function getTotalScore(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player) total += pl.score
    })
  })
  return total
}

function getTotalPresence(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player && MF.playedAGame(pl)) total += 1
    })
  })
  return total
}

function getTotalRatingDiff(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player && pl.diff) total += pl.diff
    })
  })
  return total
}

function getTotalMates(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player && pl.mate) total += pl.mate
    })
  })
  return total
}

function getTotalFastest(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player && pl.fast) total += pl.fast
    })
  })
  return total
}

function getTotalSensations(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player && pl.sensation) total += pl.sensation
    })
  })
  return total
}

function getTotalGames(player, theFights) {
  let total = 0
  theFights.forEach(fight => {
    fight.standing.players.forEach(pl => {
      if (pl.name==player) total += pl.sheet.scores.length
    })
  })
  return total
}

function getTotalPoints(playerName, theFights) {
  let total = 0
  theFights.forEach( fight => total += playerPoints(fight, playerName)[0] )
  return total
}

function getAvgPerformance(playerName, theFights) {
  let games = getTotalGames(playerName, theFights)
  if (games > 0) {
    let total = 0
    theFights.forEach(
      fight => {
        let fgames = playerPoints(fight, playerName)[0] + playerPoints(fight, playerName)[1]
        total += playerPerformance(fight, playerName) * fgames
      }
    )
    return Math.round(total / games)
  } else return 0
}

function getAvgOponent(playerName, theFights) {
  let games = getTotalGames(playerName, theFights)
  if (games > 0) {
    let total = 0
    theFights.forEach(
      fight => {
        let fgames = playerPoints(fight, playerName)[0] + playerPoints(fight, playerName)[1]
        total += playerAvgOponent(fight, playerName) * fgames
      }
    )
    return Math.round(total / games)
  } else return 0
}

function getTotalJouzocoinsList(playerName, theFights) {
  let total = []
  theFights.forEach(fight => {
    fight.standing.players.forEach( pl => {
      if (pl.name==playerName) total.push(jouzocoins(fight, playerName))
    })
  })
  return total
}

function getTotalJouzocoins(playerName, theFights) {
  let total = 0
  theFights.forEach( fight => total += jouzocoins(fight, playerName) )
  return total
}

export function getPlayers(theFights) {
  let playersAr = []
  theFights.forEach(fight => {
    fight.standing.players.forEach((player) => {
      if (MF.playedAGame(player) && !playersAr.includes(player.name)) playersAr.push(player.name)
    })
  })
  return playersAr
}

function addFightsPoints(playerOut, playerName, theFights) {
  var ix = 1
  theFights.forEach(fight => {
    let rank = playerRank(fight, playerName)
    if (rank === undefined) playerOut['t' + ix++] = undefined
    else playerOut['t' + ix++] = {
      players: MF.playersCountWhoPlayed(fight),
      rank: playerRank(fight, playerName),
      jouzoCoins: jouzocoins(fight, playerName),
      score: playerScore(fight, playerName),
      points: playerPoints(fight, playerName)[0],
      present: playerPresence(fight, playerName),
      games: playerPoints(fight, playerName)[0]+playerPoints(fight, playerName)[1],
      performance: playerPerformance(fight, playerName),
      oponent: playerAvgOponent(fight, playerName),
      diff: playerRatingDiff(fight, playerName),
      mate: playerFastestMate(fight, playerName),
      fast: playerFastestGame(fight, playerName),
      sensation: playerSensation(fight, playerName)
    }
  })
}

function getDataOfPlayers(theFights) {
  let players = getPlayers(theFights)
  let tableData = []
  players.forEach( player => {
      let averagePerformance = getAvgPerformance(player, theFights)
      let averageOponent = getAvgOponent(player, theFights)
      let totalPoints = getTotalPoints(player, theFights) + averagePerformance / 10000
      let thePlayer = {
        name: player,
        nameUrl: "https://lichess.org/@/" + player,
        jouzoCoins: getTotalJouzocoins(player, theFights),
        totalScore: getTotalScore(player, theFights),
        totalPts: totalPoints,
        present: getTotalPresence(player, theFights),
        games: getTotalGames(player, theFights),
        avgPerformance: averagePerformance,
        avgOponent: averageOponent,
        ratingDiff: getTotalRatingDiff(player, theFights),
        fastestMates: getTotalMates(player, theFights),
        fastestGames: getTotalFastest(player, theFights),
        sensations: getTotalSensations(player, theFights)
      }
      addFightsPoints(thePlayer, player, theFights)
      tableData.push(thePlayer)
    }
  )
  return tableData
}

function generatePlayersTableColumns(theFights, enableJouzocoins) {
  let leaderboardColumns = [
    {formatter: "rownum", headerSort: false, resizable:false}, //add auto incrementing row number
    {title: "Hr????", field: "nameUrl", resizable:false, formatter:"link", formatterParams:{ labelField:"name", target:"_blank"}},
    {title: "Pt", field: "totalPts", resizable:false, headerSortStartingDir:"desc", headerTooltip:"celkov?? po??et bod??", formatter: totalPtsFormatter},
    {title: "Sc", field: "totalScore", resizable:false, headerSortStartingDir:"desc", headerTooltip:"celkov?? sk??re"},
    {title: "G", field: "games", resizable:false, headerSortStartingDir:"desc", headerTooltip:"po??et her"},
    {title: "P", field: "avgPerformance", resizable:false, headerSortStartingDir:"desc", headerTooltip:"pr??m??rn?? performance"},
    {title: "O", field: "avgOponent", resizable:false, headerSortStartingDir:"desc", headerTooltip:"pr??m??rn?? oponent"},
    {title: "R", field: "ratingDiff", resizable:false, headerSortStartingDir:"desc", headerTooltip:"zm??na ratingu"},
    {title: "M", field: "fastestMates", resizable:false, headerSortStartingDir:"desc", headerTooltip:"nejrychlej???? mat"},
    {title: "S", field: "sensations", resizable:false, headerSortStartingDir:"desc", headerTooltip:"senzace turnaje"},
    {title: "F", field: "fastestGames", resizable:false, headerSortStartingDir:"desc", headerTooltip:"nejrychlej???? hra"},
    {title: "#", field: "present", resizable:false, headerSortStartingDir:"desc", headerTooltip:"po??et odehran??ch turnaj??"}
  ]
  if (enableJouzocoins) leaderboardColumns.push({title: "Jz", field: "jouzoCoins", resizable:false, headerSortStartingDir:"desc", headerTooltip:"slavn?? Jouzocoins"})
  let columnsBuilder = [
    {//create column group
      title: "Monday Fights Leaderboard",
      frozen:true,//frozen column group on left of table
      columns: leaderboardColumns
    }
  ]
  let curMonth = undefined
  let curColumns = []
  let colNo = 1

  let mainMFURL = window.location.origin + "/MondayFight"

  function pushFight(fight, tooltip) {
    curColumns.push(
      {
        title: `<a href='${mainMFURL}/?mf=${fight.id}'>${colNo}</a>`,
        field: "t" + colNo++,
        headerTooltip: tooltip,
        headerSort: false,
        align: "center",
        resizable: false,
        formatter: jouzoCoinsFormatter,
        bottomCalc: "count"
      }
    )
  }

  function pushMonth() {
    columnsBuilder.push(
      {
        title: curMonth,
        columns: curColumns
      }
    )
    curColumns = []
  }

  theFights.forEach( fight => {
    let date = new Date(fight.startsAt)
    let month = ['Leden','??nor', 'B??ezen', 'Duben', 'Kv??ten', '??erven', '??ervenec', 'Srpen', 'Z??????', '????jen', 'Listopad', 'Prosinec'][date.getMonth()]
    if (curMonth !== month) {
      if (curMonth !== undefined) pushMonth()
      curMonth = month
    }
    pushFight(fight, date.toDateString())
  })
  pushMonth()

  return columnsBuilder
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Parse.pgn demo
function loadDoc() {

  function logger(logLine) {
    document.getElementById("gamesJson").innerHTML = logLine
  }
  let downloadedTournamentsGames = LAPI.lichessAPI().downloadMissingTournamentGames(logger)
  document.getElementById("gamesJson").innerHTML = JSON.stringify(downloadedTournamentsGames, null, 0)

  /*
  let xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      // see https://github.com/mliebelt/pgn-parser and https://github.com/Bebul/MondayFight/issues/7#issuecomment-721996465
      let gameList = parsePgn(this.responseText, {startRule: "games"})   // or sample: '[White "Me"] [Black "Magnus"] 1. f4 e5 2. g4 Qh4#'
      let theList = "<ol>"
      gameList.forEach(function(x) {
        theList += '<li>'+ x.tags.UTCTime + ' ' + x.tags.White + ' : ' + x.tags.Black + ' ' + x.tags.Result + '</li>'
      })
      theList += "</ol>"
      document.getElementById("demoRequest").innerHTML = theList
    }
  }
  // CORS policy problem: FIX - Enabling "Allow Unsigned Requests" in Build Execution and Deployment -> Debugger setting of Webstorm fixed it for now.
  //xhttp.open("GET", "https://lichess.org/api/tournament/5upWReOp/results", true)   // Pgn can be downloaded like this: "https://lichess.org/api/tournament/5upWReOp/games?pgnInJson=true"
  xhttp.open("GET", "https://lichess.org/api/tournament/5upWReOp/games", true)
  xhttp.send()
*/
}

const zeroPad = (num, places) => String(num).padStart(places, '0')
function formatTime(time) {
  let minutes = Math.floor(time / 60)
  let seconds = time % 60
  return minutes + ":" + zeroPad(seconds, 2)
}

export function gameListData(games) {
  let tableData = []
  games.games.forEach( g => {
    let result = ""
    if (g.winner === "black") result = "0-1"
    else if (g.winner === "white") result = "1-0"
    else result = "??-??"
    let opening = ""
    if (g.opening !== undefined) opening = g.opening.name
    let ply = g.ply
    let time = Math.floor((g.lastMoveAt - g.createdAt) / 1000)

    Number.prototype.padLeft = function(base,chr){
      var  len = (String(base || 10).length - String(this).length)+1
      return len > 0? new Array(len).join(chr || '0')+this : this
    }
    let d = new Date(0) // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(g.createdAt/1000)
    let date = [d.getFullYear().padLeft(), (d.getMonth()+1).padLeft(), d.getDate().padLeft()].join('/')+' '+ [d.getHours().padLeft(), d.getMinutes().padLeft(), d.getSeconds().padLeft()].join(':')

    let url = "https://lichess.org/" + g.id

    let mainMFURL = window.location.origin + "/MondayFight"

    let row = {
      "id": g.id,
      "date": {date: date, html: `<a href="${mainMFURL}/?mf=${g.tournament}" class="result-url">${date}</a>`},
      "speed": g.speed,
      "white": g.players.white.user.name,
      "black": g.players.black.user.name,
      "result": {result: result, html: `<a href="${url}" class="result-url">${result}</a>`},
      "moves": ply,
      "time": time,
      "opening": opening,
      "status": g.status,
      "trophy": getTrophies(g)
    }
    tableData.push(row)
  })
  return tableData
}

export var gameListTable
export function createGameListTable(games, tableId, addDate, noStats, winner) {
  let gamesData = gameListData(games)

  function detectWhiteWinner(cell, pars) {
    if (cell._cell.row.data.result.result=="1-0") return "<b>"+cell.getValue()+"</b>"
    else return cell.getValue()
  }
  function detectBlackWinner(cell, pars) {
    if (cell._cell.row.data.result.result=="0-1") return "<b>"+cell.getValue()+"</b>"
    else return cell.getValue()
  }
  let columnsAr = [{formatter: "rownum", headerSort: false, resizable:false}] //add auto incrementing row number
  if (addDate) {
    columnsAr.push({title: "date", field: "date", resizable:false, formatter: (cell, pars) => cell.getValue().html, sorter: (a, b) => a.date.localeCompare(b.date)})
  }
  columnsAr = columnsAr.concat([
    {title: "speed", field: "speed", resizable:false, align: "center"},
    {title: "white", field: "white", resizable:false, formatter: detectWhiteWinner},
    {title: "black", field: "black", resizable:false, formatter: detectBlackWinner},
    {title: "result", field: "result", resizable:false, align: "center", formatter: (cell, pars) => cell.getValue().html, sorter: (a, b) => a.result.localeCompare(b.result)},
    {title: "moves", field: "moves", align: "center", resizable:false, formatter: (cell, pars) => Math.floor((cell.getValue()+1)/2) },
    {title: "time", field: "time", align: "center", resizable:false, formatter: (cell, pars) => formatTime(cell.getValue()) },
    {title: "opening", field: "opening", resizable:false},
    {title: "status", field: "status", align: "center", resizable:false},
    {title: "trophy", field: "trophy", align: "center", resizable:false, formatter: (cell, pars) => cell.getValue()}
  ])
  gameListTable = new Tabulator(tableId, {
    layout: "fitDataTable",
    reactiveData: true, // we want setData having effect
    rowFormatter: function(row){
      if (row.getData().date && row.getData().date.html.match(/playOFF/)) {
        let col = '#def'
        if (row.getPosition(false) % 2 > 0) col = '#d0e0f0'
        const children = row.getElement().childNodes[1].style.backgroundColor = col
      }
    },
    columns: columnsAr
  })
  gameListTable.setData(gamesData)

  if (noStats != true) createStatisticsBars(gamesData, tableId, winner)
}


function myLinkFormatter(cell, formatterParams) {
  let cellValue = cell.getValue()
  let data = cell.getData()
  let label = data["name"]
  let rank = data["rank"]
  let prank = data["prank"]


  let color = "red"
  if (rank < 5) color = "green"
  else if (rank < 13) color = "blue"

  let arrow = ""
  if (rank - prank < 0) arrow = "<span style='color: green'><b>&#9650;</b></span>"
  else if (rank - prank > 0) arrow = "<span style='color: red'><b>&#9660;</b></span>"

  return `<a class="league-link" href="${cellValue}" target="_blank" style="color: ${color}">${label}${arrow}</a>`
}

function rankFormatter(cell, formatterParams) {
  let cellValue = cell.getValue()
  let rank = cell.getData()["rank"]

  let color = "red"
  if (rank < 5) color = "green"
  else if (rank < 13) color = "blue"

  cell.getElement().style.backgroundColor = color
  return `<span style="color:lightgray"><b>${cellValue}</b></span>`
}

export function getLeagueDataOfPlayers(theFights, mfId) {
  let lastFight = theFights.find(fight =>
    fight.id === mfId
  )
  let players = getPlayers(theFights)
  let tableData = []
  players.forEach( player => {
      let averagePerformance = getAvgPerformance(player, theFights)
      let totalPoints = getTotalPoints(player, theFights) + averagePerformance / 10000
      let thePlayer = {
        name: player,
        nameUrl: "https://lichess.org/@/" + player,
        totalPts: totalPoints,
        prevPts: totalPoints - playerPoints(lastFight, player)[0],
        games: getTotalGames(player, theFights),
        ratingDiff: getTotalRatingDiff(player, theFights)
      }
      tableData.push(thePlayer)
    }
  )
  let sorted = tableData.sort( (a,b) => {
    if (a.prevPts > b.prevPts) return -1
    else if (a.prevPts < b.prevPts) return 1
    else return 0
  })
  sorted.forEach(
    (player, index) =>
      player.prank = index + 1
  )

  sorted = tableData.sort( (a,b) => {
    if (a.totalPts > b.totalPts) return -1
    else if (a.totalPts < b.totalPts) return 1
    else return 0
  })

  sorted.forEach(
    (player, index) =>
      player.rank = index + 1
  )

  return sorted
}

export function getLeagueData(data) {
  let mfId = data.tournamentGames()[data.currentGameListTableIx].id
  let date = new Date(data.findTournament(mfId).startsAt)

  let fights = MF.filterUpTo(data.mondayFights(), date)
  return {
    league: getLeagueDataOfPlayers(fights, mfId),
    count: fights.length
  }
}

export async function downloadUserDataIntoLeague(league) {
  let ids = league.map(p => p.name).join(',')
  return await LAPI.lichessAPI().users(ids).then( users => {
    for (let i=0; i<league.length; i++) {
      let data = users.find(u => u.username === league[i].name)
      league[i].data = data
    }
    return league
  })
}

export var leagueTable
export function createLeagueTable(data, tableId, leagueNoId, spiderId) {
  document.getElementById(tableId.substring(1)).innerHTML = ""

  const {league: dataOfPlayers, count: fightsCount} = getLeagueData(data)

  leagueTable = new Tabulator(tableId, {
    layout: "fitDataTable",
    reactiveData:true, // we want setData having effect
    data: dataOfPlayers,
    columns: [
      {title: "", field: "rank", headerSort: false, resizable:false, align: "center", formatter:rankFormatter},
      {title: "Hr????", field: "nameUrl", headerSort: false, resizable:false, formatter:myLinkFormatter},
      {title: "Pt", field: "totalPts", headerSort: false, resizable:false, headerSortStartingDir:"desc", headerTooltip:"celkov?? po??et bod??", formatter: totalPtsFormatter},
      {title: "G", field: "games", headerSort: false, resizable:false, headerSortStartingDir:"desc", headerTooltip:"po??et her"},
      {title: "R", field: "ratingDiff", headerSort: false, resizable:false, headerSortStartingDir:"desc", headerTooltip:"zm??na ratingu"},
    ]
  })

  if (spiderId) {
    drawSpider(dataOfPlayers, spiderId)
  }

  if (leagueNoId) {
    document.getElementById(leagueNoId).innerHTML = `${fightsCount}.t??den`
  }
}

function getGameListResultStats(gamesData) {
  let white = 0, draw = 0, black = 0
  gamesData.forEach(row => {
    if (row.result.result == '1-0') white++
    else if (row.result.result == '0-1') black++
    else draw++
  })
  return ['', white, draw, black]
}

function getGameListMostActivePlayerStats(gamesData, winner) {
  let bossPlayer = ""
  if (winner) {
    bossPlayer = winner
  } else {
    let players = new Map()
    function incrementPlayer(player) {
      let data = players.get(player)
      if (data === undefined) data = 0
      data++
      players.set(player, data)
    }
    gamesData.forEach(row => {
      incrementPlayer(row.white)
      incrementPlayer(row.black)
    })
    let max = ["", -1]
    for(let [pl, num] of players){
      if (num > max[1]) max=[pl, num]
    }
    bossPlayer = max[0]
  }
  let bossWhite = {win: 0, draw: 0, loss: 0}
  let bossBlack = {win: 0, draw: 0, loss: 0}
  gamesData.forEach(row => {
    if (row.white==bossPlayer) {
      if (row.result.result == "1-0") bossWhite.win++
      else if (row.result.result == "0-1") bossWhite.loss++
      else bossWhite.draw++
    } else if (row.black==bossPlayer) {
      if (row.result.result == "0-1") bossBlack.win++
      else if (row.result.result == "1-0") bossBlack.loss++
      else bossBlack.draw++
    }
  })
  return {player: bossPlayer, whiteStats: bossWhite, blackStats: bossBlack}
}

var myGoogleCharts = new Map()

export function updateMostActivePlayer(id, gamesData, winner) {
  let plStats = getGameListMostActivePlayerStats(gamesData, winner)

  let barData = myGoogleCharts.get(id+'plwhite')
  if (barData !== undefined) {
    let data = google.visualization.arrayToDataTable([
      ['Genre', plStats.player + ' wins', 'Draw', 'Black wins'],
      [plStats.player + ' White', plStats.whiteStats.win, plStats.whiteStats.draw, plStats.whiteStats.loss]
    ])
    barData.chart.draw(data, barData.options)
  }
  let barData2 = myGoogleCharts.get(id+'plblack')
  if (barData2 !== undefined) {
    let data = google.visualization.arrayToDataTable([
      ['Genre', 'White wins', 'Draw', plStats.player + ' wins'],
      [plStats.player + ' Black', plStats.blackStats.loss, plStats.blackStats.draw, plStats.blackStats.win]
    ])
    barData2.chart.draw(data, barData2.options)
  }
  let barData3 = myGoogleCharts.get(id+'plall')
  if (barData3 !== undefined) {
    let data = google.visualization.arrayToDataTable([
      ['Genre', plStats.player + ' wins', plStats.player + ' draw', plStats.player + ' loss'],
      ['', plStats.whiteStats.win+plStats.blackStats.win, plStats.whiteStats.draw+plStats.blackStats.draw, plStats.whiteStats.loss+plStats.blackStats.loss]
    ])
    barData3.chart.draw(data, barData3.options)
  }
}

export function updateGoogleBar(barid, gamesData) {
  let barData = myGoogleCharts.get(barid)
  if (barData !== undefined) {
    let statsData = getGameListResultStats(gamesData)
    let data = google.visualization.arrayToDataTable([
      ['Genre', 'White wins', 'Draw', 'Black wins'],
      statsData
    ])
    barData.chart.draw(data, barData.options)
  }
}

function createStatisticsBars(gamesData, tableId, winner) {
  let wbStat = getGameListResultStats(gamesData)
  let wbArrayData = [['Genre', 'White wins', 'Draw', 'Black wins'], wbStat]
  let id = null
  let idHash = tableId.match(/#(.+)/)
  if (Array.isArray(idHash)) id = idHash[1]
  if (id != null) {
    // see: https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions
    //const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vw = Math.max(document.documentElement.clientWidth || 0, 360)

    createStatsBar4GameList(wbArrayData, id+"Bar", vw)

    let plStats = getGameListMostActivePlayerStats(gamesData, winner)
    let plwhiteData = [
      ['Genre', plStats.player + ' wins', 'Draw', 'Black wins'],
      [plStats.player + ' White', plStats.whiteStats.win, plStats.whiteStats.draw, plStats.whiteStats.loss]
    ]
    createStatsBar4GameList(plwhiteData, id+"plwhite", vw)
    let plblackData = [
      ['Genre', 'White wins', 'Draw', plStats.player + ' wins'],
      [plStats.player + ' Black', plStats.blackStats.loss, plStats.blackStats.draw, plStats.blackStats.win]
    ]
    createStatsBar4GameList(plblackData, id+"plblack", vw)
    let plallData = [
      ['Genre', plStats.player + ' wins', plStats.player + ' draw', plStats.player + ' loss'],
      ['', plStats.whiteStats.win+plStats.blackStats.win, plStats.whiteStats.draw+plStats.blackStats.draw, plStats.whiteStats.loss+plStats.blackStats.loss]
    ]
    createStatsBar4GameList(plallData, id+"plall", vw, ['#9c0', 'grey', 'red'])
  }
}

function createStatsBar4GameList(arrayData, id, vw, colorListPar) {
    let colorList = (colorListPar !== undefined) ? colorListPar : ['white', 'grey', 'black']
    let barElement = document.getElementById(id)
    if (barElement != null) {
      // Load google charts
      google.charts.load('current', {'packages':['corechart']})

      google.charts.setOnLoadCallback(drawChart)

      // Draw the chart and set the chart values
      function drawChart() {
        var data = google.visualization.arrayToDataTable(arrayData)

        var options = {
          width: Math.min(vw, 600),
          height: 80,
          legend: { position: 'top', maxLines: 3 },
          bar: { groupWidth: '75%' },
          colors: colorList,
          backgroundColor: '#E4E4E4',
          isStacked: 'percent'
        }
        // Display the chart inside the <div> element with id="piechart"
        var chart = new google.visualization.BarChart(barElement)
        myGoogleCharts.set(id, {'chart': chart, 'options': options})
        chart.draw(data, options)
      }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// fetch demo
function textFile2String(path) {
  fetch(path)
    .then(response => response.text())
    .then((data) => {
      console.log(data)
    })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// main initialization

function updateHTMLWithDownloadedTournaments(data, downloadedTournaments) {
  let tag = document.getElementById("finalJson")
  tag.innerHTML = JSON.stringify(downloadedTournaments, null, 0);

  // recalculate data and tables
  if (downloadedTournaments.length > 0) {
    let table10 = allMyTables.get("#last10")
    if (table10 !== undefined) {
      let theFights = MF.last10(data.mondayFights())
      table10.setColumns(generatePlayersTableColumns(theFights))
      table10.setData(getDataOfPlayers(theFights))
    }

    let tableAll = allMyTables.get("#mondayFightsLeaderboard")
    if (tableAll !== undefined) {
      let theFights = MF.filterYear(data.mondayFights(), 2022)
      tableAll.setColumns(generatePlayersTableColumns(theFights))
      tableAll.setData(getDataOfPlayers(theFights))
    }
  }
}

export function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function toNDJson(arr) {
  return arr.reduce(function(ndjson, obj) {
    return ndjson + JSON.stringify(obj) + "\n"
  }, "")
}

export function processAdmin(data) {

  // nice is: https://developers.google.com/web/updates/2015/03/introduction-to-fetch
  //textFile2String('pgn/parsePgn.js')

  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  const admin = urlParams.get('bebul')!=null
  if (admin) {
    let allFights = data.jouzoleanAndBebulsTournaments()

    document.getElementById("adminStuff").style.display = "block"
    let text = ""
/*
    let text = "<table><th>Url</th><th>Players</th><th>Games</th><th>Date</th><th>Gold</th><th>Score</th><th>ELO</th><th>Silver</th><th>Score</th><th>ELO</th><th>Bronze</th><th>Score</th><th>ELO</th>"
    allFights.forEach( function myFunction(value) {
      let info = '<td><a href="https://lichess.org/tournament/' + value.id + '">' + value.id + '<\a></td>'
      info += '<td>' + value.nbPlayers + '</td>'
      info += '<td>' + value.stats.games + '</td>'
      info += '<td>' + value.startsAt + '</td>'
      let winner = value.standing.players[0]
      info += '<td>' + winner.name + '</td>'
      info += '<td>' + winner.score + '</td>'
      info += '<td>' + winner.rating + '</td>'
      winner = value.standing.players[1]
      info += '<td>' + winner.name + '</td>'
      info += '<td>' + winner.score + '</td>'
      info += '<td>' + winner.rating + '</td>'
      if (value.nbPlayers > 2) {
        winner = value.standing.players[2]
        info += '<td>' + winner.name + '</td>'
        info += '<td>' + winner.score + '</td>'
        info += '<td>' + winner.rating + '</td>'
      }
      text += "<tr>" + info + "</tr>"
    })
    text += "</table>"
*/
    text += "      <div style=\"margin: 10px 0\">\n" +
      "                <button id=\"dwnlALL\">Download ALL new Monday Fight Tournamens</button>\n" +
      "            <div>Zadej id konkr??tn??ho turnaje, kter?? chce?? downloadovat:\n" +
      "                <input type=\"text\" id=\"tournamentDwnlID\" style=\"width:100%\">\n" +
      "                <input type='checkbox' id='rename' checked='true'>Rename</input>" +
      "                <br>\n" +
      "                <button id=\"dwnl\">Download</button>\n" +
      "            </div>\n" +
      "        </div>\n" +
      "  <hr><pre id='tournamentDwnlResult'>Tady se objev?? v??sledek downloadu</pre>" +
      "  <hr><pre id='tournamentGamesResult'>Tady se objev?? v??sledek downloadu her</pre>"

    document.getElementById("demo").innerHTML = text
    document.getElementById("dwnl").onclick = function() {
      let rename = document.getElementById("rename").checked
      LAPI.onDwnlTournamentClicked(data, rename)
    }

    document.getElementById("dwnlALL").onclick = function() {
      LAPI.lichessTournamentsAPI(allFights, ["bebul","Jouzolean"]).downloadMissing(LAPI.updateHTMLurlRequestsList)
        .then(function(downloadedTournaments) {
            if (downloadedTournaments.length) {
              data.addTournaments(downloadedTournaments) // updates mondayFights and everything
              updateHTMLWithDownloadedTournaments(data, downloadedTournaments)
              LAPI.lichessAPI().downloadMissingTournamentGames(data, LAPI.updateHTMLurlRequestsList)
                .then(function(games) {
                  data.addGames(games)
                  downloadedTournaments.forEach(t => data.addExtras(t))
                  addNewGamesStats(data, games)
                    .then(function(result) {
                      download("tournaments.ndjson", toNDJson(data.jouzoleanAndBebulsTournaments()))
                      download("tournamentGames.ndjson", toNDJson(data.tournamentGames()))
                    })
                })
            }
          }
        )
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Table helpers, formatters etc.
function jouzoCoinsFormatter(cell, formatterParams) {
  let cellValue = cell.getValue()
  if (cellValue===undefined) return ""
  if (cellValue.rank == 1) cell.getElement().style.backgroundColor = "gold"
  else if (cellValue.rank == 2) cell.getElement().style.backgroundColor = "silver"
  else if (cellValue.rank == 3) cell.getElement().style.backgroundColor = "#cd7f32"
/*
  else if (cellValue.rank == 4) cell.getElement().style.backgroundColor = "lightgreen"
  else if (cellValue.rank <= 6 && cellValue.players >= 10) cell.getElement().style.backgroundColor = "orange"
*/
  let value = ''
  let mfMode = this.table.mfMode
  if (mfMode === 'jouzoCoins') value = cellValue.jouzoCoins
  else if (mfMode === 'present') value = cellValue.present
  else if (mfMode === 'totalScore') value = cellValue.score
  else if (mfMode === 'totalPts') value = cellValue.points
  else if (mfMode === 'games') value = cellValue.games
  else if (mfMode === 'avgPerformance') value = cellValue.performance
  else if (mfMode === 'avgOponent') value = cellValue.oponent
  else if (mfMode === 'ratingDiff') value = cellValue.diff
  else if (mfMode === 'fastestMates') value = cellValue.mate
  else if (mfMode === 'fastestGames') value = cellValue.fast
  else if (mfMode === 'sensations') value = cellValue.sensation

  if (cellValue.present) return value
  else return ""
}

function totalPtsFormatter(cell, formatterParams) {
  let cellValue = cell.getValue()
  if (cellValue===undefined) return ""
  return Math.floor(2 * cellValue) / 2
}

function dataSortedFunc(sorters) {
  let newMode = undefined
  sorters.forEach( function(srt) {
      if (srt.field === 'jouzoCoins' ||
        srt.field === 'totalScore' ||
        srt.field === 'totalPts' ||
        srt.field === 'games' ||
        srt.field === 'avgPerformance' ||
        srt.field === 'avgOponent' ||
        srt.field === 'ratingDiff' ||
        srt.field === 'fastestMates' ||
        srt.field === 'fastestGames' ||
        srt.field === 'sensations'
      ) newMode = srt.field
    }
  )
  if (newMode !== undefined && this.mfMode != newMode) {
    this.mfMode = newMode
    //and we must call something like row.reformat() or column.reformat for each column
   this.redraw(true)
  }
}

export var allMyTables = new Map()
export function createPlayersTable(theFights, tableId, enableJouzocoins) {
  document.getElementById(tableId.substring(1)).innerHTML = ""
  let playersTable = new Tabulator(tableId, {
    layout: "fitDataTable",
    reactiveData:true, // we want setData having effect
    dataSorted: dataSortedFunc,
    data: getDataOfPlayers(theFights),
    columns: generatePlayersTableColumns(theFights, enableJouzocoins)
  })
  allMyTables.set(tableId, playersTable)
  if (enableJouzocoins) playersTable.setSort("jouzoCoins", "desc")
  else playersTable.setSort([{column: "totalPts", dir: "desc"}])
}

export function updateSpecificTournamentHtml(divId, tournamentId) {
  let spec = [
    {id: "z2iN8qVr", html: "<b>Bebul:</b> Gratulujeme Rychl??mu Lenochodovi k prvn??mu leto??n??mu King Kongovi! Dal mat, ani?? by ztratil jak??koli materi??l a nav??c stihl postavit d??mu nav??c! ????<br><br>"},
    {id: "x6hNptkr", html: "<b>N??sleduj??c?? hry byly z turnaje odstran??ny.</b><br><img src='img/buta.png'><br><br><b>Jouzolean:</b><br> A aby ten dne??ek nebyl tak smutn??, tak m??m taky jednu dobrou zpr??vu ???? Kolem Prahy te?? let??lo hejno pt??k?? a sk??ehotaly, ??e let?? od Dob??????e a ??e prej se tam chyst?? velk?? v??c! N???? mistr Bukowskic pr?? bude tr??novat m??stn?? ml??de?? v ??achu! Tak??e douf??me, ??e do na??ich skromn??ch ??ad p??ibydou nov?? ??achov?? nad??je v podob?? Bukowskiho rekrut??. To je velk?? krok pro celou Dob?????? - a?? jednou usly????te, ??e Dob?????? hraje extraligu, pamatujte kdo za t??m stoj??!! ????<br><br>" +
        "<b>DJ-Pesec:</b><br> Tak to gratuluju! Az Buk deti nauci jeho neprostupnou Philidorovu obranu, urcite se neztrati ????<br><br>" +
        "<b>Bukowskic:</b><br> Jo vrabci, no par??da, te?? u?? z toho nevykrout??m. Ale pravda, alespo?? se dou????m ta zah??jen??."
    },
    {id: "20AI0ybI", html: "<img src='img/vikJavMeme.jpg'>"},
    {id: "UZ9MlL1y", html: "<img src='img/mf-og-x.jpg'>"},
    {id: "7d6oiMze", html: "<img src='img/mf-og-hot.jpg>"},
    {id: "R77TPv23", html: "<img src='img/mf-og-hot2.jpg'>"},
    {id: "cz8LzOSL", html: "<b>Mrazek:</b><br> J?? bych cht??l nen??padn?? upozornit na to, ne ??e bych se n??jak chv??stal, ale ??e dnes bukowskic byl pr??v?? jednou pora??en, jedn??m hr????em, kter??ho nebudu jmenovat, aby to nevypadalo moc nabub??ele. Takov?? v??hra pak dok????e p??eb??t i zklam??n?? z vyhran??ch parti?? nedot??hnut??ch kv??li ??asu ??i ji?? tradi??n?? prohran??ch rem??zov??ch koncovek ???? nehled?? pak na vylo??en?? jedovat?? z??rmutek z ??ist?? prohran??ch parti??... to v??echno ta jedna v??hra dok????e p??eb??t, takovou kouzelnou moc m?? jedna jedin?? v??hra s bukowskicem. Doporu??uju f??em co nejd????ve vyzkou??et.<br>Stoj?? to za to ????"},
    {id: "z2iN8qVr", html: "<b>Bebul:</b> Jouzolean v dne??n?? <a href='https://lichess.org/DxokmcB1/white#65' target='_blank'>par??di??ce</a> s Pukl??mChlebem nejen??e dal mat jezdcem, ale tah p??edt??m je??t?? drze ob??toval svou d??mu!<br><img src='img/nepraktaManzelHrajeSachy.jpg' style='margin-top:10px'>" +
        "<br><br><b>B??bul:</b> Ud??lal jsem p??r zm??n na t??chto str??nk??ch. Hr????i janshorny z??st??v?? ??achovnice pro nejrychlej???? partii. Raketov?? v??hra v??ak nastala kv??li timeoutu. Nen?? v tom s??m, stalo se to u?? 4x, nov?? lze takov?? partie dohledat pomoc?? dotazu <a href='search.html?q=fastest%20timeout'><b>fastest timeout</b></a>. Plaketka rakety pro v??t??zn?? partie do deseti tah?? se po ??prav?? pro vytimeoutovan?? partie u?? neud??luje, tak??e po rozkliknut?? hr????e tam raketa z??m??rn?? chyb??.<br> Krom toho jsem obohatil search engine o mo??nosti typu <b>min-moves:100</b> pro hled??n?? dlouh??ch parti?? a podobn?? <b>max-moves:15</b>. Oboje se d?? kombinovat. K tomu jsem je??t?? p??idal mo??nost vyhledat <b>fastest</b>." +
        "<br><br><b>B??bul:</b> V??t??me nov??ho hr????e Jana Shorn??ho. Pro budouc?? n??v??t??vn??ky jen pozn. k duplicit?? baronGorc a janshorny. Sna??ili jsme se, aby nov?? hr???? neza????nal s <b>provisional</b> ratingem, co?? baronGorc zvl??dl dob??e, nicm??n?? m??l je??t?? jeden star?? ????et, na kter??m nehr??l a kter?? pou????vat necht??l. V turnaji se tak objevily ????ty dva. Lichess na??t??st?? p??roval jen jednoho z nich, ale nane??t??st?? toho s provizorn??m ratingem. V datech mimochodem ta informace o provizorn??m ratingu je, tak??e se s t??m p????padn?? d?? pracovat."},
    { id: "ayJNboMi",
      init: function() {
        let config = {
          pgn: "[Event \"Monday Fight Arena\"]\n" +
            "[Site \"https://lichess.org/hlwuMuIF\"]\n" +
            "[Date \"2022.04.04\"]\n" +
            "[White \"Margarita_Vlasenko\"]\n" +
            "[Black \"janshorny\"]\n" +
            "[Result \"1-0\"]\n" +
            "\n" +
            "1. e4 e5 2. Bc4 { C23 Bishop's Opening } Qe7 3. d3 Nc6 4. Nf3 f6 5. Nc3 b6 6. O-O d6 7. h3 Bd7 8. Nd5 Qd8 9. c3 Be6 10. d4 Bxd5 11. Bxd5 Nce7 12. Bxa8 Qxa8 13. dxe5 Qxe4 14. exd6 Nd5 15. dxc7 Nxc7 16. Re1 Qe7 17. Rxe7+ Bxe7 18. Bf4 Ne6 19. Bg3 Nh6 20. Qd5 Nf8 21. Re1 Nd7 22. Qe6 Kf8 23. Qxe7+ Kg8 24. Qxd7 g6 25. Re8# { White wins by checkmate. } 1-0",
          showCoords: false, coordsInner: false, headers: true,
          theme: 'brown',
          boardSize: 290,
          movesHeight: 250,
          startPlay: '19'
        }
        PGNV.pgnView("board", config)
      },
      html: "<h2>?????????? ???????????????????? ??????????????????</h2>?????????????? ?????????????????? ?????????????? ?????????????? ?? Monday Fight. ???? Lichess ?????????????????? ???? ?? ???????? ?? ?????????????? ???????????????? ???????????? ???????? ??????, ?? ???????? ???????? ?????????????????? ?????????? ?????????????????? ??????????????. ?????????? ???????????????? <a href='https://lichess.org/hlwuMuIF' target='_blank'>?????????????????? ????????!</a><br><br><div id='board'></div>"
    },
    {id: "ZNI7qbN3", html: "<b>Margarita</b> ????????????<br><b>DJ-Pesec</b> ????????????<br><b>Mrazek</b> ????????????????????<br><b>VikJav</b> ????????????<br><b>tomasklimecky</b> dob??e margarita<br><b>mozkomor</b> Nezapo????talo mi to rem??zu s Jouzoleanem. Vzn??????m n??mitku.<br><b>Mrazek</b> bodovan?? je jen prvn?? rem??za v ??ad??, za dal???? jsou nuly<br><b>Mrazek</b> asi aby se skupinka lid?? na turnaji nedohodla na syst??mu neztr??cejme ??as, d??me rem??zu a t??m by z??sk??vali body proti ostatn??m rychle<br><b>mozkomor</b> To d??v?? smysl. Ale do leaderboadu to hude p??lbod, ne?\<br><b>bebul</b> ano, do leaderboardu samoz??ejm?? p??l bodu"},
    {id: "aHeatnDc", html: "<img src='img/pomlazka.jpg'>" +
        "<br><br><b>B??bul:</b> V leaderboardov??ch tabulk??ch je nov?? sloupec s pr??m??rn??m protihr????em," +
        "<img src='img/achievements/maraton.png' class='img100 right'> tak??e si m????eme porovnat, s jak t????k??mi soupe??i kdo hrajeme. Na hlavn?? str??nce jsou zobrazeny v??echny odzn????ky, ke kter??m nov?? p??ibyl ??evcovsk?? mat s loupe??n??kem Rumcajsem." +
        "??evcovsk?? maty lze dohledat v search enginu pomoc?? kl????ov??ho slova scholar. V tooltipu hr????e m?? symbol vysok?? boty. Mat d??mou nebo st??elcem na poli f7/f2 mus?? padnout nejpozd??ji v dev??t??m tahu. D??le p??ibyl odznak pro v??t??zn?? maraton pro v??t??zstv?? v aspo?? 100 tahov?? partii a mat na posledn?? chv??li, pokud padl do deseti sekund p??ed koncem turnaje. V detailu hr????e je nov?? mo??no otev????t" +
        "<img src='img/achievements/castling-mate.png' class='img100 left'> jednotliv?? hry kliknut??m na v??sledek v prost??edn??m sloupci. A naho??e je po??et odehran??ch her, abyste nemuseli po????d po????tat, kolik t??ch her vlastn?? RychlyLenochod dneska stihl. Pod ligovou tabulkou je p??id??na gratulace hr????i," +
        "<img src='img/achievements/lucky.png' class='img100 right'> kter?? hr??l nejv??c nad o??ek??v??n?? a je zm??n??n hr????, kter?? ??elil nejt????????m soupe????m. Aby byl hr???? uveden, mus?? ale odehr??t alespo?? 4 partie a pro gratulaci aspo?? dv?? vyhr??t. N??kdy m?? hr????, kter?? v??echny partie prohr??l nepochopiteln?? nadupanou performance, tak??e to jsem musel n??jak eliminovat." +
        "<img src='img/achievements/legal.png' class='img100 left'>K tomu se zm??nil form??t tabulek se seznamem her, ??e datum odkazuje na tuto hlavn?? str??nku k turnaji, kde se hra konala, v??sledek 1-0 atd. odkazuje na hru na lichess a ve t??et??m sloupci jsou odzn????ky, kter?? si hr????i vydobyli." +
        "Taky jsou ud??lov??ny odzn????ky za L??gal??v mat, zn??m?? t???? jako N??mo??n?? kadet. Proto je pou??it Pepek N??mo??n??k. Vyhled??vat lze pomoc?? kl????ov??ho slova legal." +
        "A st??le se nikomu neporada??ilo z??skat diamantov?? odznak za mat ro????dou nebo mat bran??m mimochodem. Tak hur?? do toho!"
    },
    {id: "vWA25bvU", html: "<b>RychlyLenochod</b> p??ipravil v senza??n?? partii jinak stoprocentn??mu <b>Bukowskicovi</b> moc p??knou l????ku, do kter?? se n???? ??ampi??n chytil! Gratulujeme!<br>" +
        "<br><b>Kr??lovsk?? Gambit</b> se dnes hr??l 9x, z ??eho?? 6x triumfovali b??l??. <b>Italsk?? hra</b> se hr??la 7x, p??i??em?? 5x dominovali ??ern??. Dev??t z deseti velmistr?? doporu??uje, aby i zbytek Monday Fighter?? p??e??el na Kr??lovsk?? gambit. ????<br>" +
        "<br><b>Jouzolean:</b> \"Gratulace Bukowskimu k n??vratu na ??elo a taky Mr??zkovi, kter?? se dostal na ??elo posledn??ch 10 turnaj??. ????????\""},
    {id: "k83QeG7o", html: "<b>Mrazek</b> byl dnes jedin?? z n??s, komu se poda??ilo <b>bukowskice</b> porazit. K radosti <b>mozkomora</b> k tomu ale do??lo a?? po limitu, tak??e bedna z??stala mozkomorovi. Bukowskic Mr??zka tr??pil <a href='https://lichess.org/G3YNmKEP/black#199'>sto tah??</a>, aby vzdal jeden tah p??ed matem.<br>" +
        "<br><b>??ty??i hr????i</b> dnes vyhr??li po osmn??cti taz??ch, tak??e za nejrychlej???? parti si odnesli bezv??znamn?? bod????ek dzin69, bebul, mozkomor a jouzolean.<br>" +
        "<br>V??t??me <b>Margaritu</b> mezi prvn??mi dvan??cti, kte???? se nakonec utkaj?? v Play OFF.<br>" +
        "<br><h2>Magnus number</h2><a href='https://freopen.org/'><img src='img/magnusNumber.png'></a><br>" +
        "<b>Bebul:</b> Bukowskic m?? Magnus number #3. Porazil hr????e, kter?? porazil hr????e, kter?? porazil <a href='https://lichess.org/@/DrNykterstein'>Magnuse Carlsena</a>. J?? porazil bukowskice, tak??e m??m #4, stejn?? jako zbytek Monday Fight sv??ta. Klikn??te si na obr??zek z prozkoumejte sv?? sk??re."},
    {id: "Uf128Gvy", html: "<b>Jouzolean:</b> ???? Skv??le jsi mi (B??bule) sko??il do <a href='https://lichess.org/O79AvnKN#33'>milner barry</a> gambitu, j?? na to ??ekal asi p??l roku. Pak jsem si klidn?? dovolil <a href='https://lichess.org/80jSe8Ca#9'>kr??lovsk?? gambit</a> a dostal t????ce na budku ????<br>" +
        "<br><b>B??bul:</b> Kr??lovsk??ch gambit?? se dnes hr??lo dev??t, p??i??em?? osmkr??t se radovali b??l??! A zada??ilo se i v <a href='https://lichess.org/Y2EkADD9#9'>mozkomor vs bukowskic</a>."},
    {id: "ZDcYpWqR", html: "<img src='img/naplavka-pozvanka.jpg'>" +
          "<br><br><b>Bukowskic:</b> Zvu v??s na Slavnost knih na??eho nakladatelstv?? na sm??chovsk?? n??plavce. Tento p??tek 3. ??ervna tam budu cel?? den, uk????u v??m, jak?? kn????ky vyd??v??me, popov??d??me si, d??me si n??co dobr??ho, zahr??t si m????eme i venkovn?? ??achy???.   A v??zva pro v??s! Kdo m?? v ??ach??ch poraz??????nebo remizuje (co?? by v m?? sou??asn?? form?? nem??l b??t probl??m), " +
          "m????e si jako odm??nu vybrat jakoukoliv kn????ku, kter?? se mu bude l??bit! Cel?? program a <a href='https://fb.me/e/3e1wWRiGt'>p??esn?? adresa zde</a>."},
    {id: "13YkPIje", html: "<img src='img/naplavka-maurice.jpg'>" +
          "<br><br>Bukowskic m??l na N??plavce p??ipravenu celou ??k??lu trofej??, z nich?? ov??em ????dnou nepustil. Nejprve si poradil s Maurice Dodo.<br><br>" +
          "<img src='img/naplavka-baron.jpg'><br><br>??anci nedal ani Baronu Gorcovi,<br><br>" +
          "<img src='img/naplavka-jouzolean.jpg'><br><br>a kn????ku nevyhr??l ani (p??e)nat????en?? Jouzole??n, kter?? prvn?? den nemohl z??ejm?? proto, aby celou noc tr??noval, co?? se podepsalo na jeho v??konu.<br><br>"},
    {id: "kbGavs7v", html: "<img src='img/riegerovy-sady-jouzolean.jpg'>" +
          "<br><br><b>Jouzolean:</b>Hl??s??m, ??e dne??n?? turnaj v Riegerov??ch sadech jsme s Tekelem ovl??dli. ???????????? Zde <a href='http://chess-results.com/tnr646946.aspx?lan=5&art=1&flag=30'>v??sledky.</a><br><br>" +
          "<a href='https://lichess.org/@/DJ-Pesec'><img src='img/buki-pesec-dobris.jpg'></a><br><br><b>Bukowskic:</b> Neuv????iteln??, koho potk??te na ned??ln?? m??i na prvn??m svat??m p??ij??m??n?? d??t??! Kdo mysl??te, ??e to je? <i>(5.6.2022, Dob??????)</i><br><br>"},
    {id: "QyFvQ3NF", html: "<b>Jouzolean:</b> Hl??s??me, ??e Jouzolean i Tekele dne??n?? turnaj strategicky vynechaj??<br>" +
        "<b>Bukowskic:</b> ????<br><br>" +
        "<img src='img/iron-maden.jpg'><br><b>Jouzolean:</b> Iron maiden<br><br>" +
        "<b>B??bul:</b> Jouzoleanovou absenc?? se stalo, ??e <b>bukowskic</b> znovu opanoval ??elo tabulky a nedosti na tom, <b>RychlyLenochod</b> se vyhoupl v po??tu 270 odehran??ch parti?? na ??elo nejaktivn??j????ho hr????e turnaje! Gratulujeme!<br><br>" +
        "<b>B??bul:</b> p??e??t??te si nov?? ??l??nky v aktualit??ch. Nap????klad kliknut??m na n??sleduj??c?? obr??zek..." +
        "<a href='actualities.html#fairplay'><img src='img/havel-evangelista.jpg' style='margin-top:5px'></a>" +
        "<div align='center'><i>Bacha Va??ku, m???? napadenou d??mu!</i></div>"},
    {id: "UdiV7hEG", html: "Gratulujeme <a href='https://lichess.org/@/Margarita_Vlasenko'>Margarit??</a> ke kr??sn??mu v??t??zstv?? v Monday Fights turnaji!" +
        "<img src='img/bukowskic-nacelnik.jpg'><br>Propagace ??achu na indi??nsk??m t??bo??e. N????eln??kem s??m velik?? Bukowskic, ??amanem B??bul, z dal????ch hr?????? Sn??lek a Mr????ek."},
    {id: "ugVB04T5", html: "<b>B??bul:</b> Gratulujeme Mr??zkovi k postupu na pr??b????n?? druh?? m??sto v tabulce! V??znamn?? tomu pomohlo v??t??zstv?? v posledn?? partii, kdy hr??l Mr??zek berserk a zmatoval soupe??e t??i vte??iny p??ed koncem turnaje! To je jak sen!" +
        "<br><br><b>B??bul:</b> Nyn?? by se Tekele musel hned v ??vodu PlayOFF prob??t p??es DJ-Pesce a Jouzoleana. K takov??mu losu nezb??v?? ne?? rovn???? pogratulovat! ????<br><br>" +
        "<img src='img/pavoukJouzoTekePesec.png'>" +
        "<br><br><b>B??bul:</b> mozkomor p??kn?? sehr??l s bukowskicem t??i kr??lovsk?? gambity se sk??rem 1??-1??. Celkov?? se kr??lovsk??m gambiter??m vedlo dob??e, sk??re 5-2, p??i??em?? pr??m??rn?? rating ??ern??ch byl 1806. Nech?? ??ady kr??lovsk??ch gambiter?? houstnou!" +
        "<br><br><b>B??bul:</b> zato Italsk?? se dneska moc neda??ilo... Anti-Fried Liver Defense, to zn?? hustokrut??! M??li bychom se to nau??it v??ichni a tu Italskou u?? kone??n??, jednou prov??dy, z Monday Fights vym??tit." +
        "<br><br><b>B??bul:</b> dnes, po ??esti t??dnech, mat v centru! Sp??sn?? mat ve zcela prohran?? pozici. ????"},
    {id: "pcjmBbQU", html: "<b>B??bul:</b> V??t??me <a href='https://lichess.org/@/felcar'>fel??ara</a> na Monday Fight turnaji a gratulujeme k v??t??zstv??." +
        "<br><br><b>B??bul:</b> V rozpa??it??m vstupu, kdy to ve <b>fel??arov??</b> partii s <a href='https://lichess.org/@/Margarita_Vlasenko'>Margaritou</a> bylo jako na houpa??ce, nakonec padl na ??as. <b>Margarit??</b> velk?? gratulace. N???? o??ek??van?? stoprocentn?? debakl za??ehnala hned v ??vodu. ????" +
        "<br><br><b>B??bul:</b> Drahnou chv??li to vypadalo, ??e v??em vyp??l?? rybn??k maestro <a href='https://lichess.org/@/Tekele'>Tekele<a>! Gratulujeme k zaslou??en??mu druh??mu m??stu!" +
        "<img src='img/mozk-last10.png'>" +
        "<br><br><b>B??bul:</b> Gratulujeme <b>mozkomorovi</b> k opanov??n?? tabulky za posledn??ch deset turnaj??!"},
    {id: "5prkKw5E", html: "<b>Mr??zek:</b> My jsme jen cht??li m??t nejrychlej???? partii turnaje ???? To jsou ty odzn????ky a plakety.... ??lov??k se na to upne, sb??r?? to a pak pro to ob??tuje i <a href='https://lichess.org/BAoLvBM8'>partii</a>.<br><br>" +
        "<b>B??bul</b> se p??ipravil na Jouzole??na a ??t??st?? se usm??lo na otrh??nka. Nech?? ??ady kr??lovsk??ch gambiter?? houstnou :-)<iframe src=\"https://lichess.org/embed/WDePduKL#21?theme=brown&bg=light\" style=\"width: 300px; height: 420px;\" allowTransparency=\"true\" frameBorder=\"0\"></iframe>" +
        "<b>Jouzolean</b> se p??ipravil na Fel??ara a pro samou radost, jak to v??echno perfektn?? klaplo, si nechal d??t v naprosto vyhran?? pozici mat" +
        "<iframe src=\"https://lichess.org/embed/eqfvXnzx#38?theme=brown&bg=light\" style=\"width: 300px; height: 420px;\" allowTransparency=\"true\" frameBorder=\"0\"></iframe>"},
    {id: "ESqaQ7eH", html: "Dne??n??mu turnaji p??edch??zela zna??n?? nervozita, neb si v??ichni brousili zuby na setk??n?? s Velmistrem, jak dokazuje n??sleduj??c?? konverzace: " +
          "<br><br><b>VikJav (ned??l?? 19:39):</b> Kluci dnes to nest??h??m, ale pokud dnes nastoup?? velk?? Robert, tak v??m p??eju v??em hodn?? stesti :)) u??ijte si partie a dejte mu co proto." +
        "<br><br><b>Mr??zek:</b> M???? je??t?? 24h ??as ????" +
        "<br><br><b>VikJav:</b> Jsem blazen! Super o nic neprijdu. Tak z??tra ho rozdrtime spole??n??mi silami!" +
        "<br><br>A po ozn??men??, ??e dneska se Robert bohu??el nem????e turnaje z????astnit p??i??lo:" +
        "<br><br><b>Bukowskic:</b> Tak j?? se v??era tak p??ipravoval, ale to je jasn??, lep???? bude, kdy?? p??ijde Robert v pln?? form??!" +
        "<br><br><b>Jouzolean:</b> co sis p??ipravoval? ????????" +
        "<br><br><b>Bukowskic:</b> Ne??el jsem na kolo a m??sto toho jsem se cel?? odpoledne rozehr??val!" +
        "<br><br>... a jak vidno, p????prava nam??sto velmistrovsk?? hlavy pokosila n??s ostatn??. Gratulujeme!" +
        "<br><br><b>B??bul:</b> U?? jste se pod??vali na nejrychlej???? dne??n?? mat? To zas jednou B??bulkovi vy??la p????prava! Nech?? ??ady Kr??lovsk??ch Gambiter?? houstnou!"},
    {id: "fXU6tfJM", html: "<div align='center'><h3>Monday Fight</h3><h2>s GM Robertem Cvekem</h2></div>" +
        "Dne??ek je pro Monday Fights sv??tek, neb n??s poctil svou n??v??t??vou Velmistr <a href='https://www.sachycvek.cz/'>Robert Cvek</a>. Byl to fofr. Nikdo z n??s ho nenachytal na ??vestk??ch. Za n??v??t??vu moc d??kujeme a k v??t??zstv?? gratulujeme." +
        "<img style='margin-top:5px' src='img/cvek-nss.jpg'><div style='text-align: center; margin-bottom:5px'><i>Robert Cvek jako v??t??z turnaje ke 100 let Salo Flohra. I p??es ????ast Davida Navary turnaj zcela ovl??dli velmist??i Novoborsk??ho ??K, zleva Viktor L??zni??ka, Robert Cvek a Zbyn??k Hr????ek<br> Z??ejm?? dobr?? odd??l.</i></div>" +
        "K dne??n??m parti??m Jouzoleanovi napsal, ??e to byly dobr?? partie a ze si kone??n?? po dlouh?? dob?? s klidnou hlavou zahr??l." +
        "<p>Po turnaji Robert Cvek ??ekl: \"Vyhr??t takov?? turnaj je pro m?? obrovsk?? ??sp??ch, jednozna??n?? nejv??t???? co se t????e ...\", tedy ??ekl to po tom turnaji ke 100 let Salo Flohra a ne zrovna po dne??n??m turnaji ????, ale hr??l dnes s n??mi Monday Fight a odehr??l 14 parti??, tak??e radost m??me p??evelikou!</p>" +
        "<img style='margin-top:5px' src='img/cvek-owen.png'><div style='text-align: center; margin-bottom:5px'><i>Tuto strukturu vypadaj??c?? jako koruna vybudoval Robert Cvek hned v n??kolika parti??ch. Jedn?? se o Owen defense, kter?? se p??edt??m hr??la na <a href='https://bebul.github.io/MondayFight/search.html?q=%22owen%20defense%22'>Monday Fights 13x</a> a poka??d?? zv??t??zili b??l??. Robert Cvek tedy tomuto zah??jen?? pon??kud zvedl reputaci.</i></div>" +
        "<p>Kdy?? na sob?? zapracujeme, jist?? se k n??m velmist??i jen pohrnou a trofej z Monday Fight bude zdobit nejeden velmistrovsk?? st??l."},
    {id: "fgEf7SDZ", html: "<img src='img/trenink-tekele.jpg'>" +
        "<br><br><b>Jouzolean:</b>Zase tr??nink. Po no??n?? ????????. Tento t??den u?? t??et??. A to je teprve ??ter??.<br><br>" +
        "<b>B??bul:</b> No j??, chlapc?? potr??novali a sebrali si prvn?? dv?? m??sta v turnaji. ??e jim nen?? ha??ba! ????<br><br>" +
        "<b>B??bul:</b> K ??sp????n??mu tr??ninku gratulujeme!<br><br>"},
    {id: "PbjeR9c2", html: "<b>B??bul:</b> Bukowskic dneska v prvn??ch p??ti hr??ch ??ty??ikr??t prohr??l. P??esto v??ak dok??zal vybojovat zlato! Nezdoln?? ??ampi??n! Pomohla tomu hromada berserk?? a hlavn?? Tekele, kter?? zastavil Jouzoleana vzl??naj??c??ho do nebes. Nav??c se jednalo o nejrychlej???? mat turnaje. Kr??sn?? ??tok! Tekelovi i Bukowskicovi gratulujeme!<br><br>" +
        "<b>B??bul:</b> V tabulce do??lo po del???? dob?? k v??razn?? zm??n??, kdy?? Jouzolean vyst????dal Mr??zka na druh?? pozici. Souboj mezi Mr??zkem a Jouzoleanem je l??t?? a n??m ostatn??m je jen l??to, ??e se k nim n??jak nep??ibli??ujeme. Dr????me palce v dal????m boji!<br><br>" +
        "<b>B??bul:</b> B??l?? v kr??lovsk??m gambitu dnes stoprocentn??! Nech?? ??ady kr??lovsk??ch gambiter?? houstnou!<br><br>" +
        "<a href='http://localhost:63342/MondayFight/search.html?q=kingkong'><img src='img/achievements/kingkong.png' class='img100 left'></a> Mezi plaketky p??ibyl King Kong, kter??ho dostane ten hr????, kter?? zmatuje protivn??ka, ani?? by ztratil jak??koli materi??l a p??itom je??t?? postav?? d??mu. Prvn??m King Kongem v??bec byl <a href='https://lichess.org/@/dzin69'>Dzin69</a>, druh??m a sou??asn?? prvn??m leto??n??m je <a href='https://lichess.org/@/RychlyLenochod'>RychlyLenochod</a>. Partie lze vyhledat, klikn??te na obr??zek. Gratulujeme!"},
    {id: "3WyIj25r", html: "<img src='img/mf-og-x.jpg'><b>B??bul:</b> Jouzolean se t??m???? dot??hl na pauz??ruj??c??ho Bukowskice. ??koda, ??e ??ampi??n nehr??l, s <b>Nezn??mou-00</b> tradi??n?? prohr??v??, to u?? je takov?? na??e mil?? tradice. Tak p??????t??!<br><br>" +
         "<a href='actualities.html#zlataPraha/'><img src='img/zlataPraha5.jpg'></a><br><b>B??bul:</b> P??e??t??te si tekeleho report???? z turnaje Zlat?? Praha v rapid ??achu.<br><br>"},
    {id: "r18jTyCu",
      init: function() {
        let config = {
          pgn: "[Event \"Monday Fight Arena\"]\n" +
            "[Site \"https://lichess.org/JcoGVI1B\"]\n" +
            "[Date \"2022.09.12\"]\n" +
            "[White \"Margarita_Vlasenko\"]\n" +
            "[Black \"felcar\"]\n" +
            "[Result \"0-1\"]\n" +
            "\n" +
            "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nc3 e6 5. a3 a6 6. h3 c5 7. Nf3 Nc6 8. Be3 Nge7 9. dxc5 Bg6 10. Qd2 Nf5 11. O-O-O Be7 12. Bg5 O-O 13. Bxe7 Qxe7 14. g4 Nh4 15. Nxh4 Qxh4 16. Qe3 Rfd8 17. Qf4 Qe7 18. Ne2 Qxc5 19. Nc3 b5 20. Rd2 b4 21. Ne2 bxa3 22. bxa3 Qxa3+ 23. Kd1 Rab8 24. Rd3 Rb1+ 25. Nc1 Nb4 26. Rxa3 Bxc2+ 27. Kd2 Rb2 28. Kc3 Rb1 29. Ra2 Rc8+ 30. Kd2 Nxa2 31. Nxa2 Rb2 32. Nc3 Be4+ 33. Kc1 Rc2+ 34. Kd1 R8xc3 35. h4 Bxh1 36. Be2 Rc1+ 37. Qxc1 Rxc1+ 38. Kxc1 Kf8 39. Kb2 a5 40. Ka3 Ke7 41. Ka4 Kd7 42. Kxa5 Kc6 43. Kb4 f6 44. f4 Kb6 45. Bb5 Bf3 46. g5 fxg5 47. hxg5 h5 48. Bf1 h4 49. Kc3 Kc5 50. Kd3 Bg4 51. Bg2 h3 52. Bh1 Bf5+ 53. Ke3 Be4 54. Bxe4 dxe4 55. Kf2 Kd4 56. Kg3 Kd3 57. f5 exf5 58. e6 e3 59. e7 h2 60. Kxh2 f4 61. e8=Q e2 62. Qd7+ Ke3 63. Qe6+ Kf2 64. Qb6+ Kf1 65. Qb5 f3 66. Kg3 f2 67. Qd3 Kg1 68. Qxe2 f1=Q 69. Qxf1+ Kxf1 70. Kf4 Kg2 71. Kf5 Kg3 72. g6 Kh4 73. Ke6 Kg5 74. Kf7 Kh6 75. Kg8 Kxg6 76. Kh8 Kf6 77. Kh7 g5 78. Kh6 g4 79. Kh5 g3 80. Kh6 g2 81. Kh5 g1=Q 82. Kh4 Kf5 83. Kh3 Kf4 84. Kh4 Qg4# 0-1",
          showCoords: false, coordsInner: false, headers: true,
          theme: 'brown',
          boardSize: 290,
          movesHeight: 60,
          startPlay: '0'
        }
        PGNV.pgnView("board", config)
      },
      html: "<b>Felcar:</b> J?? ale dneska n??kolikr??t p??e??il svou smrt ???????? Moje partie s Margaritou,  to bylo n??co! Moc nechyb??lo,  vyhr??val jsem s n?? s d??mou m????, kterou jsem nechal jednotahov?? viset... <br><br>" +
        "<a href='https://lichess.org/JcoGVI1B#121'><img src='img/felcar-margarita.png' style='max-width:216px'></a><br><div id='board'></div><br><br>" +
        "<b>B??bul:</b> Kr??lovsk?? gambit dnes 5x stoprocentn??! ??e jen 4x? Jen??e Janisch??v gambit proti Bukowskicov?? ??pan??lsk?? je vlastn?? takov?? Kr??lovsk?? gambit za ??ern??ho s tempem na m????! :-) Nech?? ??ady kr??lovsk??ch gambiter?? houstnou!<br><br>" +
        "<b>Jouzolean:</b> Ur??it?? bych povzn??sl tv??j slovutn?? ??sp??ch... To byla j??zda teda... ??pln?? jinej bebul.. \"takovej mozkomorovej\" ????je??t?? ze jsem s tebou nehr??l!<br><br>" +
        "<b>B??bul:</b> Tabulka se ot????sla v z??kladech. Margarita p??esko??ila Lenochoda a Jouzole??n s Mr??zkem se p??ehoupli p??es na??eho ??ampi??na, kter?? narazil na toho ??pln?? jin??ho B??bula, jak pravil Jouzole??n. ???? A D??in69 se dot??hl na VikJava a, to u?? je skoro jist??, brzy se vm??s?? mezi dvan??ct apo??tol??, co si to na konci roku rozdaj v Play OFF. <br><br>" },
    {id: "sU060isO", html: "<img src='img/mf-og-x.jpg'><br><br><b>Bebul:</b> Bukowskic se znovu dot??hnul na ??elo tabulky. Se stejn??m sk??re je prvn??, proto??e m?? lep???? performance. Kdyby m??li ho??i i stejnou performance, tak to by se asi museli poprat. Bukowskicovo ELO v ringu je asi 3300 a pokud je n??m zn??mo, Jouzolean 1800????? <br><br>" +
        "<b>B??bul:</b> Margarita kr??sn?? p??ehr??la bukowskice, kter?? si dneska rozhodn?? 100% ??sp????nost nezaslou??il. Autor t??chto ????dk?? s n??m m??l tak kr??sn?? rozehranou partii, ??e u?? vyvaloval oslavn?? sudy, ale proti bukowskicovi, jak zn??mo, je to zaklet?? ???? <br><br>" },
    {id: "ogn3HeW1", html: "<b>Bebul:</b> V dramatick??m z??v??ru bojoval bukowskic o zlato proti mozkomorovi, ale n??poru b??l??ch figur na kr??lovsk??m k????dle podlehl. Mozkomor se ale dlouho na turnajov??m tr??nu neoh????l. Do konce turnaje zb??vala zhruba minuta, b??hem kter?? se p??es Pir??ta vyhoupla na ??elo Margarita a z??skala zaslou??en?? zlato! Gratulujeme!<br><br>" +
        "<img src='img/sherlock.jpg'><br><br>" +
        "<b>Bebul:</b> Bukowskic na WhatsApp uvedl v????e uvedenou detektivn?? z??pletku s t??m, ??e kdo ji prvn?? vylu??t??, vyslou???? si od n??j berserk. A tento jedin?? berserk dneska mo??n?? st??l bukowskice zlato! ???? To jsou ty z??sady!"},
    {id: "TNZCc8DD",
      init: function() {
        let config = {
          pgn: "[Event \"Monday fight Arena\"]\n" +
            "[Site \"https://lichess.org/6EPMyxSN\"]\n" +
            "[Date \"2022.10.24\"]\n" +
            "[White \"bukowskic\"]\n" +
            "[Black \"Mrazek\"]\n" +
            "[Result \"1-0\"]\n" +
            "\n" +
            "1. e4 b6 { B00 Owen Defense } 2. Be2 Bb7 3. Bf3 Nf6 4. e5 Nd5 5. c4 { Black resigns. } 1-0",
          showCoords: false, coordsInner: false, headers: true,
          theme: 'brown',
          boardSize: 290,
          movesHeight: 60,
          startPlay: '7'
        }
        PGNV.pgnView("board", config)
      },
      html: "<img src='img/mf-og-x.jpg'>" +
        "<br><br><b>B??bul:</b> Maurice Dodo z??ejm?? opisoval od Mr??zka a vyst??ihnul dneska ??pln?? stejn?? ??ty??tahov?? ??evcovsk?? mat jako minule on. Mo??n??, ??e Rychl?? Lenochod, znalec a milovn??k ??evcovsk??ch mat??, prost?? na ??evce ned?? dopustit i kdyby m??l padnout! B??bul se taky pokusil d??t ??evce, ale Nezn??m??-00 se nenechala nachytat, ??e si pak B??bulek tuze vy????tal, ??e s tou d??mou ??el tam honem, m??lem splakal nad talonem!<br><br>" +
        "<b>B??bul:</b> Bukowskic dneska p??ekvapil Mr??zka brilantn??m majstr??tykem, kdy?? zahr??l na jeho Owen defense podivn?? dva tahy b??lopoln??m st??elcem, aby si po??kal na p??irozen?? v??vinov?? tah jezdcem Nf6??, kter?? zde ov??em okam??it?? prohr??v?? partii. ??koda, ??e jsme takhle nikdo nepotrestali Roberta Cveka, kter?? na n??s Owena zkou??el.<br><br>" +
        "<div id='board'></div>"},
    {id: "omFEO2Vz",
      html: "<img src='img/mf-og-x.jpg'><b>B??bul:</b> Gratulujeme Nezn??m??-00 ke dv??ma p??kn??m v??hr??m!" +
        "<br><br><b>B??bul:</b> V dne??n??m turnaji se B??bulovi po dlouh??m ??ek??n?? poda??ilo vymodlit pozice, o kter??ch se do??etl ve vynikaj??c?? knize <b><i>Miniaturn?? ??achov?? partie</i></b> od Ladislava Alstera. Zde k nahl??dnut?? B??bul??v omalovan?? v??tisk." +
        "<img src='img/alster-drakula.jpg'> ...ani ??ada parti?? sehran??ch mezi Tekelem a Jouzole??nem na toto t??ma, probl??m nevyjasnila. " +
        "Alster o V??de??sk?? h??e p????e, ??e je to takov?? m??rumilovn?? a nep????li?? cti????dostiv?? zah??jen??. Pohled na n??zvy variant tomu ale jaksi proti??e????: Frankenstein-Drakula a nebo Monster declined. Dnes se tato <a href='https://lichess.org/iYpJn8pM#20'>monstrpozice</a> hr??la na Monday Fights poprv??." +
        "<br><br>" +
        "<b>B??bul:</b> Varianta, kterou r??di hraj?? Jouzolean a Mr??zek, m?? ????len?? n??zev: <b>??tok sma??en??ch jater</b>. " +
        "No a pr??v????e, kdo se nechce nechat usma??it, zkus?? Traxler??v proti??tok." +
        "<img src='img/alster-traxler.jpg'>" +
        "Jouzole??n plat?? za nejlep????ho znalce italsk?? hry a odvozen??ch zah??jen??. N???? B??bulek proti n??mu zvolil Traxlerovu variantu, co?? se rovnalo v??zv?? k souboji v teoretick??ch znalostech. <i>(Ladislav Alster o J.Estrinovi, nejsp???? <b>J.</b> jako Jouzole??n!)</i>" +
        "Partie by ud??lala panu Traxlerovi radost, ale jist?? ne tak velikou, jako B??bulovi, nebo?? nikomu jin??mu se letos je??t?? nepoda??ilo d??t Jouzole??novi <a href='https://lichess.org/N12QWVRE#20'>mat des??t??m tahem</a>. No... a v posledn?? partii se B??bulek trefil Traxlerem do Mr??zka a to V??m byl v??prask, <a href='https://lichess.org/JuvXrd12CgRj'>auvajs!</a>"},
    {id: "o1wwUBUk",
      html: "<img src='img/mf-og-x.jpg'>" +
        "<br><br><b>B??bul:</b> Z dne??n??ho turnaje si v??ichni odnesli aspo?? bod! Nezn??m??-00 se poda??il d??t par??dn?? Anastazia mat Baronu Gorcovi a LastScout porazil Hrobotrona sice na ??as v berserku, ale ve vyhran?? pozici. Ob??ma gratulujeme!" +
        "<br><br><b>B??bul:</b> BaronGorc se po por????ce od Nezn??m?? <img src='img/players/janshorny.gif' class='img100 right'> oklepal a odnesl si t??i b??je??n?? tu??n?? body, rovn???? velik?? gratulace!" +
        "<br><br><b>B??bul:</b> Margarita dlouho vedla a chyb??lo jen m??lo a v turnaji <img src='img/players/jouzolean.gif' class='img100 left'> zv??t??zila. Nakonec se v??ak radoval halloweensk?? ka??p??rek! Grats! " +
        "Jouzolean se tak po dvou kolech, kdy se s Mr??zkem ma??kali <img src='img/players/mrazek.gif' class='img100 right'> na turnajov?? druh?? p??????ce od halloweensk?? kost??i??ky lehce odrazil a sm??je se z druh??ho m??sta. Asi nechce hr??t v osmifin??le s Margaritou, co?? ch??peme. To by se b??l ka??dej! T??????me se na dal???? boj! <img src='img/players/margarita_vlasenko.gif' class='img100 left'>" +
        "<br><br><b>B??bul:</b> A Jouzolean sehr??l s Rychl??m Lenochodem 130 tahovou v??t??znou bitvu, co?? <img src='img/players/rychlylenochod.gif' class='img100 right'> je druh?? nejdel???? hra historie Monday Fight, pri??em?? nejdel???? v??t??zn??." +
        "<br><br><b>B??bul:</b> A ??e n???? B??bulek dal Blackburnovskej mat, kterej u?? ??pln?? zapomn??l, ??e existuje, toho jste si ur??it?? v??ichni v??imli. Zat??m jen Mozkomorovi a nyn?? B??bulkovi se to v historii Monday Fights poda??ilo. No, tak si t??eba z??vi??te, noo???????? <img src='img/players/bebul.gif' class='img100'> <img src='img/players/mozkomor.gif' class='img100'> "+
        "<br><br><b>B??bul:</b> A u?? jste se pod??vali, jak?? halloweensk?? avatary m?? Arytmik, Travinho, Mr??zek a Robert Cvek?"},
    {id: "T5fN7RNz", html: "<img src='img/mf-og-grats.jpg'>"},
    {id: "euUYBnmh", html: '<b>B??bul:</b>"Napsat b??se?? o Monday Fight, t??ebas by si v????mala jen jedin??ho hr????e, ' +
        "t??eba by si v????mala jen nejnepatrn??j????ho ??lov??ka, " +
        "by znamenalo slou??it v??echny hrdinsk?? zp??vy v jedinou epopej, " +
        "svrchovanou a kone??nou. Monday Fight je chaos p??elud??, choutek " +
        "a poku??en??, je to tav??c?? pec sn??, brloh my??lenek, za n???? se styd??me; " +
        "je to zmaten?? sm??sice klamn??ch z??v??r??, je to bitevn?? pole v????n??. " +
        "Pronikn??te v pond??ln??ch hodin??ch zsinalou tv?????? ??lov??ka, kter?? p??em??t??, " +
        "pod??vejte se za ni, pohle??te do t?? du??e, pod??vejte se do t?? " +
        "temnoty. Pod zevn??m klidem jsou bitvy obr?? jako u DJ-P????ce, jsou " +
        "tam shluky drak?? a hyder a mra??na p??elud?? jako u Bukowskice, jsou " +
        "tam vizion????sk?? p????zraky jako u Jouzole??na. Jak stra??liv?? je nekone??no, " +
        "kter?? ??lov??k nos?? v sob?? a podle n??ho?? zoufale m?????? v??li sv??ho " +
        'mozku a skutky sv??ho ??ivota!" <i><b>Viktor Hugo: B??dn??ci</b>, kapitola Sv??dom??</i>'},
    {id: "6xgyatei",
      html: "<img src='img/mf-og-margarita.jpg'>" +
        "<br><br><b>B??bul:</b> Margarita dneska sice nejprve podlehla Jouzole??novi, ale pak mu to hezky vr??tila a nakonec z??skala kov nejcenn??j????! Velik?? gratulace!" +
        "<br><br><b>Jouzolean:</b> Jenom??e te?? ale vede jouzolean - a je to jeho jedin?? ??ance jak poprv?? a naposledy vyhr??t sez??nu MF. <img src='img/players/jouzolean.png' class='img100 right'> Ud??l?? v??e pro to aby vyhr??l ???? " +
        "<br><br><b>Jouzolean:</b> Bukowskic je??t?? jednou nep??ijde a je ve v????n??ch probl??mech! ???? Tento rok je to hodn?? dramatick??! ??ance m?? i Mrazek!" +
        "<br><br><b>B??bul:</b> V tabulce doch??z?? k vachrlat??m posun??m. Posun Jouzole??na na prvn?? m??sto m??sto Bukowskice tak?? znamen??, <img src='img/players/bukowskic.png' class='img100 left'> ??e se Bukowskic ocit?? ve stejn?? osmifin??lov?? skupin?? pro PlayOFF jako DJ-Pesec. Ten v??ak m????e snadno p??rkr??t na Monday Fight p??ij??t a podle pot??eby se posunout p??ed PIRAT77 a zajistit si tak pozici ze druh?? strany vy??azovac??ho pavouka, tak??e by se s Bukowskicem mohl p????padn?? potkat a?? ve fin??le!" +
        "<br><br><b>B??bul:</b> V??t??me nov??ho hr????e <a href='https://lichess.org/@/HonzaHonzaHonza'>HonzaHonzaHonza</a>. Jeho vstup do Monday Fights ar??ny byl spr??vn?? nerv??zn?? a po ????????e ??esti proher to u?? vypadalo, ??e ho maminka doma nepochv??l??.  <img src='img/players/honzahonzahonza.png' class='img100 right'> Dok??zal se v??ak oklepat jak m??lokdo a p??in??st dom?? p??r skalp??. Na??eho Jouzole??na by takov?? pohroma st??la minim??ln?? display mobilu." +
        "<br><br><b>Lichess:</b> API encountered an error: <a href='https://github.com/lichess-org/lila/issues/11971#event-7931043421'>Cannot download tournaments</a>. It takes about 10 days to find a temporary workaround." +
        "<img src='img/api-error.jpg'>"},
    {id: "playOFF2021",
      playOFF: "<img src='img/turnajPavouk2021.jpg' style='width:100%;margin-top: 5px'>",
      html: "<h1>PlayOFF 2021</h1>" +
        "<b>Jouzolean:</b> Tak a je dobojov??no! <a href='archiv2021.html'>Sez??na 2021</a> je s dne??n??m turnajem definitivn?? odp??sk??na. Tato ji?? legend??rn?? skupina hr?????? se dok??zala sch??zet v men????m ??i v??t????m po??tu cel?? rok a ani jednou se nestalo, ??e by se nehr??lo - a to ani tehdy, kdy?? jednou selhal lichess. To m??me 52 kvalitn??ch turn??j?? v roce. N???? seznam hr?????? ji?? ????t?? 26 jmen v??etn?? jedn?? holky a v??ichni se zn??me." +
        "<br><br><b>DJ-Pesec:</b> A do tohoto vy??azovac??ho PlayOFF turnaje V??m p??edstavujeme epesn?? vyzyvatelsk?? karti??ky! <img src='img/epesni-karticka4.jpg' style='margin-top:5px'>" +
        "<br><br><img src='img/players/bukowskic.png' class='img100 right'><b>Bebul:</b> Velk?? gratulace Bukowskicovi, ??e p??es po????te??n?? dvojn??sobn?? v??prask od Rychl??ho Lenochoda dok??zal krom?? celkov??ho turnaje ovl??dnout i z??v??re??n?? PlayOFF!"},
    {id: "EvpGRc5W",
      html: "<h2>Bl?????? se PlayOFF 2022</h2>" +
        "??derem 26.prosince se zavr???? sez??na leto??n??ho Monday Fights. Prvn??ch dvan??ct borc?? pak zveme na vy??azovac?? turnaj PlayOFF. " +
        "Hry z lo??sk??ho PlayOFF turnaje byly p??evedeny na tento web a lze je vid??t po kliknut?? na obr??zek <a href='index.html?mf=playOFF2021'><img src='img/epesni-karticka.jpg' style='margin:5px 0'></a>" +
        "Ov??em prvn?? PlayOFF se hr??l v roce 2020. Po odehran??ch parti??ch je popt??vka. Bylo by p??kn??, kdyby tyto partie byly na tomto webu k dohled??n??. Pos??lejte."
    }

  ]
  let s = spec.find(s => s.id === tournamentId)
  if (s) {
    document.getElementById(divId).innerHTML = s.html
    if (s.playOFF) document.getElementById(divId + '-play-off').innerHTML = s.playOFF
    else document.getElementById(divId + '-play-off').innerHTML = ""
    if (s.init) s.init()
  }
  else {
    document.getElementById(divId).innerHTML = ""
    document.getElementById(divId + '-play-off').innerHTML = ""
  }
}

export function updateTournamentHtmlAuto(divId, tournamentId, data) {
  let fight = data.findTournament(tournamentId)
  let borec = fight.standing.players.reduce(function(current, player) {
    if (current) {
      if (player.performance - player.rating > current.performance - current.rating &&
        player.points && player.points[0] >= 2 && player.points[0]+player.points[1] >= 4) return player
      else return current
    } else if (player.points && player.points[0] >= 2 && player.points[0]+player.points[1] >= 4) return player
    else return null
  }, null)
  let borecAvg = fight.standing.players.reduce(function(current, player) {
    if (current) {
      if (player.avgOponent > current.avgOponent &&
        player.points[0]+player.points[1] >= 4) return player
      else return current
    } else if (player.points[0]+player.points[1] >= 4) return player
    else return null
  }, null)
  document.getElementById(divId).innerHTML = `<span class="player-blue"><b>${borec.name}</b></span> zahr??l o ${borec.performance - borec.rating} l??pe, ne?? odpov??d?? jeho ratingu. Gratulujeme!
     <span class="player-blue"><b>${borecAvg.name}</b></span> ??elil nejt????????m soupe????m s ratingem ${borecAvg.avgOponent} v pr??m??ru.
     `
}

async function drawSpider(dataOfPlayers, spiderId) {
  let GLOB = {
    width: 1190, height: 670,
    padX: 20, padTop: 60, padBottom: 20,
    centerWidth: 150,
    fontSize: 45,
    conex: 90
  }
  GLOB.netH = GLOB.height - GLOB.padTop - GLOB.padBottom
  GLOB.picH = 0.9 * GLOB.netH / 6

  let canvas = document.getElementById(spiderId)
  let ctx = canvas.getContext("2d")

  Promise.all([
    document.fonts.load("18px 'Bahnshrift Light'"),
    document.fonts.load("18px 'FjallaOne'")
  ]).then(function() {
    let img = new Image()
    img.onload = function () {
      ctx.drawImage(img, 0, 0)

      let topLine = GLOB.padTop
      ctx.font = `${1.3 * GLOB.fontSize}px FjallaOne`
      let text = "MONDAY FIGHT ARENA"
      let textInfo = ctx.measureText(text)
      let textX = 0.5 * GLOB.width - textInfo.width / 2
      ctx.fillText(text, textX, topLine + 10)

      let fs2 = 1.3 * GLOB.fontSize * 25 / 45
      ctx.font = `${fs2}px FjallaOne`
      let text2 = "TURNAJ ??AMPION?? 2022"
      let textInfo2 = ctx.measureText(text2)
      ctx.fillStyle = "red";
      //ctx.fillText(text2,  textX + textInfo.width - textInfo2.width, topLine + 1.2 * fs2 )
      ctx.fillText(text2, 0.5 * GLOB.width - textInfo2.width / 2, topLine + 1.2 * fs2 + 20)

      let fs3 = GLOB.fontSize * 13 / 45
      let fs4 = GLOB.fontSize * 20 / 45
      ctx.fillStyle = "#888";
      ctx.font = `condensed ${fs3}px Bahnshrift Light`
      let nums = [1, 8, 9, 4, 5, 12, 2, 7, 10, 3, 6, 11]

      function trLeft(x) {
        return x + GLOB.padX
      }

      function trRight(x) {
        return GLOB.width - x - GLOB.padX
      }

      function alignLeft(trans, x) {
        return trans(x)
      }

      function alignRight(trans, x, text) {
        let width = ctx.measureText(text).width
        return trans(x) - width
      }

      function drawNet(trans, right) {
        let img = new Image();
        img.onload = function () {
          // 60*121 i.e. 1:2
          ctx.drawImage(img, (GLOB.width - GLOB.centerWidth) / 2, 250, GLOB.centerWidth, 2 * GLOB.centerWidth)
        }
        img.src = "img/players/logo-kral.png"

        let x = trans(0)
        for (let i = 1; i <= 6; i++) {
          let y = GLOB.padTop + i * GLOB.netH / 6
          ctx.moveTo(x, y);
          let len = (GLOB.width - GLOB.centerWidth) / 2 - 2 * GLOB.conex
          if (i % 3 !== 1) len -= GLOB.conex
          ctx.lineTo(trans(len), y)

          // texts
          let no = nums.shift()
          let txNo = `${no}.`
          ctx.fillStyle = "#888";
          ctx.font = `condensed ${fs3}px Bahnshrift Light`
          let alx = right ? alignRight(trans, 0, txNo) : alignLeft(trans, 0)
          ctx.fillText(txNo, alx, y + 1.2 * fs3)
          ctx.fillStyle = "black";
          ctx.font = `condensed ${fs4}px Bahnshrift Light`
          let name = dataOfPlayers[no - 1].name
          if (i % 3 === 2) {
            alx = right ? alignLeft(trans, len, name) : alignRight(trans, len, name)
            ctx.fillText(name, alx, y - 0.3 * fs4)
            // avatar
            let avatar = Avatars.getAvatar(name, "img/achievements/kun.png")
            if (avatar) {
              let img = new Image();
              img.onload = function () {
                let aspect = img.width / img.height
                let imgX = right ? 0 : aspect * GLOB.picH
                ctx.drawImage(img, trans(imgX) - aspect * GLOB.picH, y - GLOB.picH - 1, aspect * GLOB.picH, GLOB.picH)
              }
              img.src = avatar
            }
          } else {
            alx = right ? alignRight(trans, 0, name) : alignLeft(trans, 0, name)
            ctx.fillText(name, alx, y - 0.3 * fs4)
            // avatar
            let avatar = Avatars.getAvatar(name, "img/achievements/strelec.png")
            if (avatar) {
              let img = new Image();
              img.onload = function () {
                let aspect = img.width / img.height
                let imgX = right ? aspect * GLOB.picH : 0
                ctx.drawImage(img, trans(imgX + len - aspect * GLOB.picH - 1), y - GLOB.picH - 1, aspect * GLOB.picH, GLOB.picH)
              }
              img.src = avatar
            }
          }

          if (i % 3 === 2) {
            ctx.lineTo(trans(len), y + GLOB.netH / 6)
            ctx.moveTo(trans(len), y + GLOB.netH / 12)
            ctx.lineTo(trans(len + GLOB.conex), y + GLOB.netH / 12)
          }
          if (i % 3 === 1) {
            ctx.lineTo(trans(len), y + GLOB.netH / 4)
            ctx.moveTo(trans(len), y + GLOB.netH / 8)
            ctx.lineTo(trans(len + GLOB.conex), y + GLOB.netH / 8)
            if (i === 1) {
              ctx.lineTo(trans(len + GLOB.conex), y + GLOB.netH / 8 + GLOB.netH / 2)
              ctx.moveTo(trans(len + GLOB.conex), y + GLOB.netH / 8 + GLOB.netH / 4)
              ctx.lineTo(trans(len + 1.75 * GLOB.conex), y + GLOB.netH / 8 + GLOB.netH / 4)
            }
          }
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.strokeStyle = "black";
      drawNet(trLeft, false)
      drawNet(trRight, true)
    }
    img.src = "img/players/background.jpg"
  })
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 ![https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details](https://bebul.github.io/MondayFight/img/elo.png)
*/
function playerOddsByELO(players) {
  let [rA, rB] = players.map(pl => pl.data.perfs.blitz.rating)
  let qA = Math.pow(10, rA / 400)
  let qB = Math.pow(10, rB / 400)
  let eA = qA / (qA + qB)
  let eB = qB / (qA + qB)
  return [eA, eB]
}
function playerOddsByHistory(players) {
  let cross = players[0].crossData.pl0 + players[0].crossData.pl1
  let nums = cross.split('-').map(n => Number.parseInt(n))
  if (nums.length < 2) nums = [0,0]
  let denom = nums[0] + nums[1] || 1
  return {
    count: nums[0] + nums[1],
    odds: [nums[0] / denom , nums[1] / denom]
  }
}
function playerOdds(players, f) {
  let factor = f || 0.5
  let byELO = playerOddsByELO(players)
  let {count: count, odds: byHistory} = playerOddsByHistory(players)
  if (count < 10) factor += (1 - factor) * (9 - count) / 9
  let odds = []
  console.log(`factor:${factor}`)
  for (let i=0; i<2; i++) {
    odds[i] = factor * byELO[i] + (1-factor) * byHistory[i]
  }
  return odds
}

export async function drawEpicCard(dataOfPlayers, crossData, title, cardId) {
  if (!Array.isArray(crossData) || crossData.length != 2) return;

  let GLOB = {
    width: 400, height: 600,
    padTop: 180, fontSize: 45, picH: 65
  }

  let canvas = document.getElementById(cardId)
  let ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // find players in the dataOfPlayers to know their order
  let pl = crossData.map(p => {
      let ret = dataOfPlayers.find(pl => pl.name.toLowerCase() === p.name.toLowerCase())
      ret['crossData'] = p
      return ret
  })
  if (pl.length !== 2) return;
  let titans = pl.sort((a,b) => a.rank - b.rank)
  titans.forEach(p => p.avatar = Avatars.getAvatar(p.name))

  Promise.all([
    downloadUserDataIntoLeague(dataOfPlayers),
    document.fonts.load("18px 'BankGothicCondensed'"),
    document.fonts.load("18px 'BankGothic'"),
  ])
    .then(function() {
    let img = new Image()
    img.onload = function () {
      ctx.drawImage(img, 0, 0)

      ctx.fillStyle = "orange";
      let topLine = GLOB.padTop
      ctx.font = `${0.3 * GLOB.fontSize}px BankGothicCondensed`
      let text = title
      let textInfo = ctx.measureText(text)
      let textX = 0.5 * GLOB.width - textInfo.width / 2
      ctx.fillText(text, textX, topLine + 10)

      ctx.font = `22px BankGothicCondensed`
      let vsText = "Vs."
      let vsInfo = ctx.measureText(vsText)
      let vsX = 0.5 * GLOB.width - vsInfo.width / 2
      ctx.fillText(vsText, vsX, 212 + 30)

      for (let ix=0; ix<2; ix++) {
        // avatar
        let avatar = Avatars.getAvatar(titans[ix].name, "img/players/jouzolean.gif")
        if (avatar) {
          let img = new Image();
          img.onload = function () {
            let aspect = img.width / img.height
            let picW = aspect * GLOB.picH
            let imgX = (ix > 0) ? GLOB.width - 180 + (180 - picW)/2 : (180 - picW)/2
            ctx.drawImage(img, imgX, 174 - GLOB.picH, picW, GLOB.picH)
          }
          img.src = avatar
        }

        ctx.fillStyle = "#eee";
        let topLine = 212 + 40 * ix
        ctx.font = `22px BankGothic`
        let prettyName = capitalizeFirstLetter(titans[ix].name)
        let textInfo = ctx.measureText(prettyName)
        let textX = 0.5 * GLOB.width - textInfo.width / 2
        ctx.fillText(prettyName, textX, topLine + 10)
      }

      function percents(x) {
        return `${Math.round(x * 1000) / 10} %`
      }

      function fastMate(ply) {
        if (!ply) return ""
        return `${Math.floor((ply + 1) / 2)}. tahem`
      }

      let lines = [
        {c:'Nasazen??', f: ix => titans[ix].rank, font: '15px BankGothic'},
        {c:'Lichess elo', f: ix => titans[ix].data.perfs.blitz.rating, font: '15px BankGothic'},
        {c:'Vz??jemn?? bilance', f: ix => titans[ix].crossData.pl0 + titans[ix].crossData.pl1, font: '15px BankGothic'},
        {c:'Dal mat druh??mu', f: ix => fastMate(titans[ix].crossData.fastMate), font: '15px BankGothic'},
        {c:'Celkov?? bilance', f: ix =>  titans[ix].crossData.score, font: '14px BankGothic'},
        {c:'Typick?? zah??jen??', f: ix => titans[ix].crossData.opening.name, font: '13px BankGothicCondensed'},
        {c:'??ance na v??hru', f: ix => percents(playerOdds(titans)[ix]), font: '15px BankGothic'}
      ];

      function drawLine(n, lines, top, sz) {
        let line = lines[n]
        let h = (GLOB.height - top) / lines.length
        let hoff = h/2 - sz/2
        ctx.fillStyle = "#fff";
        let topLine = top + n * h + hoff
        ctx.font = `${sz}px BankGothic`
        let textInfo = ctx.measureText(line.c)
        let textX = 0.5 * GLOB.width - textInfo.width / 2
        ctx.fillText(line.c, textX, topLine + 10)

        ctx.fillStyle = "#EFB400";
        ctx.font = line.font || `${0.65 * sz}px BankGothicCondensed`

        let leftText = line.f(0)
        let leftX = 10
        ctx.fillText(leftText, leftX, topLine + 10)

        let rightText = line.f(1)
        let rightInfo = ctx.measureText(rightText)
        ctx.fillText(rightText, GLOB.width - leftX - rightInfo.width, topLine + 10)
      }

      for (let i=0; i<lines.length; i++) {
        drawLine(i, lines, 284, 17)
      }

      ctx.strokeStyle = "black";
    }
    img.src = "img/epicBackground.png"
  })
}
