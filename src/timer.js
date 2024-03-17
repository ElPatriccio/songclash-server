class Timer{
    constructor(countdown){
        this.currentTimer = null;
        this.countdown = countdown;
        this.timeRemaining = countdown;
        this.startCallback = null;
        this.updateCallback = null;
        this.finishCallback = null;
    }

    setCountdown(seconds){
        this.stopTimer();
        this.countdown = seconds;
    }

    getTimeRemainingMs(){
        const ms = this.deadline - performance.now();
        return ms;
    }

    getTimeSinceStart(){
        const ms = (this.countdown * 1000) - Math.floor(this.deadline - performance.now());
        return ms;
    }

    getTimeRemaining(){
        const total = this.getTimeRemainingMs();
        const seconds = Math.floor((total / 1000) % 60);
        return seconds;
    }
    
    updateTimer(){
        let seconds = this.getTimeRemaining(this.deadline);
        if(seconds >= 0){
            this.timeRemaining = seconds;
            this.updateCallback();
        }
        else{
            this.stopTimer();
        }
    }

    startTimer(delay = 0, startCallback = () => {}, updateCallback = ()=>{}, finishCallback = () =>{}){
        this.timeRemaining = this.countdown;
        if(this.currentTimer != null) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        if(!this.startCallback) this.startCallback = startCallback;
        if(!this.updateCallback) this.updateCallback = updateCallback;
        if(!this.finishCallback) this.finishCallback = finishCallback;

        setTimeout(()=>{
            this.startCallback();
            this.setDeadline();
            this.updateCallback();
            const id = setInterval(() => {
                this.updateTimer();
            }, 1000)
            this.currentTimer = id;
        }, delay)
        
    }

    setDeadline(){
        this.deadline = performance.now() + this.countdown * 1000;
    }

    resetCallbacks(startCallback = () => {}, updateCallback = () => {}, finishCallback = () => {}){
        this.startCallback = startCallback;
        this.updateCallback = updateCallback;
        this.finishCallback = finishCallback;
    }

    stopTimer(hardStop = false){
        if(this.currentTimer) {
            if(!hardStop) this.finishCallback();
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
    }
}
module.exports = Timer;

