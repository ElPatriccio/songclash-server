const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const Timer = require('./timer');
const User = require('./user');
const isGuessAccurateEnough = require('./levenshtein-distance');
const getSongs = require('./songs');
const getRecord = require('./getRecord');

const cors = require('cors');
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
})


let users = [];
let finishedCount = 0;
let skipCount = 0;
let bonusPoints = 0;

let currentSong;
let gameStarted = false;
let inRound = false;
let round = 0;
let indices = [];

const songs = getSongs("C:/Users/Patrick/Desktop/Programming/songclash/songs", ".mp3");
const roundTimer = new Timer(30);

const sortUsers = ()=>{
  newUsers = [users[0]]
  for (let i = 1; i < users.length; i++) {
    let replaceIndex = -1;
    for (let j = 0; j < newUsers.length; j++) {
      if(newUsers[j].points < users[i].points){
        replaceIndex = j;
        break;
      }
    }
    if(replaceIndex == -1)return;
    users = insertionSort(users[i], replaceIndex, newUsers);
  }
}

const insertionSort = (user, replaceIndex, newUsers) =>{
  newNewUsers = [];
  for (let i = 0; i < replaceIndex; i++) {
    newNewUsers.push(newUsers[i]);
  }
  newNewUsers.push(user);
  for (let i = replaceIndex; i < newUsers.length; i++) {
    newNewUsers.push(newUsers[i]);
  }
  return newNewUsers;
}

const convertToUnderscore = (string) =>{
  let tmp = "";
  for(let i = 0; i< string.length; i++){
    tmp += "_";
    if(i != string.length-1) tmp += " ";
  }
  return tmp;
}

const hideSolution = (solutionArr) => {
  const hint = solutionArr.map((part) => convertToUnderscore(part))
  return hint;
}

const getUserIndex = (identifier) =>{
  let index = -1;
  for (let i = 0; i < users.length; i++) {
    if(users[i].name === identifier || users[i].socketId === identifier){
      index = i;
      break;
    }
  }
  return index;
}

const resetRoundSpecificValues = () => {
  inRound = false;
  skipCount = 0;
  finishedCount = 0;
  bonusPoints = users.length-1;
  for (let i = 0; i < users.length; i++) {
    users[i].resetRoundSpecificValues();    
  }
}

const resetGameSpecificValues = (fullReset=false) => {
  if(fullReset) resetRoundSpecificValues();
  inRound = false;
  round = 0;
  indices = [];
  for (let i = 0; i < users.length; i++) {
    users[i].resetGameSpecificValues(fullReset);    
  }
}

const waitForNextGame = (socket) => {
  gameStarted = false;
  const waitTimer = new Timer(10);
  waitTimer.startTimer(0, ()=>{}, ()=>{}, ()=>{
    if(users.length > 0){
      startGame(socket, 0);
    }
  });
}

const startGame = (socket, delay=10000) =>{
  console.log("STARTING GAME");
  resetGameSpecificValues(true);
  gameStarted = true;
  while(indices.length === 0 || indices.length !== (new Set(indices)).size){
    indices = [];
    for (let i = 0; i < Math.min(10, songs.length); i++) {
      indices.push(Math.floor(Math.random() * (songs.length+1)));      
    }
  }
  console.log(indices);
  gameLoop(socket, delay);
}

const gameLoop = (socket, delay) =>{
  const startCallback = () => {
    resetRoundSpecificValues();
    currentSong = songs[indices[round]];
    console.log(currentSong.interpret);
    console.log(currentSong.song);
    round++;
    socket.emit("next_round", {interpret: hideSolution(currentSong.interpret), song: hideSolution(currentSong.song), name: currentSong.name, round});
    socket.to("songclashroom").emit("next_round", {interpret: hideSolution(currentSong.interpret), song: hideSolution(currentSong.song), name: currentSong.name, round});

    inRound = true;

    socket.emit("update_leaderboard", users)
    socket.to("songclashroom").emit("update_leaderboard", users);
  }

  const updateCallback = () => {
    socket.emit("update_timer", roundTimer.getTimeRemaining());
    socket.to("songclashroom").emit("update_timer", roundTimer.getTimeRemaining());
  };

  const finishCallback = () => {
    inRound = false;
    socket.emit("update_timer", 0);
    socket.to("songclashroom").emit("update_timer", 0);
    currentSong.display.record = getRecord(currentSong.name);
    socket.emit("stop_round", currentSong.display);
    socket.to("songclashroom").emit("stop_round", currentSong.display);
    if(users.length > 0 && round < Math.min(10, songs.length)) roundTimer.startTimer(5000);
    if(round === Math.min(10, songs.length)) {
      waitForNextGame(socket);
    }
  }
  roundTimer.startTimer(delay, startCallback, updateCallback, finishCallback);
}

const checkGuess = (guess, solution, eventString, userHints, user, socket) =>{
    if(user.finished[0] && eventString === 'interpret') return;
    if(user.finished[1] && eventString === 'song') return;

    const newHints = [];
    for (let i = 0; i < solution.length; i++) {
      if(isGuessAccurateEnough(guess, solution[i])){
        newHints.push(solution[i]);
        userHints[i] = solution[i];
      }
      else{
        newHints.push(userHints[i])
      }
    }
    
    let noMistake = true;
    for (let i = 0; i < newHints.length; i++) {
       if(/__*/.test(newHints[i])){
        noMistake = false
       }
    }
    socket.emit("update_" + eventString + "_hint", newHints);

    if(noMistake){
      user.points += 2;
      user.setIconColor(eventString, "green");
      user.setFinished(eventString);

      if(user.isFinished()) {
        user.milliseconds =  Math.round(30000 - roundTimer.getTimeRemainingMs());
        finishedCount++;
        user.points += bonusPoints;
        bonusPoints -= 1;
      }

      sortUsers();

      socket.emit("update_leaderboard", users);
      socket.to("songclashroom").emit("update_leaderboard", users)

      if(finishedCount === users.length) roundTimer.stopTimer();
    }
    
}

io.on("connection", (socket) =>{
    socket.on('login', function(data){
        if(data.userId === undefined || data.userId === ''){
          socket.emit("login_authorized", {authorized: false, message: "*Ungültiger Name!"}); 
          return;
        }

        for(let i = 0; i < users.length; i++){
          if(data.userId === users[i].name){
            socket.emit("login_authorized", {authorized: false, message: "*Name existiert schon!"});
            return;
          }
        }
        console.log('user ' + data.userId + ' connected');

        users.push(new User(data.userId, socket.id));

        socket.join("songclashroom")
        socket.emit("login_authorized", {authorized: true});
        socket.emit("update_leaderboard", users);
        socket.to("songclashroom").emit("update_leaderboard", users);
        if(!gameStarted) startGame(socket);
        else if(inRound) socket.emit("next_round", {interpret: hideSolution(currentSong.interpret), song: hideSolution(currentSong.song), name: currentSong.name})
        
      });
    
      socket.on('disconnect', () => {
        
        let index = getUserIndex(socket.id);

        if(index === -1) {
          console.log("Non existing User tried to disconnect!");
          return;
        }

        console.log('user ' + users[index].name + ' disconnected');
        users.splice(index, 1);

        if(users.length === 0) {
          gameStarted = false;
          inRound = false;
          console.log("STOPPING GAME");
          roundTimer.stopTimer();
        }
        socket.to("songclashroom").emit("update_leaderboard", users);
      });

      socket.on('send_guess', (data) =>{
        if(!gameStarted || !inRound) return;
        const user = users[getUserIndex(socket.id)];
        console.log(user.name + ' hat ' + data.guess + ' geraten.');
        data.guess = data.guess.toLowerCase();
        splittedGuesses = data.guess.split(" ");

        for(let i = 0; i < splittedGuesses.length; i++){
          checkGuess(splittedGuesses[i], currentSong.interpret, "interpret", data.interpret, user, socket);
          checkGuess(splittedGuesses[i], currentSong.song, "song", data.song, user, socket);
        }
        
      })

      socket.on('skip_song', () =>{
        if(!gameStarted || !inRound) return;
        const index = getUserIndex(socket.id);
        if(users[index].skip === true) return;
        console.log(users[index].name + " will skippen");
        skipCount++;
        if(users.length == skipCount) {
          console.log("SKIPPING ROUND");
          roundTimer.stopTimer();
        }
      })

});


server.listen(3001, () => {
    console.log("SERVER IS RUNNING");
})