import type { DomSelectorRequestMessage, DomSelectorResultMessage } from '../../types/types';

// Custom get function similar to lodash.get
function get(obj: any, path: string, defaultValue: any) {
    // Convert the path to an array if it's not already.
    const pathArray = path.split(".");

    // Reduce over the path array to find the nested value.
    const result = pathArray.reduce((acc, key) => acc && acc[key], obj);

    // Return the resolved value or the default value if undefined.
    return result === undefined ? defaultValue : result;
}

function isUndefined(value: any) {
    return typeof value === 'undefined'
}


// Content script entry point
console.log('Content script loaded');

// // Inject a script into the page context to access window.commonConfig
// const injectedScript = document.createElement('script');
// injectedScript.textContent = `
//   (function() {
//     window.postMessage({
//       source: 'reparams-extension',
//       commonConfig: window.commonConfig
//     }, '*');
//   })();
// `;
// (document.head || document.documentElement).appendChild(injectedScript);
// injectedScript.remove();

// let pageCommonConfig: any = undefined;

// // Listen for the message from the injected script
// window.addEventListener('message', (event) => {
//     if (event.source !== window) return;
//     if (event.data && event.data.source === 'reparams-extension') {
//         pageCommonConfig = event.data.commonConfig;
//         console.log('Received commonConfig from page:', pageCommonConfig);
//     }
// });

const checkDomSelector = (domSelector: string) => {
    const result = !!document.querySelector(domSelector)
    console.log('checkDomSelector', domSelector, result)
    return result

}
// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: DomSelectorRequestMessage) => {
    console.log('onMessage', message)
    if (message.type === 'DOM_SELECTOR_REQUEST') {
        console.log('DOM_SELECTOR_REQUEST', message)
        // Check if commonConfig exists in the window object
        const domSelectorResult = message.domSelectors.reduce<Record<string, boolean>>((acc, curr) => {
            acc[curr] = checkDomSelector(curr)
            return acc
        }, {})

        // Send response back to popup
        const response: DomSelectorResultMessage = {
            type: 'DOM_SELECTOR_RESULT',
            domSelectorResult
        };
        console.log('send DOM_SELECTOR_RESULT', response)
        chrome.runtime.sendMessage(response);
    }
});

// Add your content script logic here
document.addEventListener('DOMContentLoaded', () => {
    // Your content script initialization code
});
