import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './spyfall.html';

Handlebars.registerHelper('toCapitalCase', function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function initUserLanguage() {
  var language = amplify.store("language");

  setUserLanguage("en");
}

function search() {
  var rapid = new RapidAPI("default-application_5bdde751e4b09efa5fbce1ee", "ff93aca2-e8ed-4dd7-9f55-381052e08581");

  rapid.call('YelpAPI', 'getBusinesses', {
    'term': 'restaurants',
    'openAt': '2018-11-03 11:00:00',
    'accessToken': 'ZlLMH73HGfMLVVDV7u1_zkFVt5R5OaYzRmI50a5OZFRsZ9j119VY5wS5zA5bEarfroW9IsSplbf_3M0bS6ujGTO-20sMaDim4VVEym4aKqYNuJzURIt_laqBi-bdW3Yx',
    'radius': '25000',
    'price': '2',
    'coordinate': '37.870803699999996, -122.2510809',
    'limit': '10',
    'categories': 'chinese',
    'sortBy': 'best_match'

  }).on('success', function (payload) {
   /*YOUR CODE GOES HERE*/
   var output = document.getElementById("out");
   output.innerHTML = "<p>Success</p>";
  }).on('error', function (payload) {
   /*YOUR CODE GOES HERE*/
   var output = document.getElementById("out");
   output.innerHTML = "<p>Failure</p>";
  });
}

function search2() {
  var myurl = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?accessToken=ZlLMH73HGfMLVVDV7u1_zkFVt5R5OaYzRmI50a5OZFRsZ9j119VY5wS5zA5bEarfroW9IsSplbf_3M0bS6ujGTO-20sMaDim4VVEym4aKqYNuJzURIt_laqBi-bdW3Yx&term=restaurants&latitude=37.870803699999996&longitude=-122.2510809&radius=25000&price=2&limit=10&categories=italian&sortBy=best_match";

         $.ajax({
            url: myurl,
            headers: {
             'Authorization':'Bearer ZlLMH73HGfMLVVDV7u1_zkFVt5R5OaYzRmI50a5OZFRsZ9j119VY5wS5zA5bEarfroW9IsSplbf_3M0bS6ujGTO-20sMaDim4VVEym4aKqYNuJzURIt_laqBi-bdW3Yx',
         },
            method: 'GET',
            dataType: 'json',
            success: function(data){
                console.log('success: '+data);
            }
         });
}

function getCurrentGame(){
  var gameID = Session.get("gameID");

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function geoFindMe() {
  console.log("geoFindMe run")
  var output = document.getElementById("out");

  if (!navigator.geolocation){
    output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;
    console.log("success");
    console.log(latitude);
    console.log(longitude);

    output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';
  }

  function error() {
    console.console.log("error");
    output.innerHTML = "Unable to retrieve your location";
  }

  output.innerHTML = "<p>Locating…</p>";

  navigator.geolocation.getCurrentPosition(success, error);
}

function getAccessLink(){
  var game = getCurrentGame();

  if (!game){
    return;
  }

  return Meteor.settings.public.url + game.accessCode + "/";
}


function getCurrentPlayer(){
  var playerID = Session.get("playerID");

  if (playerID) {
    return Players.findOne(playerID);
  }
}

function generateAccessCode(){
  var code = "";
  var possible = "afghijkloqrsuwxy23456789";

    for(var i=0; i < 6; i++){
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
}

function generateNewGame(locationOption, roundMinutes){
  var game = {
    accessCode: generateAccessCode(),
    state: "waitingForPlayers",
    location: null,
    lengthInMinutes: roundMinutes || 8,
    endTime: null,
    paused: false,
    pausedTime: null,
    locationOption: locationOption
  };

  var gameID = Games.insert(game);
  game = Games.findOne(gameID);

  return game;
}

function generateNewPlayer(game, name){
  var player = {
    gameID: game._id,
    name: name,
    role: null,
    isSpy: false,
    isFirstPlayer: false
  };

  var playerID = Players.insert(player);

  return Players.findOne(playerID);
}

function resetUserState(){
  var player = getCurrentPlayer();

  if (player){
    Players.remove(player._id);
  }

  Session.set("gameID", null);
  Session.set("playerID", null);
}

function trackGameState () {
  var gameID = Session.get("gameID");
  var playerID = Session.get("playerID");

  if (!gameID || !playerID){
    return;
  }

  var game = Games.findOne(gameID);
  var player = Players.findOne(playerID);

  if (!game || !player){
    Session.set("gameID", null);
    Session.set("playerID", null);
    Session.set("currentView", "startMenu");
    return;
  }

  if(game.state === "inProgress"){
    Session.set("currentView", "gameView");
  } else if (game.state === "waitingForPlayers") {
    Session.set("currentView", "lobby");
  }
}

function leaveGame () {
  GAnalytics.event("game-actions", "gameleave");
  var player = getCurrentPlayer();

  Session.set("currentView", "startMenu");
  Players.remove(player._id);

  Session.set("playerID", null);
}

function hasHistoryApi () {
  return !!(window.history && window.history.pushState);
}


Meteor.setInterval(function () {
  Session.set('time', new Date());
}, 1000);

if (hasHistoryApi()){
  function trackUrlState () {
    var accessCode = null;
    var game = getCurrentGame();
    if (game){
      accessCode = game.accessCode;
    } else {
      accessCode = Session.get('urlAccessCode');
    }

    var currentURL = '/';
    if (accessCode){
      currentURL += accessCode+'/';
    }
    window.history.pushState(null, null, currentURL);
  }
  Tracker.autorun(trackUrlState);
}
Tracker.autorun(trackGameState);

window.onbeforeunload = resetUserState;
window.onpagehide = resetUserState;

FlashMessages.configure({
  autoHide: true,
  autoScroll: false
});

Template.main.rendered = function() {
  $.getScript("//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", function() {
    var ads, adsbygoogle;
    ads = '<ins class="adsbygoogle" style="display:block;" data-ad-client="ca-pub-3450817379541922" data-ad-slot="4101511012" data-ad-format="auto"></ins>';
    $('.adspace').html(ads);
    return (adsbygoogle = window.adsbygoogle || []).push({});
  });
};

Template.main.helpers({
  whichView: function() {
    return Session.get('currentView');
  },
});


Template.startMenu.events({
  'click #btn-new-game': function () {
    console.log("new game");
    Session.set("currentView", "createGame");

  },
  'click #btn-join-game': function () {
    Session.set("currentView", "joinGame");
  },

  'click #btn-location': function () {
    console.log("btn-location");
    geoFindMe();
  },

  'click #btn-yelp': function () {
    search2();
  }
});

Template.startMenu.helpers({
  announcement: function() {
    return Meteor.settings.public.announcement;
  },
  alternativeURL: function() {
    return Meteor.settings.public.alternative;
  }
});

/*Template.startMenu.rendered = function () {
  GAnalytics.pageview("/");

  resetUserState();
}; */

Template.createGame.events({
  'submit #create-game': function (event) {
    GAnalytics.event("game-actions", "newgame");

    var playerName = event.target.playerName.value;

    if (!playerName || Session.get('loading')) {
      return false;
    }

    var game = generateNewGame("", event.target.roundMinutes.value);
    var player = generateNewPlayer(game, playerName);

    Meteor.subscribe('games', game.accessCode);

    Session.set("loading", true);

    Meteor.subscribe('players', game._id, function onReady(){
      Session.set("loading", false);

      Session.set("gameID", game._id);
      Session.set("playerID", player._id);
      Session.set("currentView", "lobby");
    });

    return false;
  },
  'click .btn-back': function () {
    console.log("back");
    Session.set("currentView", "startMenu");
    return false;
  },
  'click .btn-loc': function () {
    console.log("log");
    geoFindMe();
  },
  'click .btn-sugg': function () {
    console.log("sugg");
    Session.set("currentView", "Suggestions");
    return false;
  }
});

Template.createGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  }
});

Template.createGame.rendered = function (event) {
  $("#player-name").focus();
};

Template.Suggestions.events({
  'click .toPrice': function () {
    console.log("price");
    Session.set("currentView", "price");
    return false;
  }
})

Template.price.events({
  'click .toLikes': function () {
    console.log("likes");
    Session.set("currentView", "Likes");
    return false;
  }
})

Template.Likes.events({
  'click .toDislike': function () {
    console.log("likes");
    Session.set("currentView", "Dislike");
    return false;
  }
})

Template.Dislike.events({
  'click .toFinish': function () {
    console.log("dislikes");
    Session.set("currentView", "Finish");
    return false;
  }
})

Template.joinGame.events({
  'submit #join-game': function (event) {
    GAnalytics.event("game-actions", "gamejoin");

    var accessCode = event.target.accessCode.value;
    var playerName = event.target.playerName.value;

    if (!playerName || Session.get('loading')) {
      return false;
    }

    accessCode = accessCode.trim();
    accessCode = accessCode.toLowerCase();

    Session.set("loading", true);

    Meteor.subscribe('games', accessCode, function onReady(){
      Session.set("loading", false);

      var game = Games.findOne({
        accessCode: accessCode
      });

      if (game) {
        Meteor.subscribe('players', game._id);
        player = generateNewPlayer(game, playerName);

        if (game.state === "inProgress") {
          var default_role = game.location.roles[game.location.roles.length - 1];
          Players.update(player._id, {$set: {role: default_role}});
        }

        Session.set('urlAccessCode', null);
        Session.set("gameID", game._id);
        Session.set("playerID", player._id);
        Session.set("currentView", "lobby");
      } else {
        FlashMessages.sendError(TAPi18n.__("ui.invalid access code"));
        GAnalytics.event("game-actions", "invalidcode");
      }
    });

    return false;
  },
  'click .btn-back': function () {
    Session.set('urlAccessCode', null);
    Session.set("currentView", "startMenu");
    return false;
  }
});

Template.joinGame.helpers({
  isLoading: function() {
    return Session.get('loading');
  }
});


Template.joinGame.rendered = function (event) {
  resetUserState();

  var urlAccessCode = Session.get('urlAccessCode');

  if (urlAccessCode){
    $("#access-code").val(urlAccessCode);
    $("#access-code").hide();
    $("#player-name").focus();
  } else {
    $("#access-code").focus();
  }
};

Template.lobby.helpers({
  game: function () {
    return getCurrentGame();
  },
  accessLink: function () {
    return getAccessLink();
  },
  player: function () {
    return getCurrentPlayer();
  },
  players: function () {
    var game = getCurrentGame();
    var currentPlayer = getCurrentPlayer();

    if (!game) {
      return null;
    }

    var players = Players.find({'gameID': game._id}, {'sort': {'createdAt': 1}}).fetch();

    players.forEach(function(player){
      if (player._id === currentPlayer._id){
        player.isCurrent = true;
      }
    });

    return players;
  },
  isLoading: function() {
    var game = getCurrentGame();
    return game.state === 'settingUp';
  }
});

Template.lobby.events({
  'click .btn-leave': leaveGame,
  'click .btn-start': function () {
    GAnalytics.event("game-actions", "gamestart");

    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'settingUp'}});
  },
  'click .btn-toggle-qrcode': function () {
    $(".qrcode-container").toggle();
  },
  'click .btn-remove-player': function (event) {
    var playerID = $(event.currentTarget).data('player-id');
    Players.remove(playerID);
  },
  'click .btn-edit-player': function (event) {
    var game = getCurrentGame();
    resetUserState();
    Session.set('urlAccessCode', game.accessCode);
    Session.set('currentView', 'joinGame');
  },
  'click .btn-sugg': function () {
    console.log("sugg");
    Session.set("currentView", "Suggestions");
    return false;
  }
});

Template.lobby.rendered = function (event) {
  var url = getAccessLink();
  var qrcodesvg = new Qrcodesvg(url, "qrcode", 250);
  qrcodesvg.draw();
};

function getTimeRemaining(){
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();

  if (game.paused){
    var localPausedTime = game.pausedTime - TimeSync.serverOffset();
    var timeRemaining = localEndTime - localPausedTime;
  } else {
    var timeRemaining = localEndTime - Session.get('time');
  }

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

Template.gameView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: function () {
    var game = getCurrentGame();

    if (!game){
      return null;
    }

    var players = Players.find({
      'gameID': game._id
    });

    return players;
  },
  locations: function () {
	  if (getCurrentGame().locationOption === "location1") {
	    return locations;
	  }
	  if(getCurrentGame().locationOption === "location2") {
	    return locations2;
      }
      return locations.concat(locations2);
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  }
});

Template.gameView.events({
  'click .btn-leave': leaveGame,
  'click .btn-end': function () {
    GAnalytics.event("game-actions", "gameend");

    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'waitingForPlayers'}});
  },
  'click .btn-toggle-status': function () {
    $(".status-container-content").toggle();
  },
  'click .game-countdown': function () {
    var game = getCurrentGame();
    var currentServerTime = TimeSync.serverTime(moment());

    if(game.paused){
      GAnalytics.event("game-actions", "unpause");
      var newEndTime = game.endTime - game.pausedTime + currentServerTime;
      Games.update(game._id, {$set: {paused: false, pausedTime: null, endTime: newEndTime}});
    } else {
      GAnalytics.event("game-actions", "pause");
      Games.update(game._id, {$set: {paused: true, pausedTime: currentServerTime}});
    }
  },
  'click .player-name': function (event) {
    event.currentTarget.className = 'player-name-striked';
  },
  'click .player-name-striked': function(event) {
    event.currentTarget.className = 'player-name';
  },
  'click .location-name': function (event) {
    event.target.className = 'location-name-striked';
  },
  'click .location-name-striked': function(event) {
    event.target.className = 'location-name';
  }
});
