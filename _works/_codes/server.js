/**
timeStamp
title
href

href
timeStamp
ProjectTitle
ProjectBudget
    ProjectType
    BudgetCurrencyChar
    BudgetCurrency
    MinBudget
    MaxBudget
ProjectDescription
Location
Country
Star
Member
    MemberDayOld
Review
Identity_verified
Payment_verified
Deposit_made
Email_verified
Profile_completed
Phone_verified
Prefered
IPA
NDA
Restricted
Australian

    PlanBid

    ProposalText
    ProposalBudget
    ProposalTime


Conclusion

MinBudget_USD
MaxBudget_USD
MinBudgetGroup
MaxBudgetGroup




**/

import express from "express";
import { google } from "googleapis";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "node:fs";



import getFormatedLocalTime from './_toolkit/getFormatedLocalTime.js';

import projectPlanner_PlanBid from './projectPlanner_PlanBid.js';
import projectPlanner_Conclusion from './projectPlanner_Conclusion.js';
import Force_ProjectAnalyser from './Force_ProjectAnalyser.js';
import proposalMaker from './proposalMaker.js';





const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type"] // Allowed headers
}));
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (req, res) => {
    res.json({ status: "ok" });
});

// Google Sheets API configuration
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_ID = "1M1Cd3Ds0cOUb9ibAfffzgjej5AM-ELnTNC0jwspxEfs"; // Google Sheets ID
const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || "_works/_documents/freelanceranytime.json";
const credentials = serviceAccountJson
    ? JSON.parse(serviceAccountJson)
    : fs.existsSync(credentialsPath)
        ? JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
        : undefined;
const auth = new google.auth.GoogleAuth({
    ...(credentials ? { credentials } : {}),
    scopes: SCOPES,
});

const ALARM_SHEET_NAME="Alarms";
const API_PROJECTS_SHEET_NAME="API_projects";
const EVENTS_SHEET_NAME="Events";
const PROFILE_SHEET_NAME="Profile";

////////////////////////////////////////////sheet

let globalHeaderIndexes_API_Projects = {};
let globalHeaders_API_Projects = [];
let globalHeaderIndexes_Events = {};
let globalHeaders_Events = [];
let globalHeaders_Profile = [];

const globalSheetId = SHEET_ID;
const globalAuth = auth;

async function getHeaderIndexes(headers) {
    const headerIndexes = {};
    headers.forEach((header, index) => {
        const trimmedHeader = header.trim();
        if (trimmedHeader !== "") {
            headerIndexes[trimmedHeader] = index;
        }
    });
    return headerIndexes;
}
async function initializeHeaderIndexes() {
    const client = await globalAuth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const headerResponse_API_Projects = await sheets.spreadsheets.values.get({
        spreadsheetId: globalSheetId,
        range: `${API_PROJECTS_SHEET_NAME}!1:1`,
    });

    globalHeaders_API_Projects = headerResponse_API_Projects.data.values?.[0] || [];
    if (globalHeaders_API_Projects.length === 0) {
        throw new Error(`The ${API_PROJECTS_SHEET_NAME} sheet must have a header row.`);
    }
    globalHeaderIndexes_API_Projects = await getHeaderIndexes(globalHeaders_API_Projects);
    if (getHeaderIndexByName(globalHeaders_API_Projects, ["conclusion"]) < 0) {
        throw new Error(`The ${API_PROJECTS_SHEET_NAME} sheet needs a conclusion column for bid suitability.`);
    }
    if (getHeaderIndexByName(globalHeaders_API_Projects, ["category_name", "CategoryName"]) < 0
        || getHeaderIndexByName(globalHeaders_API_Projects, ["category_score", "CategoryScore"]) < 0) {
        throw new Error(`The ${API_PROJECTS_SHEET_NAME} sheet needs category_name and category_score columns.`);
    }
    const requiredBudgetHeaders = [
        ["MinBudget_USD"],
        ["MaxBudget_USD"],
        ["MinBudgetGroup"],
        ["MaxBudgetGroup"],
    ];
    const missingBudgetHeaders = requiredBudgetHeaders
        .filter(aliases => getHeaderIndexByName(globalHeaders_API_Projects, aliases) < 0)
        .map(aliases => aliases[0]);
    if (missingBudgetHeaders.length > 0) {
        throw new Error(
            `The ${API_PROJECTS_SHEET_NAME} sheet needs budget output columns: ${missingBudgetHeaders.join(", ")}.`
        );
    }


    const headerResponse_Events = await sheets.spreadsheets.values.get({
        spreadsheetId: globalSheetId,
        range: "Events!1:1",
    });

    globalHeaders_Events = headerResponse_Events.data.values[0];
    globalHeaderIndexes_Events = await getHeaderIndexes(globalHeaders_Events);

    const headerResponse_Profile = await sheets.spreadsheets.values.get({
        spreadsheetId: globalSheetId,
        range: `${PROFILE_SHEET_NAME}!1:1`,
    });
    globalHeaders_Profile = headerResponse_Profile.data.values?.[0] || [];
    if (globalHeaders_Profile.length === 0) {
        throw new Error(`The ${PROFILE_SHEET_NAME} sheet must have a header row.`);
    }
    if (getHeaderIndexByName(globalHeaders_Profile, ["username"]) < 0
        || getHeaderIndexByName(globalHeaders_Profile, ["about me", "about_me", "aboutMe"]) < 0
        || getHeaderIndexByName(globalHeaders_Profile, ["category"]) < 0
        || getHeaderIndexByName(globalHeaders_Profile, ["Gmini_API_key"]) < 0) {
        throw new Error(
            `The ${PROFILE_SHEET_NAME} sheet needs username, about me, category, and Gmini_API_key columns. `
            + `Headers read from row 1: ${JSON.stringify(globalHeaders_Profile)}`
        );
    }
    if (getHeaderIndexByName(globalHeaders_Events, ["bid"]) < 0
        || getHeaderIndexByName(globalHeaders_Events, ["username"]) < 0
        || getHeaderIndexByName(globalHeaders_Events, ["result", "status", "bid_status"]) < 0
        || getHeaderIndexByName(globalHeaders_Events, ["project_id", "projectId", "projectid", "href", "url"]) < 0) {
        throw new Error(`The ${EVENTS_SHEET_NAME} sheet needs bid, username, result/status, and project_id or href columns.`);
    }
}

let initializationPromise;
function ensureInitialized() {
    if (!initializationPromise) {
        initializationPromise = initializeHeaderIndexes().catch(error => {
            initializationPromise = undefined;
            throw error;
        });
    }
    return initializationPromise;
}

app.use(async (req, res, next) => {
    try {
        await ensureInitialized();
        next();
    } catch (error) {
        console.error("Failed to initialize header indexes:", error);
        res.status(503).json({ error: "Service initialization failed. Check Google Sheets credentials and configuration." });
    }
});

let apiProjectsWriteQueue = Promise.resolve();

function withApiProjectsWriteLock(operation) {
    const operationPromise = apiProjectsWriteQueue.then(operation);
    apiProjectsWriteQueue = operationPromise.then(() => undefined, () => undefined);
    return operationPromise;
}

function getProjectId(item) {
    const value = item.id ?? item.project_id ?? item.projectId;
    return value === undefined || value === null || String(value).trim() === ""
        ? ""
        : String(value).trim();
}

function getHeaderIndexByName(headers, acceptedNames) {
    const normalizedNames = new Set(acceptedNames.map(name => name.toLowerCase().replace(/[^a-z0-9]/g, "")));
    return headers.findIndex(header =>
        normalizedNames.has(String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
    );
}

function normalizeHeaderName(header) {
    return String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getRowValue(row, acceptedNames) {
    const normalizedNames = new Set(acceptedNames.map(normalizeHeaderName));
    const matchedHeader = Object.keys(row).find(header => normalizedNames.has(normalizeHeaderName(header)));
    return matchedHeader === undefined ? undefined : row[matchedHeader];
}

async function readSheetRows(sheetName, headers) {
    if (!headers || headers.length === 0) {
        throw new Error(`The ${sheetName} sheet headers have not been initialized.`);
    }

    const lastColumn = getColumnLetter_ABD(headers.length - 1);
    const client = await globalAuth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: globalSheetId,
        range: `${sheetName}!A2:${lastColumn}`,
    });

    return (response.data.values || []).map(values => {
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });
        return row;
    });
}

function normalizeUsername(username) {
    return String(username ?? "").trim().replace(/^@/, "").toLowerCase();
}

async function getUserProfile(username) {
    const profiles = await readSheetRows(PROFILE_SHEET_NAME, globalHeaders_Profile);
    const profile = profiles.find(row =>
        normalizeUsername(getRowValue(row, ["username"])) === normalizeUsername(username)
    );
    if (!profile) {
        const error = new Error(`No profile was found for username "${username}".`);
        error.status = 404;
        throw error;
    }

    const aboutMe = getRowValue(profile, ["about me", "about_me", "aboutMe"]);
    if (typeof aboutMe !== "string" || aboutMe.trim() === "") {
        const error = new Error(`The profile for username "${username}" has no about me text.`);
        error.status = 422;
        throw error;
    }
    const category = getRowValue(profile, ["category"]);
    if (typeof category !== "string" || category.trim() === "") {
        const error = new Error(`The profile for username "${username}" has no category criteria.`);
        error.status = 422;
        throw error;
    }
    const geminiApiKey = getRowValue(profile, ["Gmini_API_key"]);
    if (typeof geminiApiKey !== "string" || geminiApiKey.trim() === "") {
        const error = new Error(`The profile for username "${username}" has no Gemini API key.`);
        error.status = 422;
        throw error;
    }
    const script = getRowValue(profile, ["script"]);
    return {
        aboutMe: aboutMe.trim(),
        category: category.trim(),
        script: typeof script === "string" ? script.trim() : "",
        geminiApiKey: geminiApiKey.trim(),
    };
}

function normalizeSheetFlag(value) {
    if (typeof value === "boolean") return value;
    return ["true", "yes", "1", "good", "success", "successful", "placed", "bid placed"]
        .includes(String(value ?? "").trim().toLowerCase());
}

function toFreelancerProjectDetailUrl(rawHref) {
    const value = String(rawHref ?? "").trim();
    if (!value) return "";

    let pathname;
    try {
        pathname = new URL(value, "https://www.freelancer.com").pathname;
    } catch {
        return "";
    }

    if (/^\/projects\//i.test(pathname)) {
        return `https://www.freelancer.com${pathname.replace(/\/+$/, "").replace(/\/details$/i, "")}/details`;
    }

    const projectPath = pathname.replace(/^\/+|\/+$/g, "").replace(/\/details$/i, "");
    return projectPath
        ? `https://www.freelancer.com/projects/${projectPath}/details`
        : "";
}

function mapApiProjectRow(row) {
    const project = { ...row };
    project.id = String(getRowValue(row, ["id", "project_id", "projectId"]) ?? "").trim();
    project.ProjectTitle = String(getRowValue(row, ["title", "ProjectTitle", "project_title"]) ?? "");
    project.ProjectDescription = String(getRowValue(row, ["description", "ProjectDescription", "project_description"]) ?? "");

    const rawHref = String(getRowValue(row, ["seo_url", "href", "url"]) ?? "").trim();
    if (rawHref) {
        project.href = toFreelancerProjectDetailUrl(rawHref);
    }

    const rawType = String(getRowValue(row, ["type", "ProjectType", "project_type"]) ?? "").trim().toLowerCase();
    project.ProjectType = rawType.includes("hourly") ? "Hourly" : rawType.includes("fixed") ? "Fixed" : rawType;
    project.type = project.ProjectType;
    project.MinBudget = Number(getNestedValue(row, "budget.minimum")
        ?? getRowValue(row, ["budget.minimum", "MinBudget", "min_budget"])) || 0;
    project.MaxBudget = Number(getNestedValue(row, "budget.maximum")
        ?? getRowValue(row, ["budget.maximum", "MaxBudget", "max_budget"])) || 0;
    project.BudgetCurrency = String(getNestedValue(row, "currency.code")
        ?? getRowValue(row, ["currency.code", "BudgetCurrency", "budget_currency"]) ?? "");
    project.BudgetCurrencyCountry = String(getNestedValue(row, "currency.country")
        ?? getRowValue(row, ["currency.country", "BudgetCurrencyCountry"]) ?? "");
    project.BudgetCurrencyChar = String(getRowValue(row, ["currency.sign", "BudgetCurrencyChar"]) ?? "");
    project.Country = String(getNestedValue(row, "owner_info.country.name")
        ?? getRowValue(row, ["owner_info.country.name", "Country", "country"])
        ?? "");
    project.Deposit_made = normalizeSheetFlag(getRowValue(row, ["owner_info.status.deposit_made", "Deposit_made"]));
    project.Payment_verified = normalizeSheetFlag(getRowValue(row, ["owner_info.status.payment_verified", "Payment_verified"]));
    project["owner_info.status.identity_verified"] = normalizeSheetFlag(
        getRowValue(row, ["owner_info.status.identity_verified", "Identity_verified"])
    );
    project.Identity_verified = project["owner_info.status.identity_verified"];
    project.timeStamp = getRowValue(row, ["timestamp", "timeStamp"]) ?? "";
    project.conclusion = normalizeSheetFlag(getRowValue(row, ["conclusion"]));
    project.CategoryName = getRowValue(row, ["category_name", "CategoryName"]) ?? "";
    project.CategoryScore = getRowValue(row, ["category_score", "CategoryScore"]) ?? "";

    Force_ProjectAnalyser(project);
    projectPlanner_PlanBid(project);
    return project;
}

function getProjectIdentity(project) {
    return project.id || normalizeProjectHref(project.href);
}

function hasUserAttemptedBid(event, username, project) {
    const eventUsername = normalizeUsername(getRowValue(event, ["username"]));
    const status = getRowValue(event, ["result", "status", "bid_status"]);
    const eventProjectId = String(getRowValue(event, ["project_id", "projectId", "projectid"]) ?? "").trim();
    const eventHref = normalizeProjectHref(String(getRowValue(event, ["href", "url"]) ?? ""));
    return eventUsername === normalizeUsername(username)
        && String(status ?? "").trim() !== ""
        && ((eventProjectId !== "" && eventProjectId === project.id)
            || (eventHref !== "" && eventHref === normalizeProjectHref(project.href)));
}

function getNestedValue(item, path) {
    return path.split(".").reduce((value, key) => value?.[key], item);
}

async function getApiProjectDerivedFields(item) {
    const project = mapApiProjectRow(item);
    const planBid = project.PlanBid || "";
    const normalizedPlanBid = planBid === "Good" ? "good" : planBid;

    return {
        timestamp: getFormatedLocalTime(),
        plan_bid: normalizedPlanBid,
        category_name: "",
        category_score: "",
        conclusion: "",
        min_budget_usd: project.MinBudget_USD,
        max_budget_usd: project.MaxBudget_USD,
        min_budget_group: project.MinBudgetGroup,
        max_budget_group: project.MaxBudgetGroup,
    };
}

function getApiProjectCellValue(item, header, derivedFields) {
    const normalizedHeader = String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedHeader === "timestamp") return derivedFields.timestamp;
    if (normalizedHeader === "planbid") return derivedFields.plan_bid;
    if (normalizedHeader === "categoryname") return derivedFields.category_name;
    if (normalizedHeader === "categoryscore") return derivedFields.category_score;
    if (normalizedHeader === "conclusion") return derivedFields.conclusion;
    if (normalizedHeader === "minbudgetusd") return derivedFields.min_budget_usd;
    if (normalizedHeader === "maxbudgetusd") return derivedFields.max_budget_usd;
    if (normalizedHeader === "minbudgetgroup") return derivedFields.min_budget_group;
    if (normalizedHeader === "maxbudgetgroup") return derivedFields.max_budget_group;

    const value = Object.prototype.hasOwnProperty.call(item, header)
        ? item[header]
        : header.includes(".")
            ? getNestedValue(item, header)
            : undefined;
    if (value === undefined || value === null) return "";
    return typeof value === "object" ? JSON.stringify(value) : value;
}

function useMinimumWhenMaximumIsEmpty(item) {
    const normalizedItem = { ...item };
    const budget = item.budget;

    if (budget && typeof budget === "object" && !Array.isArray(budget)) {
        const maximumIsEmpty = typeof budget.maximum === "string" && budget.maximum.trim() === "";
        if (maximumIsEmpty && budget.minimum !== undefined && budget.minimum !== null && budget.minimum !== "") {
            normalizedItem.budget = { ...budget, maximum: budget.minimum };
        }
        return normalizedItem;
    }

    const maximum = item["budget.maximum"];
    const minimum = item["budget.minimum"];
    if (typeof maximum === "string" && maximum.trim() === ""
        && minimum !== undefined && minimum !== null && minimum !== "") {
        normalizedItem["budget.maximum"] = minimum;
    }

    return normalizedItem;
}

async function saveApiProjects(requestItems) {
    const projects = requestItems.map(item => {
        if (!item || typeof item !== "object" || Array.isArray(item) || !getProjectId(item)) {
            const error = new Error("Each API project must be an object with an id.");
            error.status = 400;
            throw error;
        }
        return useMinimumWhenMaximumIsEmpty(item);
    });

    return withApiProjectsWriteLock(async () => {
        const idColumnIndex = getHeaderIndexByName(globalHeaders_API_Projects, ["id", "project_id", "projectId"]);
        if (idColumnIndex < 0) {
            throw new Error(`The ${API_PROJECTS_SHEET_NAME} sheet needs an id column for duplicate detection.`);
        }

        const idColumn = getColumnLetter_ABD(idColumnIndex);
        const client = await globalAuth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });
        const existingResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: globalSheetId,
            range: `${API_PROJECTS_SHEET_NAME}!${idColumn}2:${idColumn}`,
        });
        const existingIds = new Set((existingResponse.data.values || [])
            .map(row => String(row[0] ?? "").trim())
            .filter(Boolean));

        const batchIds = new Set();
        const newProjects = [];
        let duplicateCount = 0;
        for (const item of projects) {
            const id = getProjectId(item);
            if (existingIds.has(id) || batchIds.has(id)) {
                duplicateCount++;
                continue;
            }
            batchIds.add(id);
            newProjects.push(item);
        }

        if (newProjects.length === 0) {
            return { savedCount: 0, duplicateCount };
        }

        const values = await Promise.all(newProjects.map(async item => {
            const derivedFields = await getApiProjectDerivedFields(item);
            return globalHeaders_API_Projects.map(header =>
                getApiProjectCellValue(item, header, derivedFields)
            );
        }));

        await sheets.spreadsheets.values.append({
            spreadsheetId: globalSheetId,
            range: `${API_PROJECTS_SHEET_NAME}!A1`,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            resource: { values },
        });

        return { savedCount: newProjects.length, duplicateCount };
    });
}
async function appendToSheet(sheetName, sheetHeaders, sheetHeaderIndexes, appendDataArray) {

    appendDataArray = appendDataArray.map(item => {
        for (const key in item) {
            if (item[key] === true) {
                item[key] = "Yes";
            } else if (item[key] === false) {
                item[key] = "No";
            }
        }
        return item;
    });

    //console.log("appendDataArray:", appendDataArray);
    const client = await globalAuth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Arrange data in the correct order
    const values = appendDataArray.map(obj => {
        let row = new Array(sheetHeaders.length).fill(""); // Create an empty array with the length of headers
        for (const key in obj) {
            if (sheetHeaderIndexes.hasOwnProperty(key)) {
                row[sheetHeaderIndexes[key]] = obj[key] ?? "";
            }
        }
        return row;
    });
    //console.log("values:", values);

    return await sheets.spreadsheets.values.append({
        spreadsheetId: globalSheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values },
    });
}

function setSheetValueByAlias(record, headers, aliases, value) {
    const headerIndex = getHeaderIndexByName(headers, aliases);
    if (headerIndex >= 0) {
        record[headers[headerIndex]] = value;
    }
}


/**
 * Converts a number to an Excel-style column letter (0 -> A, 1 -> B, 26 -> AA).
 * @param {number} colIndex The 0-based column index.
 * @returns {string} The Excel column letter (e.g., "A", "B", "AA").
 */
function getColumnLetter_ABD(colIndex) {
    let temp, letter = '';
    // Adjust 0-based index for 1-based calculation (+1), but handled as colIndex >= 0 in logic.
    let num = colIndex + 1;
    while (num > 0) {
        temp = (num - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        num = Math.floor((num - 1) / 26);
    }
    return letter;
}


//////////////////////////////////////////////

let hrefArray = [];
function cloneRemover(appendDataArray) {
    const filteredDataArray = appendDataArray.filter(obj => {
        if (!obj.href || hrefArray.includes(obj.href)) {
            return false; // Remove the object
        } else {
            hrefArray.push(obj.href);
            return true; // Keep the object
        }
    });
    return filteredDataArray;  // Return the new filtered array
}

const HREFARRAYSIZEMAX = 200;
const HREFARRAYSIZE = 100;

const DATAARRAYSIZEMAX = 80;
const DATAARRAYSIZE = 50;

const DETAILTRYCOUNTMAX = 3;
const processedDetailIds = new Set();

function getDetailValue(item, path, fallback = "") {
    const value = path.split(".").reduce((current, key) => current?.[key], item);
    return value === undefined || value === null ? fallback : value;
}

function mapDetailItem(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
    }

    const mappedItem = {
        title: getDetailValue(item, "title"),
        href: getDetailValue(item, "seo_url"),
        ProjectTitle: getDetailValue(item, "title"),
        ProjectBudget: "",
        ProjectType: getDetailValue(item, "type"),
        BudgetCurrencyChar: getDetailValue(item, "currency.sign"),
        BudgetCurrency: getDetailValue(item, "currency.code", getDetailValue(item, "BudgetCurrency")),
        MinBudget: getDetailValue(item, "budget.minimum"),
        MaxBudget: getDetailValue(item, "budget.maximum"),
        ProjectDescription: getDetailValue(item, "description"),
        Location: "",
        Country: "",
        Star: "",
        Member: "",
        MemberDayOld: "",
        Review: "",
        Identity_verified: getDetailValue(item, "owner_info.status.identity_verified"),
        Payment_verified: getDetailValue(item, "owner_info.status.payment_verified"),
        Deposit_made: getDetailValue(item, "owner_info.status.deposit_made"),
        Email_verified: getDetailValue(item, "owner_info.status.email_verified"),
        Profile_completed: getDetailValue(item, "owner_info.status.profile_complete"),
        Phone_verified: getDetailValue(item, "owner_info.status.phone_verified"),
        Prefered: "",
        IPA: "",
        NDA: getDetailValue(item, "upgrades.NDA"),
        Restricted: "",
        Australian: "",
        CategoryName: "",
        CategoryScore: ""
    };

    if (typeof mappedItem.href !== "string" || mappedItem.href.trim() === "") {
        return null;
    }
    mappedItem.href = mappedItem.href.trim();
    return mappedItem;
}

function normalizeProjectHref(href) {
    if (typeof href !== "string") {
        return "";
    }

    let pathname = href.trim();
    try {
        pathname = new URL(pathname, "https://www.freelancer.com").pathname;
    } catch {
        return "";
    }

    return pathname
        .replace(/^\/projects\//i, "/")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase();
}

function deduplicateDetailItems(items) {
    const uniqueItems = [];
    const requestIds = new Set();
    const reservedIds = [];
    let duplicateCount = 0;

    for (const item of items) {
        const id = item && (typeof item.id === "string" || typeof item.id === "number")
            ? String(item.id).trim()
            : "";
        if (id === "") {
            console.warn("Skipping invalid detail item: expected an object with a non-empty id and href.");
            continue;
        }
        if (requestIds.has(id) || processedDetailIds.has(id)) {
            duplicateCount++;
            continue;
        }

        const mappedItem = mapDetailItem(item);
        if (!mappedItem) {
            console.warn("Skipping invalid detail item: expected an object with a non-empty id and href.");
            continue;
        }

        requestIds.add(id);
        processedDetailIds.add(id);
        reservedIds.push(id);
        uniqueItems.push(mappedItem);
    }

    return { uniqueItems, reservedIds, duplicateCount };
}

function cacheCheck() {

    if (hrefArray.length > HREFARRAYSIZEMAX) {
        console.log(`Trimming hrefArray: Original size ${hrefArray.length}, trimming to last ${HREFARRAYSIZE}`);
        hrefArray = hrefArray.slice(-HREFARRAYSIZE);
    }

    if (projectDataArray.length > DATAARRAYSIZEMAX) {
        console.log(`Trimming projectDataArray: Original size ${projectDataArray.length}, trimming to last ${DATAARRAYSIZE}`);
        projectDataArray = projectDataArray.slice(-DATAARRAYSIZE);
    }


    const originalLength = projectDataArray.length;
    // Remove items from projectDataArray if __detailTryCount exceeds DETAILTRYCOUNTMAX
    projectDataArray = projectDataArray.filter(item => {
        return !(item.__detailTryCount && item.__detailTryCount >= DETAILTRYCOUNTMAX);
    }); 
    const filteredLength = projectDataArray.length;
    if (originalLength > filteredLength) {
        console.log(`Filtered projectDataArray: Removed ${originalLength - filteredLength} items.`);
    }
}






async function projectCollector_A(appendDataArray) {
    appendDataArray = cloneRemover(appendDataArray); // Remove duplicates

    appendDataArray.reverse(); // Reverse the array

    

    if (appendDataArray.length === 0) {
        //console.log("No new data to append. hrefArray size:", hrefArray.size);
        return;
    }

    console.log(`+appendDataArray.length:${appendDataArray.length}\t`, `projectDataArray.length:${projectDataArray.length}\t`, `hrefArray.length:${hrefArray.length}`);
//    appendDataArray.forEach(item => {
//        console.log(`\t+ Title: ${item.title},\t Href: ${item.href}`);
//    });

    projectDataArray = projectDataArray.concat(appendDataArray);
}

let projectDataArray=[];

async function projectCollector_B(detailDataArray) {
    for (let i = 0; i < detailDataArray.length; i++) {
        const detailItem = detailDataArray[i];
        const detailHref = normalizeProjectHref(detailItem.href);
        const matchingIndex = projectDataArray.findIndex(existingItem =>
            normalizeProjectHref(existingItem.href) === detailHref
        );
    
        if (matchingIndex !== -1) {
            detailItem.timeStamp = projectDataArray[matchingIndex].timeStamp; // Add timeStamp
            projectDataArray.splice(matchingIndex, 1); // Remove the matching item from projectDataArray
        } else {
            console.warn("Strange Warning Key Error:", detailItem['ProjectTitle'], detailItem.href);
            detailItem.timeStamp = `${getFormatedLocalTime()}`;
        }
    
        //
        detailDataArray[i] = detailItem;
    }
    
    for (let i = 0; i < detailDataArray.length; i++) {
        let detailItem = detailDataArray[i];
        //console.log("before Force_ProjectAnalyser:", detailItem);

        //console.log("After Force_ProjectAnalyser:", detailItem);

        detailItem = projectPlanner_PlanBid(detailItem); // Run projectPlanner_PlanBid on the item
        //console.log("After projectPlanner_PlanBid:", detailItem);

        //console.log("After proposalMaker:", detailItem);

        //console.log("After projectPlanner_Conclusion:", detailItem);

        detailDataArray[i] = detailItem; // 
    }


    console.log(`-detailDataArray.length:${detailDataArray.length}\t`, `projectDataArray.length:${projectDataArray.length}\t`, `hrefArray.length:${hrefArray.length}`);

//    detailDataArray.forEach(item => {
//        console.log(`\t- Title: ${item['ProjectTitle']},\t Href: ${item.href}`);
//    });




    // console.log("sheet name:",PROJECTS_SHEET_NAME);
    // console.log('globalhearders_projects:', globalHeaders_Projects)
    // console.log('globalHeaderIndexes_Projects:', globalHeaderIndexes_Projects);
    // console.log('detaildataArray:',detailDataArray);


}

// Data addition endpoint
app.post("/add", async (req, res) => {
    //console.log("Received data:", req.body);
    try {
        let values = req.body; // Data sent from the extension or test page
        if (!values || !Array.isArray(values)) {
            return res.status(400).json({ error: "Invalid data format" });
        }
        await projectCollector_A(values);
        res.json({ message: "Data added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const HREFPERREQUEST = 1;

async function handleDetailAdd(req, res) {
    try {
        const projects = Array.isArray(req.body)
            ? req.body
            : req.body?.result?.projects ?? req.body?.projects;
        if (!Array.isArray(projects)) {
            return res.status(400).json({
                error: "Invalid data format",
                expected: "An array of projects or an object containing result.projects",
            });
        }

        const { savedCount, duplicateCount } = await saveApiProjects(projects);
        console.log(`API_projects saved: ${savedCount}; duplicates skipped: ${duplicateCount}`);
        for (const item of projects) {
            const href = item && (item.seo_url ?? item.href);
            const matchingIndex = projectDataArray.findIndex(project =>
                normalizeProjectHref(project.href) === normalizeProjectHref(href)
            );
            if (matchingIndex >= 0) {
                projectDataArray.splice(matchingIndex, 1);
            }
        }
        cacheCheck(); // Check cache size

        let lightHrefArray = projectDataArray.slice(-HREFPERREQUEST).map(item => {
            item.__detailTryCount = (item.__detailTryCount || 0) + 1; // Increment __detailTryCount
            return item.href;
        });

        lightHrefArray.reverse();
        //console.log('lightHrefArray:', lightHrefArray);

        res.json(lightHrefArray);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({
            error: error.status === 400 ? error.message : "Internal Server Error",
        });
    }
}

app.post("/add_detail", handleDetailAdd);

export default app;

if (process.env.VERCEL !== "1") {
    ensureInitialized()
        .then(() => app.listen(Number(process.env.PORT) || PORT, () => {
            console.log(`Server running on http://localhost:${Number(process.env.PORT) || PORT}`);
        }))
        .catch(error => {
            console.error("Failed to initialize header indexes:", error);
        });
}

let alarmsData={};

app.post('/alarm', async (req, res) => {
    let alarm = req.body;
    //console.log('alarm posted:', alarm);
    if (!alarm['username'] || alarm['username'].trim() === "" || alarm['username'] === 'unknown') {
        console.error("Error: 'username' error alarm:", alarm.toString());
        return res.status(400).json({ error: "'username' is required" });
    }

    if (!(JSON.stringify(alarmsData[alarm['username']]) === JSON.stringify(alarm))) {
        await updateSheet(alarm);
    }
    

    alarmsData[alarm['username']] = alarm; // Update the alarmsData with the latest alarm
    res.json({ message: "Alarm processed successfully" });
});


/**
 * Adds or updates a row in the specified Google Sheet ("Alarms").
 * Finds the row based on the 'username' key in the input object.
 * If a row with the username exists, it updates the row.
 * If not, it appends a new row.
 * Keys in the alarm object that don't match header columns are ignored.
 *
 * @param {object} alarm - An object representing a row. Keys are column names, values are cell values. Must contain a 'username' key.
 * @returns {Promise<object|null>} A promise that resolves with the result from the Sheets API update/append call, or null if an error occurs.
 */
async function updateSheet(alarm) {
    //console.log('updateSheet:', alarm);
    if (!alarm || typeof alarm !== 'object') {
        console.error("Invalid input: 'alarm' parameter must be an object.");
        return null;
    }
    if (!alarm.username) {
        console.error("Invalid input: 'alarm' object must contain a 'username' key.");
        return null;
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${ALARM_SHEET_NAME}!A:Z`, // Read full range from column A to Z (expand if needed)
            // valueRenderOption: 'UNFORMATTED_VALUE' // Optional: use this if you want raw values
        });
        
        const allRows = dataResponse.data.values || [];
        if (allRows.length === 0) {
            console.error(`Sheet "${ALARM_SHEET_NAME}" is empty.`);
            return null;
        }
        
        // 1. Extract header row from the first row
        const headerRow = allRows[0];
        const headerMap = new Map();
        headerRow.forEach((colName, index) => {
            if (colName) {
                headerMap.set(colName.trim(), index);
            }
        });
        
        // 2. Check if 'username' column exists
        const usernameColIndex = headerMap.get("username");
        if (usernameColIndex === undefined) {
            console.error(`Column "username" not found in the header of sheet "${ALARM_SHEET_NAME}".`);
            return null;
        }
        
        // 3. Find the row index matching the target username
        let targetRowIndex = -1; // Sheet row index (1-based)
        for (let i = 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (row && row.length > usernameColIndex && row[usernameColIndex] === alarm.username) {
                targetRowIndex = i + 1; // +1 because sheet rows are 1-based
                break;
            }
        }
        
        // 4. Create a row of data in the correct column order based on the header
        const outputRow = new Array(headerRow.length).fill('');
        for (const [colName, index] of headerMap.entries()) {
            if (alarm.hasOwnProperty(colName)) {
                outputRow[index] = alarm[colName] !== null && alarm[colName] !== undefined ? alarm[colName] : '';
            }
        }
        
        // 5. Update the existing row or append a new one
        let result;
        if (targetRowIndex > 0) {
            // --- UPDATE existing row ---
            const updateRange = `${ALARM_SHEET_NAME}!A${targetRowIndex}:${String.fromCharCode(65 + headerRow.length - 1)}${targetRowIndex}`;
            console.log(`Updating row ${targetRowIndex} for username: ${alarm.username}`, outputRow);
            result = await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: updateRange,
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: [outputRow],
                },
            });
        } else {
            // --- APPEND new row ---
            const appendRange = `${ALARM_SHEET_NAME}!A:A`; // Appends to the sheet starting from column A
            console.log(`Appending new row for username: ${alarm.username}`, outputRow);
            result = await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: appendRange,
                valueInputOption: "USER_ENTERED",
                insertDataOption: "INSERT_ROWS",
                resource: {
                    values: [outputRow],
                },
            });
        }
        
        return result.data;
        


/**        
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Get Header Row to map column names to indices
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${ALARM_SHEET_NAME}!1:1`, // Read the first row
        });

        const headerRow = headerResponse.data.values ? headerResponse.data.values[0] : [];
        if (!headerRow || headerRow.length === 0) {
            console.error(`Sheet "${ALARM_SHEET_NAME}" is empty or header row could not be read.`);
            return null;
        }

        // Create a map: { columnName: index }
        const headerMap = new Map();
        headerRow.forEach((colName, index) => {
            if (colName) { // Handle potentially empty header cells
                headerMap.set(colName.trim(), index);
            }
        });

        // Check if 'username' column exists
        const usernameColIndex = headerMap.get("username");
        if (usernameColIndex === undefined) {
            console.error(`Column "username" not found in the header of sheet "${ALARM_SHEET_NAME}".`);
            return null;
        }

        // 2. Get all data to find the row with the matching username
        const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${ALARM_SHEET_NAME}!A:${String.fromCharCode(65 + headerRow.length - 1)}`, // Read all data within header bounds
            // valueRenderOption: 'UNFORMATTED_VALUE' // Consider if you need raw values
        });

        const allRows = dataResponse.data.values || [];
        let targetRowIndex = -1; // Sheet row index (1-based)

        // Start searching from the second row (index 1) as first row (index 0) is header
        for (let i = 1; i < allRows.length; i++) {
            const row = allRows[i];
            // Ensure row has enough columns and the username matches
            if (row && row.length > usernameColIndex && row[usernameColIndex] === alarm.username) {
                targetRowIndex = i + 1; // +1 because sheet rows are 1-based
                break;
            }
        }

        // 3. Prepare the data row in the correct order based on the header
        const outputRow = new Array(headerRow.length).fill(''); // Initialize with empty strings
        for (const [colName, index] of headerMap.entries()) {
            if (alarm.hasOwnProperty(colName)) {
                // Handle different data types if necessary, Sheets API usually handles basic ones
                outputRow[index] = alarm[colName] !== null && alarm[colName] !== undefined ? alarm[colName] : '';
            }
            // If alarm doesn't have the key, it remains an empty string (or its default value)
        }

        // 4. Perform Update or Append
        let result;
        if (targetRowIndex > 0) {
            // --- UPDATE existing row ---
            const updateRange = `${ALARM_SHEET_NAME}!A${targetRowIndex}:${String.fromCharCode(65 + headerRow.length - 1)}${targetRowIndex}`;
            console.log(`Updating row ${targetRowIndex} for username: ${alarm.username},${outputRow}`);
            result = await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: updateRange,
                valueInputOption: "USER_ENTERED", // Or 'RAW' if you don't want interpretation
                resource: {
                    values: [outputRow], // Needs to be an array of arrays
                },
            });
            //console.log("Update result:", result.data);

        } else {
            // --- APPEND new row ---
             // Append starting from column A of the sheet
            const appendRange = `${ALARM_SHEET_NAME}!A:A`;
            console.log(`Appending new row for username: ${alarm.username},${outputRow}`);
            result = await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: appendRange, // Specifies the sheet/table to append to
                valueInputOption: "USER_ENTERED", // Or 'RAW'
                insertDataOption: "INSERT_ROWS", // Important: inserts new rows
                resource: {
                    values: [outputRow], // Needs to be an array of arrays
                },
            });
            //console.log("Append result:", result.data);
        }

        return result.data; // Return the response data from the API
**/
    } catch (err) {
        console.error("Error interacting with Google Sheets API:", err.message);
        // Log more details if available, e.g., err.response?.data
        if (err.response && err.response.data && err.response.data.error) {
             console.error("API Error Details:", JSON.stringify(err.response.data.error, null, 2));
        } else if (err.errors) {
             console.error("API Error Array:", JSON.stringify(err.errors, null, 2));
        }
        return null; // Indicate failure
    }
}





///////////////////////////////////Auto Bidder
const reservedProjectsByUser = new Map();
const RESERVATION_TTL_MS = 10 * 60 * 1000;

function reserveProject(username, projectIdentity) {
    const now = Date.now();
    let reservations = reservedProjectsByUser.get(username);
    if (!reservations) {
        reservations = new Map();
        reservedProjectsByUser.set(username, reservations);
    }

    for (const [identity, reservedAt] of reservations) {
        if (now - reservedAt > RESERVATION_TTL_MS) {
            reservations.delete(identity);
        }
    }
    if (reservations.has(projectIdentity)) return false;

    reservations.set(projectIdentity, now);
    return true;
}

function releaseProject(username, projectIdentity) {
    const reservations = reservedProjectsByUser.get(username);
    if (!reservations) return;
    reservations.delete(projectIdentity);
    if (reservations.size === 0) {
        reservedProjectsByUser.delete(username);
    }
}

function isPlanBidCandidate(project) {
    const planBidValue = project?.plan_bid ?? project?.PlanBid ?? project?.planBid ?? "";
    return String(planBidValue).trim().toLowerCase() === "good";
}

function isGoodConclusion(project) {
    const conclusionValue = project?.Conclusion ?? project?.conclusion ?? "";
    const normalized = String(conclusionValue).trim().toLowerCase();
    return conclusionValue === true || normalized === "good" || normalized === "yes" || normalized === "true";
}

function createProfileFilter(script, username) {
    if (!script) {
        const error = new Error(`The profile for username "${username}" has no script filter.`);
        error.status = 422;
        throw error;
    }

    try {
        const instrumentedScript = script.replace(/\breturn\s+false\s*;?/g, (statement, offset) => {
            const lineNumber = script.slice(0, offset).split("\n").length;
            const lineStart = script.lastIndexOf("\n", offset - 1) + 1;
            const lineEnd = script.indexOf("\n", offset);
            const sourceLine = script.slice(lineStart, lineEnd < 0 ? script.length : lineEnd).trim();
            const sameLineCondition = sourceLine.match(/\bif\s*\((.*)\)\s*\{?\s*return\s+false\b/);
            let condition = sameLineCondition?.[1]?.trim();

            if (!condition) {
                const precedingLines = script.slice(0, lineStart).split("\n").slice(-5).reverse();
                const precedingCondition = precedingLines
                    .map(line => line.trim())
                    .find(line => /\bif\s*\(.+\)\s*\{?\s*$/.test(line));
                condition = precedingCondition?.match(/\bif\s*\((.*)\)/)?.[1]?.trim();
            }

            const reason = condition
                ? `return false at script line ${lineNumber}; condition: ${condition}`
                : `return false at script line ${lineNumber}: ${sourceLine}`;
            return `return { __profileFilterFailure: true, reason: ${JSON.stringify(reason)} };`;
        });
        return new Function("project", `"use strict";\n${instrumentedScript}`);
    } catch (error) {
        throw new Error(`Invalid profile script filter for username "${username}": ${error.message}`);
    }
}

function filterResultIsEntirelyFalse(result) {
    if (result?.__profileFilterFailure === true) return true;
    if (result === false) return true;
    if (result === null || typeof result !== "object") return false;

    const values = Object.values(result);
    return values.length > 0 && values.every(filterResultIsEntirelyFalse);
}

function getFilterResultReason(result, rejected) {
    if (result?.__profileFilterFailure === true && typeof result.reason === "string") {
        return result.reason;
    }
    if (result && typeof result === "object" && !Array.isArray(result)
        && typeof result.reason === "string" && result.reason.trim() !== "") {
        return result.reason.trim();
    }
    return rejected
        ? "The script returned only false values."
        : "The script result was not entirely composed of false values.";
}

async function selectProject_ABD(userInfo) {
    const username = String(userInfo.username ?? "").trim();
    if (!username) {
        const error = new Error("username is required.");
        error.status = 400;
        throw error;
    }
    const profile = await getUserProfile(username);
    const profileFilter = createProfileFilter(profile.script, username);
    const [projectRows, bidEvents] = await Promise.all([
        readSheetRows(API_PROJECTS_SHEET_NAME, globalHeaders_API_Projects),
        readSheetRows(EVENTS_SHEET_NAME, globalHeaders_Events),
    ]);
    const recentProjectRows = projectRows
        .slice(-25)
        .reverse();

    for (const projectRow of recentProjectRows) {
        const project = mapApiProjectRow(projectRow);
        if (!project.id || !project.href || !isPlanBidCandidate(project)) continue;
        if (bidEvents.some(event => hasUserAttemptedBid(event, username, project))) continue;

        const projectIdentity = getProjectIdentity(project);
        if (!reserveProject(normalizeUsername(username), projectIdentity)) continue;

        try {
            const proposal = await proposalMaker(
                project,
                undefined,
                profile.aboutMe,
                profile.category,
                profile.geminiApiKey
            );
            const conclusionInput = projectPlanner_Conclusion(proposal);

            if (!isGoodConclusion(conclusionInput)) {
                releaseProject(normalizeUsername(username), projectIdentity);
                continue;
            }
            const filterResult = profileFilter(conclusionInput);
            const filterRejected = filterResultIsEntirelyFalse(filterResult);
            const filterPassed = !filterRejected;
            const filterReason = getFilterResultReason(filterResult, filterRejected);
            console.log(`Profile script filter ${filterPassed ? "passed" : "rejected"} project ${project.id}:`, {
                result: filterResult,
                reason: filterReason,
            });
            if (!filterPassed) {
                releaseProject(normalizeUsername(username), projectIdentity);
                continue;
            }
            if (!proposal || typeof proposal.ProposalText !== "string" || proposal.ProposalText.trim() === "") {
                throw new Error(`Gemini returned no proposal text for project ${project.id}.`);
            }
            if (proposal.ProposalBudget === undefined || proposal.ProposalTime === undefined) {
                throw new Error(`Gemini returned an incomplete proposal for project ${project.id}.`);
            }
            proposal.username = username;
            return proposal;
        } catch (error) {
            releaseProject(normalizeUsername(username), projectIdentity);
            throw error;
        }
    }
    return null;
}





// Data addition endpoint
app.post("/bid_result", async (req, res) => {
    try {
        const body = req.body;
        const username = String(body?.username ?? "").trim();
        const projectId = String(body?.project_id ?? body?.projectId ?? body?.id ?? "").trim();
        const href = String(body?.href ?? "").trim();
        const bid = body?.bid ?? body?.ProposalText;
        const status = body?.result ?? body?.status;

        if (!username || (!projectId && !href) || typeof bid !== "string" || bid.trim() === "" || status === undefined) {
            return res.status(400).json({
                error: "username, project_id or href, bid proposal text, and result/status are required.",
            });
        }

        const event = { ...body };
        setSheetValueByAlias(event, globalHeaders_Events, ["username"], username);
        setSheetValueByAlias(event, globalHeaders_Events, ["project_id", "projectId", "projectid"], projectId);
        setSheetValueByAlias(event, globalHeaders_Events, ["href", "url"], href);
        setSheetValueByAlias(event, globalHeaders_Events, ["bid"], bid);
        setSheetValueByAlias(event, globalHeaders_Events, ["result", "status", "bid_status"], status);
        const appendResult = await appendToSheet(
            EVENTS_SHEET_NAME,
            globalHeaders_Events,
            globalHeaderIndexes_Events,
            [event]
        );
        releaseProject(normalizeUsername(username), projectId || normalizeProjectHref(href));
        res.json({ ok: true, result: appendResult });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || "Could not store bid result." });
    }
});


// Data addition endpoint
app.post("/need_project", async (req, res) => {
    try {
        const body = req.body;
        const username = String(body?.username ?? "").trim();
        if (!username) {
            return res.status(400).json({ error: "username is required." });
        }
        const userInfo = {
            ...body,
            username,
        };
        const selected_project = await selectProject_ABD(userInfo);

        if (selected_project) {
            console.log(`Selected API project ${selected_project.id} for username ${username}: ${selected_project.ProjectTitle}`);
        }
        res.json(selected_project);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message || "Could not select a project." });
    }
});
