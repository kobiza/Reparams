const detectIsMac = (): boolean => {
    if (typeof navigator === 'undefined') return false
    const probe = navigator.platform || navigator.userAgent || ''
    return /Mac|iPhone|iPad|iPod/i.test(probe)
}

export const isMac = detectIsMac()

const macLabels: Record<string, string> = {
    Mod: '⌘',
    Shift: '⇧',
    Alt: '⌥',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Escape: 'Esc',
}

const winLabels: Record<string, string> = {
    Mod: 'Ctrl',
    Shift: 'Shift',
    Alt: 'Alt',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Escape: 'Esc',
}

export const getShortcutTokens = (keys: string[]): string[] => {
    const table = isMac ? macLabels : winLabels
    return keys.map(k => table[k] ?? k)
}

export const formatShortcut = (keys: string[]): string => {
    return getShortcutTokens(keys).join('+')
}
