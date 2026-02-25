export function createLoanTimer(onTimeExpired) {
    let loanActive = false;
    let loanAmount = 0;
    let timeRemaining = 0; //s
    let timerInterval = null;
    const TOTAL_LOAN_TIME = 5 * 60;

    function startTimer(amount) {
        stopTimer();
        
        loanActive = true;
        loanAmount = amount;
        timeRemaining = TOTAL_LOAN_TIME;
        
        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
            } else {
                //čas vypršel
                stopTimer();
                if (onTimeExpired) {
                    onTimeExpired(loanAmount);
                }
            }
        }, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        loanActive = false;
        loanAmount = 0;
        timeRemaining = 0;
    }
    
    function getTimeRemaining() {
        return timeRemaining;
    }
    
    function getFormattedTime() {
        if (!loanActive) return "0:00";
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function isActive() {
        return loanActive;
    }
    
    function getLoanAmount() {
        return loanAmount;
    }
    
    function reset() {
        stopTimer();
    }
    
    return {
        startTimer,
        stopTimer,
        getTimeRemaining,
        getFormattedTime,
        isActive,
        getLoanAmount,
        reset
    };
}