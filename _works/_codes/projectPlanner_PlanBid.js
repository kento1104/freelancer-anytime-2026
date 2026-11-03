
const  BADCOUNTRY = [ "Bangladesh", "Pakistan", "India", "Nepal", "Sri Lanka","Philippines", "Vietnam", "Indonesia", "Malaysia", "Thailand", "Nigeria", "Kenya", "South Africa", "Ukraine","China", "Taiwan", "Hong Kong", "Macau","Korea", "Cambodia", "Laos", "Myanmar"];
const  GOODCOUNTRY=["United States", "Canada", "United Kingdom", "Australia", "New Zealand", "Germany", "France", "Netherlands", "Sweden", "Norway"];
const  GOODCURRENCY=["USD", "GBP", "EUR"];
const  BADCURRENCY=["INR", "BDT", "PKR", "VND", "IDR", "MYR", "THB"];

function isEnabled(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    const normalized = String(value ?? "").trim().toLowerCase();
    return ["true", "yes", "1"].includes(normalized);
}

function getVerificationFlag(projectInfo, field, nestedField) {
    const directValue = projectInfo[field];
    const nestedValue = projectInfo.owner_info?.status?.[nestedField];
    return isEnabled(directValue) || isEnabled(nestedValue);
}

function get_PlanBid(projectInfo) {
    if(projectInfo['Prefered']) return "Bad_Prefered";

    const depositMade = getVerificationFlag(projectInfo, "Deposit_made", "deposit_made");
    const paymentVerified = getVerificationFlag(projectInfo, "Payment_verified", "payment_verified");
    if (!depositMade || !paymentVerified) {
        return "Bad_Verify";
    }

    if (BADCOUNTRY.some(country => projectInfo['Country'].toLowerCase().includes(country.toLowerCase()))) {
        return "Bad_Country";
    }

    if (GOODCURRENCY.some(currency => projectInfo['BudgetCurrency'].includes(currency))) {
        if(projectInfo['ProjectType'] == "Hourly") {
            if (projectInfo['MinBudget'] >= 50) {
                return "Bad_over50pHr";
            }
        }
        else if(projectInfo['ProjectType'] == "Fixed") {
            if (projectInfo['MinBudget'] >= 2500) {
                return "Bad_over2500";
            }
        }
    }

    return "Good";
}



export default  (projectInfo) => {
    const planBid = get_PlanBid(projectInfo);
    const normalizedPlanBid = planBid === "Good" ? "good" : planBid;

    projectInfo['PlanBid'] = planBid;
    projectInfo['plan_bid'] = normalizedPlanBid;
    return projectInfo;
}
