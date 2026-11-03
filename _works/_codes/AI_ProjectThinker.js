

import fs from 'fs';
import path from 'path';


import convertStringValuesRecursive from './_toolkit/convertStringValuesRecursive.js';
import stringToObject from './_toolkit/stringToObject.js';
import translateText from './_toolkit/translateText.js';
import getConcatedTextsinFolder from './_toolkit/getConcatedTextsinFolder.js';



import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_REQUEST_INTERVAL_MS = 4100;
const nextModelRequestAt = new Map();

async function waitForModelRequestSlot(model, apikey) {
    const key = `${apikey}:${model}`;
    const now = Date.now();
    const requestAt = Math.max(now, nextModelRequestAt.get(key) || now);
    nextModelRequestAt.set(key, requestAt + MODEL_REQUEST_INTERVAL_MS);

    const waitMs = requestAt - now;
    if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
    }
}

function removeBrackets(input) {
    // Remove all content between '[' and ']' using regex
    return input.replace(/\[.*?\]/g, '');
}

export default async (
    projectInfo,
    guiderPathName,
    model,
    apikey,
    profileAboutMe = "",
    profileCategory = ""
) => {
    

    let AI_guider_Directory;
    let guider_text;
    let text_prompt;

    try { // Create AI_guider variable and read value from file
        if(guiderPathName === undefined || guiderPathName === null || guiderPathName === '') {
            //console.log('guiderPathName is empty, using default path');  
            const guiderPath = path.join(process.cwd(),'/_works/_documents/AI_guiders'); 

            const subdirectories = fs.readdirSync(guiderPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            const underscoreDirs = subdirectories.filter(dir => dir.startsWith('_'));

            if (underscoreDirs.length > 0) {
                AI_guider_Directory = path.join(guiderPath, underscoreDirs[0]);
            } else if (subdirectories.includes('defaultAI')) {
                AI_guider_Directory = path.join(guiderPath, 'defaultAI');
            } else {
                throw new Error('No valid AI guider directory found.');
            }   
        }
        else{
            AI_guider_Directory = guiderPathName;
            //console.log('guiderPathName',AI_guider_Directory);
        }

        //console.log('AI_guider_Directory',AI_guider_Directory);
        guider_text = getConcatedTextsinFolder(AI_guider_Directory);
        text_prompt = `${guider_text}

Freelancer profile "about me":
${profileAboutMe}

Profile-specific category criteria and scores (use these for CategoryName and CategoryScore):
${JSON.stringify(profileCategory)}

JSON string of Project:
${JSON.stringify(projectInfo)}
`;

    } catch (error) {
        console.log('error',error);
        return null;
    } 
    //console.log('text_prompt', text_prompt);
     
    let result;
    let result_text;
    try {


        const modelClient = new GoogleGenerativeAI(apikey).getGenerativeModel({ model });

        await waitForModelRequestSlot(model, apikey);
        result = await modelClient.generateContent([text_prompt]);
        result_text = result.response.text();
    } catch (error) {
        throw error;
    }
    //console.log('result_text', result_text);  

    let result_object;
    try {
        result_object = convertStringValuesRecursive(stringToObject(result_text));            
    } catch (error) {
        console.log ('_Parsing Answer Error:', error);
        return null;
    }
    //console.log('result_object', result_object);
    result_object['ProposalText'] = removeBrackets(result_object['ProposalText']);

    Object.assign(projectInfo, result_object);
    console.log('CategoryName:', projectInfo.CategoryName, 'CategoryScore:', projectInfo.CategoryScore);
    
    
    //const prettyJsonString = JSON.stringify(projectInfo, null, 2); 

    //let reportData = prettyJsonString;
    //reportData = prettyJsonString.replace(/_/g, ' ');

    //console.log('projectInfo:',projectInfo);
    return projectInfo;
};
