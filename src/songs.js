const fs = require("fs");
const path = require("path");

const getSongs = (dir, suffix) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  let songs = [];

  for (const file of files) {
    if (file.name.endsWith(suffix)) {
      const fileName = file.name;
      let fileNameStripped = fileName.replace(".mp3", "");
      fileNameStripped = fileNameStripped.replace(/-/g, " ");
    
      const dInterpret = fileNameStripped.split("=")[0];
      const dSong = fileNameStripped.split("=")[1];
      
      let interpret = dInterpret.replace(/[^a-zA-Z0-9 ]/g, "");
      let song = dSong.replace(/[^a-zA-Z0-9 ]/g, "");
      song = song.replace(/\(?feat.*\)?/, "");
      
      interpret = interpret.toLowerCase();
      song = song.toLowerCase();

      interpret = interpret.split(" ");
      song = song.split(" ");
      
      songs.push({interpret, song, name: fileName, display:{interpret: dInterpret, song: dSong}});
    }
  }

  return songs;
};

module.exports = getSongs;

getSongs(path.join(__dirname, "../../songs/"), ".mp3")