import Force_BudgetSetter from './Force_BudgetSetter.js';
import AI_ProjectThinker from './AI_ProjectThinker.js';

const modelSet= [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash"
];

export default async (projectInfo, guiderName, profileAboutMe = "", profileCategory = "", apiKey = "") => {
    if (typeof apiKey !== "string" || apiKey.trim() === "") {
        throw new Error("A Gemini API key is required to generate a proposal.");
    }

    let retries = 0;
    const unavailableModels = new Set();

    while (retries < modelSet.length * 2) {
        const model = modelSet[retries % modelSet.length];
        if (unavailableModels.has(model)) {
            retries++;
            continue;
        }

        try {
            let tempProjectInfo = Force_BudgetSetter(projectInfo);
            tempProjectInfo = await AI_ProjectThinker(
                tempProjectInfo,
                guiderName,
                model,
                apiKey.trim(),
                profileAboutMe,
                profileCategory
            );

            if (tempProjectInfo) {
                return tempProjectInfo;
            }
        } catch (error) {
            const retryInfo = error.errorDetails?.find(detail => detail['@type']?.endsWith('.RetryInfo'));
            const retryDelay = retryInfo?.retryDelay?.match(/^(\d+(?:\.\d+)?)s$/);
            const delayMs = retryDelay
                ? Math.ceil(Number(retryDelay[1]) * 1000)
                : Math.min(1000 * 2 ** retries, 30000);

            if (error.status === 429) {
                console.warn(`AI quota limit for model "${model}"; retrying in ${Math.ceil(delayMs / 1000)}s.`);
            } else {
                console.error(`AI request failed for model "${model}" (HTTP ${error.status || "unknown"}).`, error.message);
            }

            if (error.status === 404) {
                unavailableModels.add(model);
                retries++;
                if (unavailableModels.size === modelSet.length) break;
                continue;
            }

            if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                break;
            }

            retries++;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
        }

        retries++;
    }

    throw new Error('Gemini could not generate a proposal after all retries.');
};


/*

modelName: 'gemini-2.0-flash', //'gemini-1.5-flash',
apiKey: process.env.GEMINI_API_KEY,
global.GeminiAI = new GoogleGenerativeAI(global.state.commandAI_info.apiKey);
global.CommandAI = global.GeminiAI.getGenerativeModel({ model: global.state.commandAI_info.modelName });

modelSet: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-pro-exp-02-05",
    "gemini-2.0-flash-thinking-exp-01-21",
    "learnlm-1.5-pro-experimental"
  ],




const modelSet = global.state.prepareAI_info.modelSet;
const currentModelName = global.state.prepareAI_info.modelName;
const currentIndex = modelSet.indexOf(currentModelName);
const nextIndex = (currentIndex + 1) % modelSet.length;
global.state.prepareAI_info.modelName = modelSet[nextIndex];
global.PrepareAI = global.GeminiAI.getGenerativeModel({ model: global.state.prepareAI_info.modelName });




function proposalMaker(projectInfo) {
    projectInfo['PlanBid'] = projectDeterminer(projectInfo);
    projectInfo['Identity_verified']   = projectInfo['Identity_verified'] ? "Yes" : "No";
    projectInfo['Payment_verified']   = projectInfo['Payment_verified'] ? "Yes" : "No";
    projectInfo['Deposit_made']   = projectInfo['Deposit_made'] ? "Yes" : "No";
    projectInfo['Email_verified']   = projectInfo['Email_verified'] ? "Yes" : "No";
    projectInfo['Profile_completed']   = projectInfo['Profile_completed'] ? "Yes" : "No";
    projectInfo['Phone_verified']   = projectInfo['Phone_verified'] ? "Yes" : "No";

    return projectInfo;
}
*/
