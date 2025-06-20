import { useEffect, useRef } from 'react';

type UseCommandEnterShortcutOptions = {
    onCommandEnter: () => void;
    enabled?: boolean;
}

/**
 * Custom hook that handles Command+Enter keyboard shortcut
 * Sets up a capture-phase listener when Command is pressed to intercept Enter
 * before other components (like autocomplete) can handle it
 */
const useCommandEnterShortcut = ({ onCommandEnter, enabled = true }: UseCommandEnterShortcutOptions) => {
    const callbackRef = useRef(onCommandEnter);

    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = onCommandEnter;
    }, [onCommandEnter]);

    useEffect(() => {
        if (!enabled) return;

        let enterListener: ((event: KeyboardEvent) => void) | null = null;

        const handleCommandKeyDown = (event: KeyboardEvent) => {
            // Detect Command key press (Meta key on Mac, Ctrl on Windows/Linux)
            if (event.key === 'Meta' || (event.key === 'Control' && !event.metaKey)) {
                // Set up Enter listener in capture phase when Command/Ctrl is pressed
                enterListener = (enterEvent: KeyboardEvent) => {
                    if (enterEvent.key === 'Enter') {
                        enterEvent.preventDefault();
                        enterEvent.stopPropagation();
                        callbackRef.current();

                        // Clean up the enter listener immediately after use
                        if (enterListener) {
                            document.removeEventListener('keydown', enterListener, true);
                            enterListener = null;
                        }
                    }
                };

                // Add Enter listener in capture phase to intercept before other handlers
                document.addEventListener('keydown', enterListener, true);
            }
        };

        const handleCommandKeyUp = (event: KeyboardEvent) => {
            // Clean up Enter listener when Command/Ctrl is released
            if (event.key === 'Meta' || event.key === 'Control') {
                if (enterListener) {
                    document.removeEventListener('keydown', enterListener, true);
                    enterListener = null;
                }
            }
        };

        document.addEventListener('keydown', handleCommandKeyDown);
        document.addEventListener('keyup', handleCommandKeyUp);

        return () => {
            document.removeEventListener('keydown', handleCommandKeyDown);
            document.removeEventListener('keyup', handleCommandKeyUp);
            // Clean up any remaining Enter listener
            if (enterListener) {
                document.removeEventListener('keydown', enterListener, true);
            }
        };
    }, [enabled]);
};

export default useCommandEnterShortcut;
