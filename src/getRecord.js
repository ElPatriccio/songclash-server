const fs = require("fs");
const path = require("path");

const getRecord = (song) =>{
    let user = "Niemand";
    let ms = "- ms";
    const file = fs.readFileSync(path.join(__dirname, "../records.txt"), "utf-8");
    const entries = file.split(";");
    for(let i = 0; i < entries.length-1; i++){
        if(entries[i].search(song) != -1){
            user = entries[i].split(" ")[1];
            ms = entries[i].split(" ")[2];
        }
    }
    return{user, ms};

}



module.exports=getRecord;