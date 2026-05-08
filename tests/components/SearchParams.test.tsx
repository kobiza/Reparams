/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchParams from '../../src/js/components/common/SearchParams'
import { ParamSuggestions, SearchParamsEntries } from '../../src/js/types/types'

beforeEach(() => {
    document.execCommand = jest.fn()
})

function firePaste(element: Element, text: string) {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
        value: { getData: jest.fn(() => text) },
        configurable: true,
    })
    fireEvent(element, event)
}

function setup(entries: SearchParamsEntries = [['key1', '']]) {
    const setEntries = jest.fn()
    render(
        <SearchParams
            entries={entries}
            setEntries={setEntries}
            paramsWithDelimiter={{}}
        />
    )
    const inputs = screen.getAllByRole('textbox')
    return { setEntries, keyInput: inputs[0], valueInput: inputs[1] }
}

describe('SearchParams paste handling', () => {
    test('decodes encoded value and inserts via execCommand', () => {
        const { valueInput } = setup()
        firePaste(valueInput, 'John%20Doe')
        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'John Doe')
    })

    test('decodes encoded key and inserts via execCommand', () => {
        const { keyInput } = setup([['', 'value1']])
        firePaste(keyInput, 'my%20key')
        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'my key')
    })

    test('plain text paste does not intercept — execCommand is not called', () => {
        const { valueInput } = setup()
        firePaste(valueInput, 'hello')
        expect(document.execCommand).not.toHaveBeenCalled()
    })

    test('malformed percent sequence does not intercept — execCommand is not called', () => {
        const { valueInput } = setup()
        expect(() => firePaste(valueInput, 'bad%ZZcode')).not.toThrow()
        expect(document.execCommand).not.toHaveBeenCalled()
    })
})

describe('quick-paste', () => {
    test('single key=value on empty row fills that row', () => {
        const { setEntries, keyInput } = setup([['', '']])
        firePaste(keyInput, 'key1=v1')
        expect(setEntries).toHaveBeenCalledWith([['key1', 'v1']])
    })

    test('multi key=value on empty row replaces row and appends extras', () => {
        const { setEntries, keyInput } = setup([['', '']])
        firePaste(keyInput, 'key1=v1&key2=v2')
        expect(setEntries).toHaveBeenCalledWith([['key1', 'v1'], ['key2', 'v2']])
    })

    test('existing rows before the empty row are preserved', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['existing', 'row'], ['', '']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const inputs = screen.getAllByRole('textbox')
        const emptyRowKeyInput = inputs[2] // 3rd input = key of 2nd row
        firePaste(emptyRowKeyInput, 'newkey=newval')
        expect(setEntries).toHaveBeenCalledWith([['existing', 'row'], ['newkey', 'newval']])
    })

    test('paste on non-empty row (key present) does not trigger quick-paste', () => {
        const { setEntries, keyInput } = setup([['existingKey', '']])
        firePaste(keyInput, 'key1=v1')
        expect(setEntries).not.toHaveBeenCalled()
    })

    test('paste on row where value is non-empty does not trigger quick-paste', () => {
        const { setEntries, keyInput } = setup([['', 'existingValue']])
        firePaste(keyInput, 'key1=v1')
        expect(setEntries).not.toHaveBeenCalled()
    })
})

describe('SearchParams autocomplete mode', () => {
    function setupWithSuggestions(entries: SearchParamsEntries, suggestions: ParamSuggestions) {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={entries}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
                suggestions={suggestions}
            />
        )
        return { setEntries }
    }

    test('renders combobox inputs when suggestions prop is provided', () => {
        setupWithSuggestions([['', '']], { keys: [], valuesByKey: {} })
        const comboboxes = screen.getAllByRole('combobox')
        expect(comboboxes.length).toBeGreaterThanOrEqual(2)
    })

    test('typing in key input calls setEntries with new key', () => {
        const { setEntries } = setupWithSuggestions(
            [['', '']],
            { keys: ['foo'], valuesByKey: {} }
        )
        const comboboxes = screen.getAllByRole('combobox')
        const keyInput = comboboxes[0]
        fireEvent.change(keyInput, { target: { value: 'foo' } })
        expect(setEntries).toHaveBeenCalledWith([['foo', '']])
    })

    test('value combobox lists values for current row key', () => {
        setupWithSuggestions(
            [['lang', '']],
            { keys: ['lang'], valuesByKey: { lang: ['en', 'fr'] } }
        )
        const comboboxes = screen.getAllByRole('combobox')
        const valueInput = comboboxes[1]
        fireEvent.mouseDown(valueInput)
        expect(screen.getByRole('option', { name: 'en' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'fr' })).toBeInTheDocument()
    })

    test('value combobox shows no options when key has no suggestions', () => {
        setupWithSuggestions(
            [['unknown', '']],
            { keys: [], valuesByKey: { lang: ['en'] } }
        )
        const comboboxes = screen.getAllByRole('combobox')
        const valueInput = comboboxes[1]
        fireEvent.mouseDown(valueInput)
        expect(screen.queryByRole('option')).not.toBeInTheDocument()
    })

    test('without suggestions prop, inputs are textboxes (no autocomplete)', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['', '']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
        expect(screen.getAllByRole('textbox')).toHaveLength(2)
    })
})

describe('SearchParams delimited-row chip mode', () => {
    test('delimited row with suggestions renders chips for current tokens', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['experiments', 'alpha,beta']]}
                setEntries={setEntries}
                paramsWithDelimiter={{ experiments: { separator: ',' } }}
                suggestions={{ keys: ['experiments'], valuesByKey: { experiments: ['alpha', 'beta', 'gamma'] } }}
            />
        )
        // Chip text is rendered for each existing token
        expect(screen.getByText('alpha')).toBeInTheDocument()
        expect(screen.getByText('beta')).toBeInTheDocument()
    })

    test('delimited row chip dropdown lists per-token suggestions and excludes already-selected tokens', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['experiments', 'alpha']]}
                setEntries={setEntries}
                paramsWithDelimiter={{ experiments: { separator: ',' } }}
                suggestions={{ keys: ['experiments'], valuesByKey: { experiments: ['alpha', 'beta', 'gamma'] } }}
            />
        )
        const comboboxes = screen.getAllByRole('combobox')
        const valueInput = comboboxes[comboboxes.length - 1]
        fireEvent.mouseDown(valueInput)
        // 'alpha' is already a chip, so it should NOT appear in the dropdown
        expect(screen.queryByRole('option', { name: 'alpha' })).not.toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'beta' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'gamma' })).toBeInTheDocument()
    })

    test('non-delimited row with suggestions still uses single-Autocomplete', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['debug', 'true']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
                suggestions={{ keys: ['debug'], valuesByKey: { debug: ['true', 'false'] } }}
            />
        )
        // No chip rendered for the value 'true' — it's just text in the input
        // The current value is reflected as input text, not as a button-style chip
        const comboboxes = screen.getAllByRole('combobox')
        // value combobox shows current value in its input (single, not multi-select)
        expect((comboboxes[1] as HTMLInputElement).value).toBe('true')
    })

    test('delimited row without suggestions falls back to plain TextField (options-page path)', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['experiments', 'alpha,beta']]}
                setEntries={setEntries}
                paramsWithDelimiter={{ experiments: { separator: ',' } }}
            />
        )
        const textboxes = screen.getAllByRole('textbox') as HTMLInputElement[]
        const valueInput = textboxes[1]
        expect(valueInput.value).toBe('alpha,beta')
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
})
