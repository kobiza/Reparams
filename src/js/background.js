chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && tab.id) {
                chrome.action.openPopup();
            }
        });
    }
});
