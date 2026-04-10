/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchParams from '../../src/js/components/common/SearchParams'
import { SearchParamsEntries } from '../../src/js/types/types'

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
