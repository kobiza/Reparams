import { useEffect, useRef } from 'react';

type CommandShortcut = {
    keys: string[];
    callback: () => void;
    description?: string;
}

type UseCommandShortcutsOptions = {
    shortcuts: CommandShortcut[];
    enabled?: boolean;
}

/**
 * Clean keyboard shortcuts hook using "Command mode" approach
 * When Command is pressed, intercepts all subsequent keys to prevent conflicts
 * with other event handlers (like autocomplete)
 *
 * Example usage:
 * useCommandShortcuts({
 *   shortcuts: [
 *     { keys: ['Meta', 'Enter'], callback: () => doSomething() },
 *     { keys: ['Meta', 'Shift', 'Enter'], callback: () => doSomethingElse() }
 *   ]
 * });
 */
const useCommandShortcuts = ({ shortcuts, enabled = true }: UseCommandShortcutsOptions) => {
    const shortcutsRef = useRef(shortcuts);

    // Keep shortcuts ref up to date
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        if (!enabled || shortcuts.length === 0) return;

        let isCommandPressed = false;
        const pressedKeys = new Set<string>();

        const normalizeKey = (key: string): string => {
            // Normalize key names for cross-platform compatibility
            const keyMap: { [key: string]: string } = {
                'Meta': 'Meta',
                'Command': 'Meta',
                'Cmd': 'Meta',
                'Control': 'Control',
                'Ctrl': 'Control',
                'Shift': 'Shift',
                'Alt': 'Alt',
                'Option': 'Alt'
            };
            return keyMap[key] || key;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const normalizedKey = normalizeKey(event.key);

            // Track Command key state
            if (normalizedKey === 'Meta' || normalizedKey === 'Control') {
                isCommandPressed = true;
                pressedKeys.add(normalizedKey);
                return;
            }

            // Only intercept Enter when Command is pressed (to prevent autocomplete conflicts)
            if (isCommandPressed && normalizedKey === 'Enter') {
                event.preventDefault();
                event.stopPropagation();

                // Add Enter to pressed keys
                pressedKeys.add(normalizedKey);

                // Check if current combination matches any shortcut
                const matchingShortcut = shortcutsRef.current.find(shortcut => {
                    const requiredKeys = shortcut.keys.map(normalizeKey);
                    return requiredKeys.length === pressedKeys.size &&
                        requiredKeys.every(key => pressedKeys.has(key));
                });

                if (matchingShortcut) {
                    matchingShortcut.callback();
                }
            } else if (isCommandPressed) {
                // For non-Enter keys when Command is pressed, just track them
                // but don't prevent default (allows Cmd+C, Cmd+V, etc. to work)
                pressedKeys.add(normalizedKey);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const normalizedKey = normalizeKey(event.key);

            // Reset when Command is released
            if (normalizedKey === 'Meta' || normalizedKey === 'Control') {
                isCommandPressed = false;
                pressedKeys.clear();
            } else {
                // Remove other keys when released
                pressedKeys.delete(normalizedKey);
            }
        };

        // Use capture phase to intercept before other handlers
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', handleKeyUp, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [enabled, shortcuts.length]);
};

export default useCommandShortcuts;
