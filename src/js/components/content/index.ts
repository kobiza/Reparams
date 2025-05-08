// Content script entry point
console.log('Content script loaded');

type CheckCommonConfigMessage = {
    type: 'CHECK_COMMON_CONFIG';
}

type CommonConfigMessage = {
    type: 'COMMON_CONFIG_STATUS';
    isCommonConfigExist: boolean;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: CheckCommonConfigMessage) => {
    if (message.type === 'CHECK_COMMON_CONFIG') {
        // Check if commonConfig exists in the window object
        const isCommonConfigExist = !!(window as any).commonConfig;

        // Send response back to popup
        const response: CommonConfigMessage = {
            type: 'COMMON_CONFIG_STATUS',
            isCommonConfigExist
        };
        chrome.runtime.sendMessage(response);
    }
});

// Add your content script logic here
document.addEventListener('DOMContentLoaded', () => {
    // Your content script initialization code
});
