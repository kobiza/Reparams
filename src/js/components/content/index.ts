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



const checkDomSelector = (domSelector: string) => {
    const result = !!document.querySelector(domSelector)
    return result

}
// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: DomSelectorRequestMessage) => {
    if (message.type === 'DOM_SELECTOR_REQUEST') {
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
        chrome.runtime.sendMessage(response);
    }
});

// Add your content script logic here
document.addEventListener('DOMContentLoaded', () => {
    // Your content script initialization code
});
