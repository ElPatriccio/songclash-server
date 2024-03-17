class User{
    constructor(name, socketId){
        this.name = name;
        this.socketId = socketId;
        this.points = 0;
        this.iconColor = ['red', 'red'];
        this.milliseconds = 0;
        this.finished = [false, false];
        this.skip = false;
    }

    resetRoundSpecificValues(){
        this.iconColor = ['red', 'red'];
        this.milliseconds = 0;
        this.finished = [false, false];
        this.skip = false;
    }

    resetGameSpecificValues(fullReset=false){
        this.points = 0;
        if(fullReset) this.resetRoundSpecificValues();
    }

    setIconColor(icon, color){
        if(color !== 'green' && color !== 'red') return;
        if(icon !== 'interpret' && icon !== 'song') return;

        this.iconColor[icon === 'interpret' ? 0 : 1] = color;
    }
    isFinished(){
        return this.finished[0] && this.finished[1];
    }
    
    setFinished(eventString){
        this.finished[eventString === 'interpret'? 0 : 1] = true;
    }
}

module.exports = User;