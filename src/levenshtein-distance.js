const isGuessAccurateEnough = (guess, solution) =>{
    if(guess === solution) return true;
    if(guess.replace(" ", "").replace("  ", "").replace("   ", "") === "") return false;
    let lsMatrix = Array.from(Array(guess.length+1), () => new Array(solution.length+1).fill(0));
    for (let i = 1; i <= guess.length; i++) {
        lsMatrix[i][0] = i;
    }
    for(let j = 1; j <= solution.length; j++){
        lsMatrix[0][j] = j
    }

    for(let j = 1; j <= solution.length; j++){
        for(let i = 1; i<= guess.length; i++){
            let substitutionCost = 0;
            if(guess[i-1] !== solution[j-1]){
                substitutionCost = 1
            }
            lsMatrix[i][j] = Math.min(lsMatrix[i-1][j] + 1, lsMatrix[i][j-1] + 1, lsMatrix[i-1][j-1] + substitutionCost);
        }
    }
    
    if(lsMatrix[guess.length][solution.length] > (solution.length / 2) - (solution.length > 5 ? solution.length/8: 1)) return false;
    else return true;
}


module.exports = isGuessAccurateEnough;