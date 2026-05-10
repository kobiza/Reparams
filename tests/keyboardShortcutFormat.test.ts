describe('keyboardShortcutFormat — Mac', () => {
    let formatShortcut: (keys: string[]) => string
    let isMac: boolean

    beforeEach(() => {
        Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
        jest.isolateModules(() => {
            const mod = require('../src/js/utils/keyboardShortcutFormat')
            formatShortcut = mod.formatShortcut
            isMac = mod.isMac
        })
    })

    test('isMac is true on a Mac platform', () => {
        expect(isMac).toBe(true)
    })

    test('Mod+Enter renders as ⌘+Enter', () => {
        expect(formatShortcut(['Mod', 'Enter'])).toBe('⌘+Enter')
    })

    test('Mod+Shift+Enter renders as ⌘+⇧+Enter', () => {
        expect(formatShortcut(['Mod', 'Shift', 'Enter'])).toBe('⌘+⇧+Enter')
    })

    test('Mod+Backspace renders as ⌘+Backspace', () => {
        expect(formatShortcut(['Mod', 'Backspace'])).toBe('⌘+Backspace')
    })

    test('unrecognized token passes through unchanged', () => {
        expect(formatShortcut(['Mod', 'K'])).toBe('⌘+K')
    })
})

describe('keyboardShortcutFormat — Windows/Linux', () => {
    let formatShortcut: (keys: string[]) => string
    let isMac: boolean

    beforeEach(() => {
        Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
        jest.isolateModules(() => {
            const mod = require('../src/js/utils/keyboardShortcutFormat')
            formatShortcut = mod.formatShortcut
            isMac = mod.isMac
        })
    })

    test('isMac is false on a non-Mac platform', () => {
        expect(isMac).toBe(false)
    })

    test('Mod+Enter renders as Ctrl+Enter', () => {
        expect(formatShortcut(['Mod', 'Enter'])).toBe('Ctrl+Enter')
    })

    test('Mod+Shift+Enter renders as Ctrl+Shift+Enter', () => {
        expect(formatShortcut(['Mod', 'Shift', 'Enter'])).toBe('Ctrl+Shift+Enter')
    })

    test('Mod+Backspace renders as Ctrl+Backspace', () => {
        expect(formatShortcut(['Mod', 'Backspace'])).toBe('Ctrl+Backspace')
    })

    test('unrecognized token passes through unchanged', () => {
        expect(formatShortcut(['Mod', 'K'])).toBe('Ctrl+K')
    })
})
