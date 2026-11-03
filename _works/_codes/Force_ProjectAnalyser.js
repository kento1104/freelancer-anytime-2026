const importantNambers=[5,10,20,30,50,100,150,250,500,750,1000,1500,2000,2500,3000,3500,4000,4500,5000,6000,7000,8000,9000,10000,15000,20000,25000,30000,35000,40000,45000,50000,60000,70000,80000,90000,100000];

const rates = {
    USD: 1.000000,
    INR: 0.012029,
    AUD: 0.653595,
    EUR: 1.075269,
    GBP: 1.250000,
    CAD: 0.735294,
    SGD: 0.746269,
    NZD: 0.602410,
    HKD: 0.127695
  };



  export default (projectInfo) => {
    const currency = projectInfo['BudgetCurrency'];
    if (!Object.prototype.hasOwnProperty.call(rates, currency)) {
        throw new Error(`Unsupported budget currency code: ${currency || "(empty)"}`);
    }

    projectInfo['MinBudget_USD'] = Number((projectInfo['MinBudget'] * rates[currency]).toFixed(1));
    projectInfo['MaxBudget_USD'] = Number((projectInfo['MaxBudget'] * rates[currency]).toFixed(1));

    projectInfo['MinBudgetGroup']=importantNambers[0];
    for(let i=importantNambers.length-1; i>=0; i--){
        if(projectInfo['MinBudget_USD']>=importantNambers[i]){
            projectInfo['MinBudgetGroup'] = importantNambers[i];
            break;
        }
    }

    projectInfo['MaxBudgetGroup']=importantNambers[0];
    for(let i=importantNambers.length-1; i>=0; i--){
        if(projectInfo['MaxBudget_USD']>=importantNambers[i]){
            projectInfo['MaxBudgetGroup'] = importantNambers[i];
            break;
        }
    }
    return projectInfo;
}
