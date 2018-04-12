var config = {
    apiKey: "AIzaSyC7k2lN9Ym4RJXEEbjFBHcMbTWKyMhBwoQ",
    authDomain: "rps-multi-e9c18.firebaseapp.com",
    databaseURL: "https://rps-multi-e9c18.firebaseio.com",
    projectId: "rps-multi-e9c18",
    storageBucket: "rps-multi-e9c18.appspot.com",
    messagingSenderId: "24661877802"
  };

  firebase.initializeApp(config)

var db = firebase.database()

var dbConnection = db.ref('.info/connected')
var dbPlayers  = db.ref('/players')
var dbChat  = db.ref('/chat')

var connection
var userKey
var userRef
var username
var opponent
var chatbox
var testingCount = 0
var choices = ['rock', 'paper', 'scissors']
var battleArray = []
var playerCount = []
var hasUserChosen = false;

$(document).ready(function() {

// listens to when child is added and assigns this user's content in the correct panels
dbPlayers.on("child_added", function(snapshot) {

  var matchInfo = snapshot.val()

  if (matchInfo.userKey === userKey) {

    var bucket = $('<div>')
    bucket.text('Player: '+ matchInfo.username)
    $('#player-one').attr("userKey", matchInfo.userKey)

    //prints weapon choices for user to select
    for (var i = 0; i < choices.length; i++) {
      var option = $('<div>')
      option.text(choices[i])
      option.addClass('weapon')
      option.attr('id', choices[i])
      $('#player-one').append(option)
    }
  }

  //pushes other user into the right-most container
  else {
    var bucket = $('<div>');
    bucket.text(matchInfo.username);
    opponent = matchInfo.username
    $('#player-two').attr("userKey", matchInfo.userKey)
    $('#player-two').append(bucket)
  }
});

//gives directions for user to navigate the game
$('#turn-sign').html('<p> Enter your username above and click Start!')

//sets up game with user stats to begin game against opponent when they're ready
$("#start").on("click", function() {
  event.preventDefault()

  username = $("#username").val().trim();
  $("#username").val('')

  $('#turn-sign').html('<p> Now choose your weapon and wait for your opponent to select theirs!')

  dbConnection.on("value", function(snapshot) {

    if (snapshot.val()) {
      userKey = dbPlayers.push().key
      connection = dbPlayers.push({
        username: username,
        wins: 0,
        losses: 0,
        weapon:'ready',
        userKey: userKey,
      })

      userRef = connection.key
      connection.onDisconnect().remove()
    }
  })
})

//checks whether a selection has been made, if not, then player chooses a weapon and then options are hidden
$(document).on("click", ".weapon", function() {

  if (hasUserChosen === false) {
    hasUserChosen = true
    
    if ($(this).attr('id') === 'rock') {
      var dbRef = db.ref('/players' + '/'+ userRef)
      dbRef.update({weapon: 'rock'})
    }

    else if ($(this).attr('id') === 'paper') {
      var dbRef = db.ref('/players' + '/'+ userRef)
      dbRef.update({weapon: 'paper'})
    }

    else if ($(this).attr('id') === 'scissors') {
      var dbRef = db.ref('/players' + '/'+ userRef)
      dbRef.update({weapon: 'scissors'})
    }

    $(".weapon").hide()
  }
})

//sets up array for comparison of player cjhoices
dbPlayers.on("child_changed", function(snapshot) {

  var added = snapshot.val()

  battleArray.push({
    userKey: added.userKey,
    weapon: added.weapon
  })

  if (battleArray.length === 2) {
  battleCommence()
  }

  //function that enables the battle array to have selections compared for players to see
  function battleCommence() {
    
    var battlerOne = battleArray[0].userKey
    var battlerWeaponOne = battleArray[0].weapon

    var battlerTwo = battleArray[1].userKey
    var battlerWeaponTwo = battleArray[1].weapon

    battleArray.length = 0

    //adds another layer of contextual information for user
    $('#turn-sign').html('<p> See the results of your battle below!')

    var result = gameResult(battlerWeaponOne, battlerWeaponTwo)

      if (result === 'tie') {
        $("#battle-space").html('<p>You chose ' + battlerWeaponOne + ' as your weapon</p>')
        $("#battle-space").append('<p>' + opponent + ' chose ' + battlerWeaponTwo + 'as their weapon</p>')
        $("#battle-space").append('<p> Tie game! </p>')
        setTimeout(gameStart, 5000) //resets elements of the game on a timer
      }

      else if (result === 'win') {
        $("#battle-space").html('<p>You chose ' + battlerWeaponOne + ' as your weapon</p>')
        $("#battle-space").append('<p>' + opponent + ' chose ' + battlerWeaponTwo + ' as their weapon </p>')
        $("#battle-space").append('<p> The victor is ' + username + '</p>')
        youWin()
        setTimeout(gameStart, 5000)
      }

      else if (result === 'lose') {
        $("#battle-space").html('<p>You chose ' + battlerWeaponOne + ' as your weapon</p>')
        $("#battle-space").append('<p>' + opponent + ' chose ' + battlerWeaponTwo + ' as their weapon</p>')
        $("#battle-space").append('<p> The victor is ' + opponent + '</p>')
        youLose()
        setTimeout(gameStart, 5000)
      }

      printResult()
    }

  //function that prints results of game to container below the battle section
  function printResult() {
    var dbScoreW = snapshot.val().wins
    var dbScoreL = snapshot.val().losses

    $('#game-stats').html('<p> Your wins: ' + dbScoreW + '<br> Your Losses: ' + dbScoreL + '</p>')
  }

  //function to handle the wins push to the db
  function youWin() {
    var youWon = snapshot.val().wins
    console.log(youWon)
    var newScoreW = youWon + 1
    var dbRef = db.ref('/players' + '/'+ userRef)
    dbRef.update({wins: newScoreW})
  }

  //function to handle the losses push to the db
  function youLose () {
    var youLose = snapshot.val().losses
    console.log(youLose)
    var newScoreL = youLose + 1
    var dbRef = db.ref('/players' + '/'+ userRef)
    dbRef.update({losses: newScoreL})
  }
})

//function that does the comparison of choices between both players
function gameResult(battlerOne, battlerTwo) {

  if (battlerOne === battlerTwo)
    return 'tie'

  else if (((battlerOne === 'rock') && (battlerTwo === 'scissors')) || 
     ((battlerOne === 'paper') && (battlerTwo === 'rock')) || 
     ((battlerOne === 'scissors') && (battlerTwo === 'paper'))) {
    return 'win'
  }

  else {
    return 'lose'
  }
}

//function that starts over elements of the game for each subsequent round
function gameStart() {
  hasUserChosen = false
  var dbRef = db.ref('/players' + '/'+ userRef)
  dbRef.update({weapon: 'ready'})
  $("#battle-space").html('')
  $('#turn-sign').html('<p> Now choose your weapon and wait for your opponent to select theirs!')
  $('.weapon').show()
}

//listens for users to publish written messages that can be shared with each other
$('#send-message').on('click', function() {
  event.preventDefault()
  var message = $('#message').val().trim()
  if (message !== '') {
    chatbox = dbChat.push({
      message: message,
      user: username,
    })
    $('#message').val('')
  }
  return false
})

//appends information submitted to the chat box
dbChat.on('child_added', function(childSnapshot, prevChildSnapshot) {
  var user = childSnapshot.val().user
  var message = childSnapshot.val().message
  $('#chat-box').prepend('<p>' + user + ': ' + message + '</p>')
})

//listens for whether a player has left the game and resets the chatbox
dbPlayers.on('child_removed', function(snapshot) {
  dbChat.remove()
  connection.onDisconnect().remove()
  $('#chat-box').html('')
})
})
