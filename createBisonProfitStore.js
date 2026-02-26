export function createBisonProfitStore() {
    let storedProfit = 0;
    
    function addProfit(amount) {
        if (amount > 0) {
            storedProfit += amount;
            console.log(`Bison profit stored: +$${amount}, total: $${storedProfit}`);
        }
    }
    
    function withdrawProfit(addMoneyCallback) {
        if (storedProfit > 0) {
            console.log("Volám addMoneyCallback s částkou:", storedProfit);
            addMoneyCallback(storedProfit);
            const withdrawn = storedProfit;
            storedProfit = 0;
            console.log(`Bison profit withdrawn: $${withdrawn}, nový storedProfit: 0`);
            return withdrawn;
        }
        console.log("Žádný profit k výběru");
        return 0;
    }
    
    function getStoredProfit() {
        return storedProfit;
    }
    
    return {
        addProfit,
        withdrawProfit,
        getStoredProfit
    };
}