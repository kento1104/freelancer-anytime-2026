import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';


const browser_StartBrowser = async () => {
    chromium.use(stealthPlugin());
    const browser = await chromium.launch({ headless: false, args: ['--font-render-hinting=none'] });
    return browser;
};

//        const browser_StartContext = async () => {
//            const context= await global.Browser.newContext({
//                //viewport: { width: 1280, height: 800 }, // Set the viewport size
//            });
//            return context;
//        };
//
        const browser_StartContext = async () => {
            // Free proxy settings
            const proxy = {
                server: 'http://176.100.77.118:3629',  // Example free proxy server address
                // If authentication is not required, username and password can be omitted
                username: '',  // Leave empty if no authentication is needed
                password: '',  // Leave empty if no authentication is needed
            };

            // Create a new context with proxy settings
    //        const context = await global.Browser.newContext({
    //        //    viewport: { width: 1280, height: 800 }, // Set the viewport size
    //        //    proxy: {
    //        //        server: proxy.server, // Set the proxy server
    //        //        username: proxy.username,  // If authentication is needed
    //        //        password: proxy.password,  // If authentication is needed
    //        //    },
    //        });






///////////////-------------------------


let context = await global.Browser.newContext({
    // User-Agent 설정
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",

    // 헤더 설정
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://example.com",
    },

    // 언어 및 시간대 설정
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  // WebGL 및 Canvas 지문 조작 (초기화 스크립트 추가)
  await context.addInitScript(() => {
    // WebGL 지문 조작
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return "Intel Open Source Technology Center";
      }
      if (parameter === 37446) {
        return "Mesa DRI Intel(R) Ivybridge Mobile";
      }
      return originalGetParameter.call(this, parameter);
    };

    // Canvas 지문 조작
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
      const dataURL = originalToDataURL.call(this, type, quality);
      return dataURL.replace(/[a-zA-Z0-9+/=]{32,}/, "RANDOM_STRING");
    };
  });



///////////////-------------------------


















            return context;
        };


const browser_StartPage = async () => {
    const currentPage = await global.BrowserMainContext.newPage();

    // Navigate to the Slack page
    //console.log(`Loading cookies from: ${global.State.account_info.cookieFilePath}`); // Log to confirm the path
    //const cookieData = await fs.readFile(global.State.account_info.cookieFilePath, 'utf8'); // Read the file content as a string
    //const cookies = JSON.parse(cookieData); // Parse the JSON string into a JavaScript object
    //await global.BrowserMainContext.addCookies(cookies);
    //console.log('Cookies added successfully!');
    console.log('Starting the browser.');

    return currentPage;
};

// Function to stop the browser
const browser_stop = async (browser) => {
    if (browser) {
        await browser.close();
        console.log('Stopping the browser.');
        return true;
    } else {
        console.log('The browser is not running.');
        return false;
    }
};

const browser_GoToPage = async (currentPage,targetUrl, timeout=30000 ) => {
    try {
        await currentPage.goto(targetUrl, { timeout });
    } catch (error) {
        console.log(`Error occurred while navigating to the page: ${error.message}`);
        return false;
    }
    console.log(`Navigating to ${targetUrl}.`);
    await browser_WaitForLoad(currentPage);
    return true;
};

const browser_WaitForLoad = async (currentPage) => {
    //await currentPage.waitForLoadState('networkidle');
    await Promise.race([
        currentPage.waitForLoadState('networkidle').catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 3000))
    ]);

    // Wait until the browser's loading icon stops.
    await currentPage.waitForFunction(() => document.readyState === 'complete', { timeout: 100000 });
    // Wait until additional JavaScript execution is finished.
    await currentPage.evaluate(() => new Promise(resolve => requestIdleCallback(resolve)));
    // Wait an additional 3 seconds (to ensure asynchronous JS execution is complete)
    await currentPage.waitForTimeout(3000);
};


export {
    browser_StartBrowser,
    browser_StartContext,
    browser_StartPage,
    browser_stop,
    browser_GoToPage, 
    browser_WaitForLoad, 
}














