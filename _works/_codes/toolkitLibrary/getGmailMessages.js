import { google } from 'googleapis';
import fetch from 'node-fetch';

// Global variable to store accessToken
global.accessToken = null;

// spartacusaudix@gmail.com
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

export default async function listMessages(sinceDate, sender) { // sender parameter is optional, can be undefined
    let currentAccessToken = global.accessToken;
    let messages = [];

    const sinceTime = Math.floor(sinceDate.getTime() / 1000);
    let query = `after:${sinceTime}`;
    if (sender) {
        query += ` from:${sender}`;
    }

    try {
        // Create Gmail API client (moved inside try block)
        const gmail = google.gmail({ version: 'v1', headers: { Authorization: `Bearer ${currentAccessToken}` } });

        const res = await gmail.users.messages.list({ userId: 'me', q: query });

        if (!res.data.messages) {
            console.log('_No messages found from sender:', sender || 'any', 'since:', sinceDate);
            return [];
        }

        console.log(`_Found ${res.data.messages.length} messages from sender:`, sender || 'any');
        for (const message of res.data.messages) {
            const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });
            // console.log(`Snippet: ${msg.data.snippet}`);
            messages.push({ id: message.id, snippet: msg.data.snippet });
        }
        return messages;

    } catch (error) {
        if (error.code === 401) {
            // Access token expired, refresh and 
            console.log('_Access token expired. Refreshing...');
            const newAccessToken = await refreshAccessToken();
            if (!newAccessToken) {
                throw new Error('_Token refresh failed.');
            }
            global.accessToken = newAccessToken; // Update global accessToken

            // Re-create Gmail API client with the new access token
            const gmail = google.gmail({ version: 'v1', headers: { Authorization: `Bearer ${newAccessToken}` } });

            console.log('_ing with new access token...');
            return listMessages(sinceDate, sender); // Recursive call with sender

        } else {
            console.error('_Gmail API Error:', error);
            throw error;
        }
    }
}

async function refreshAccessToken() {
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are required.');
    }
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const requestBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    // **Logging for debugging - You can remove these after successful execution**
    console.log("_--- Refresh Token Request ---");
    console.log("_Token Endpoint URL:", tokenEndpoint);
    console.log("_Request Method:", 'POST');
    console.log("_Request Headers:", { 'Content-Type': 'application/x-www-form-urlencoded' });

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            body: requestBody,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const data = await response.json();

        if (data.error) {
            console.error('_Token Refresh Error:', data.error_description || data.error);
            return null; // Token refresh failed
        }

        console.log('_New Access Token acquired.');
        return data.access_token; // Return only the new access token string

    } catch (error) {
        console.error('_Fetch Error during token refresh:', error);
        return null; // Token refresh failed
    }
}