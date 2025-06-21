import { useEffect, useRef } from 'react';

type KeyboardShortcut = {
    keys: string[];
    callback: () => void;
    description?: string;
}

type UseKeyboardShortcutsOptions = {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
}

/**
 * Generic keyboard shortcuts hook that handles multiple key combinations
 * Uses capture phase to intercept key events before other components can handle them
 *
 * Example usage:
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { keys: ['Meta', 'Enter'], callback: () => doSomething() },
 *     { keys: ['Meta', 'Shift', 'Enter'], callback: () => doSomethingElse() }
 *   ]
 * });
 */
const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
    const shortcutsRef = useRef(shortcuts);

    // Keep shortcuts ref up to date
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        if (!enabled || shortcuts.length === 0) return;

        const pressedKeys = new Set<string>();
        let keySequenceListeners: Map<string, (event: KeyboardEvent) => void> = new Map();

        const normalizeKey = (key: string): string => {
            // Normalize key names for cross-platform compatibility
            const keyMap: { [key: string]: string } = {
                'Meta': 'Meta',
                'Cmd': 'Meta',
                'Command': 'Meta',
                'Control': 'Control',
                'Ctrl': 'Control',
                'Shift': 'Shift',
                'Alt': 'Alt',
                'Option': 'Alt'
            };
            return keyMap[key] || key;
        };

        const getShortcutKey = (keys: string[]): string => {
            return keys.map(normalizeKey).sort().join('+');
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const normalizedKey = normalizeKey(event.key);
            pressedKeys.add(normalizedKey);

            // Check if any shortcut matches the currently pressed keys
            shortcutsRef.current.forEach(shortcut => {
                const requiredKeys = shortcut.keys.map(normalizeKey);
                const shortcutKey = getShortcutKey(requiredKeys);

                // Check if all required keys are pressed
                const allKeysPressed = requiredKeys.every(key => pressedKeys.has(key));

                if (allKeysPressed && requiredKeys.length === pressedKeys.size) {
                    // Set up a listener for the final key (usually Enter)
                    const finalKey = requiredKeys[requiredKeys.length - 1];

                    if (finalKey === 'Enter' && event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        shortcut.callback();
                        return;
                    }

                    // For non-Enter final keys, execute immediately
                    if (finalKey !== 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        shortcut.callback();
                        return;
                    }
                }
            });

            // Set up Enter key listener when modifier keys are pressed
            if ((pressedKeys.has('Meta') || pressedKeys.has('Control')) && !keySequenceListeners.has('Enter')) {
                const enterListener = (enterEvent: KeyboardEvent) => {
                    if (enterEvent.key === 'Enter') {
                        const currentKeys = new Set(pressedKeys);
                        currentKeys.add('Enter');

                        // Find matching shortcut
                        const matchingShortcut = shortcutsRef.current.find(shortcut => {
                            const requiredKeys = shortcut.keys.map(normalizeKey);
                            return requiredKeys.every(key => currentKeys.has(key)) &&
                                requiredKeys.length === currentKeys.size;
                        });

                        if (matchingShortcut) {
                            enterEvent.preventDefault();
                            enterEvent.stopPropagation();
                            matchingShortcut.callback();

                            // Clean up enter listener
                            document.removeEventListener('keydown', enterListener, true);
                            keySequenceListeners.delete('Enter');
                        }
                    }
                };

                document.addEventListener('keydown', enterListener, true);
                keySequenceListeners.set('Enter', enterListener);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const normalizedKey = normalizeKey(event.key);
            pressedKeys.delete(normalizedKey);

            // Clean up Enter listener when modifier keys are released
            if ((normalizedKey === 'Meta' || normalizedKey === 'Control') && keySequenceListeners.has('Enter')) {
                const enterListener = keySequenceListeners.get('Enter');
                if (enterListener) {
                    document.removeEventListener('keydown', enterListener, true);
                    keySequenceListeners.delete('Enter');
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);

            // Clean up any remaining listeners
            keySequenceListeners.forEach((listener) => {
                document.removeEventListener('keydown', listener, true);
            });
            keySequenceListeners.clear();
        };
    }, [enabled, shortcuts.length]);
};

export default useKeyboardShortcuts;
