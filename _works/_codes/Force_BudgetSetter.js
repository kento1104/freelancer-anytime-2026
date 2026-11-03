
function selectBudget(mincost, maxcost, startPosPer, endPosPer) {
    const diff = maxcost - mincost;
    const startPos = mincost + diff * startPosPer;
    const endPos = mincost + diff * endPosPer;

    const candidates = [];

    for (let num = Math.ceil(startPos); num <= Math.floor(endPos); num++) {
        if (num < 100) {
            candidates.push(num); // Two-digit or less: any number
        } else {
            const str = num.toString();
            const prefix = parseInt(str.slice(0, 3));
            const suffix = str.slice(3);
            const isNeat = prefix % 5 === 0 && /^[0]*$/.test(suffix);
            if (isNeat) {
                candidates.push(num);
            }
        }
    }

    if (candidates.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

export default (projectInfo) => {

    if(projectInfo['ProjectType']== 'Fixed'){
        if( projectInfo['MinBudgetGroup']< 30){    //[5,30)
            if(projectInfo['MaxBudget_USD']<=30){
                projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.40, 0.80);
            }else if(projectInfo['MaxBudget_USD']<=50){
                projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.30, 0.68);
            }else {
                projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.15, 0.35);
            }
        }else if(projectInfo['MinBudgetGroup']==30){ //[30, 50)
            if(projectInfo['MaxBudget_USD']<150){
                projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.40, 0.80);
            }else {
                projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.10, 0.20);
            }
        }else if(projectInfo['MinBudgetGroup']==50){ //[50, 100)  
            projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0.10, 0.20);
        }else if(50<projectInfo['MinBudgetGroup']){ //[100, +) 
            projectInfo['ProposalBudget']= projectInfo['MinBudget']
        }else{
            console.log('SYSError: No valid budget range found.');
        }
    }else if(projectInfo['ProjectType']== 'Hourly'){
        if( projectInfo['MinBudgetGroup']< 10){    //[0,10)
            projectInfo['ProposalBudget']= projectInfo['MaxBudget']
        }else if(projectInfo['MinBudgetGroup']==10){ //[10, 20)
            projectInfo['ProposalBudget']= selectBudget(projectInfo['MinBudget'], projectInfo['MaxBudget'], 0, 0.50);
        }else if(20<projectInfo['MinBudgetGroup']){ //[20, +) 
            projectInfo['ProposalBudget']= projectInfo['MinBudget']
        }else{
            console.log('SYSError: No valid budget range found.');
        }
    }
    return projectInfo;
}

