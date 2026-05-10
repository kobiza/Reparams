/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tags from '../../src/js/components/common/MuiTags'
import FreeSoloTags from '../../src/js/components/common/FreeSoloTags'
import SearchParams from '../../src/js/components/common/SearchParams'
import UrlEditor from '../../src/js/components/popup/UrlEditor'
import type { ParamSuggestions, SearchParamsEntries } from '../../src/js/types/types'

beforeEach(() => {
    document.execCommand = jest.fn()
})

describe('MuiTags keyboard behavior (preset picker)', () => {
    const renderTags = (selected: Array<{ value: string; label: string }>) => {
        const onAdd = jest.fn()
        const onDelete = jest.fn()
        const suggestions = [
            { value: 'preset-a', label: 'Preset A' },
            { value: 'preset-b', label: 'Preset B' },
        ]
        render(
            <Tags
                selected={selected}
                suggestions={suggestions}
                placeholderText="Add preset"
                onAdd={onAdd}
                onDelete={onDelete}
            />
        )
        return { onAdd, onDelete }
    }

    test('Enter on the highlighted suggestion calls onAdd with that suggestion', () => {
        const { onAdd, onDelete } = renderTags([])
        const input = screen.getByRole('combobox') as HTMLInputElement
        fireEvent.mouseDown(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onAdd).toHaveBeenCalledTimes(1)
        const added = onAdd.mock.calls[0][0]
        expect(added[0].value).toBe('preset-a')
        expect(onDelete).not.toHaveBeenCalled()
    })

    test('Blur (Tab) with a highlighted suggestion calls onAdd (autoSelect)', () => {
        const onAdd = jest.fn()
        const onDelete = jest.fn()
        const suggestions = [
            { value: 'preset-a', label: 'Preset A' },
            { value: 'preset-b', label: 'Preset B' },
        ]
        render(
            <Tags
                selected={[]}
                suggestions={suggestions}
                placeholderText="Add preset"
                onAdd={onAdd}
                onDelete={onDelete}
            />
        )
        const input = screen.getByRole('combobox') as HTMLInputElement
        fireEvent.mouseDown(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.blur(input)
        expect(onAdd).toHaveBeenCalledTimes(1)
        const added = onAdd.mock.calls[0][0]
        expect(added[0].value).toBe('preset-a')
    })

    test('Backspace on empty input removes the last selected chip via onDelete', () => {
        const { onAdd, onDelete } = renderTags([
            { value: 'preset-a', label: 'Preset A' },
            { value: 'preset-b', label: 'Preset B' },
        ])
        const input = screen.getByRole('combobox') as HTMLInputElement
        input.focus()
        fireEvent.keyDown(input, { key: 'Backspace' })
        expect(onDelete).toHaveBeenCalledTimes(1)
        const removed = onDelete.mock.calls[0][0]
        expect(removed[0].value).toBe('preset-b')
        expect(onAdd).not.toHaveBeenCalled()
    })
})

describe('FreeSoloTags keyboard behavior', () => {
    test('Enter on typed (non-suggestion) text commits as a new chip', () => {
        const onChange = jest.fn()
        render(
            <FreeSoloTags
                values={[]}
                onChange={onChange}
                placeholderText="Add value"
                options={['alpha', 'beta']}
            />
        )
        const input = screen.getByRole('combobox') as HTMLInputElement
        fireEvent.change(input, { target: { value: 'gamma' } })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onChange).toHaveBeenCalledWith(['gamma'])
    })

    test('Enter on the highlighted suggestion commits that suggestion', () => {
        const onChange = jest.fn()
        render(
            <FreeSoloTags
                values={[]}
                onChange={onChange}
                placeholderText="Add value"
                options={['alpha', 'beta']}
            />
        )
        const input = screen.getByRole('combobox') as HTMLInputElement
        fireEvent.mouseDown(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onChange).toHaveBeenCalledWith(['alpha'])
    })

    test('Blur (Tab) with a highlighted suggestion commits that suggestion (autoSelect)', () => {
        const onChange = jest.fn()
        render(
            <FreeSoloTags
                values={[]}
                onChange={onChange}
                placeholderText="Add value"
                options={['alpha', 'beta']}
            />
        )
        const input = screen.getByRole('combobox') as HTMLInputElement
        fireEvent.mouseDown(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.blur(input)
        expect(onChange).toHaveBeenCalledWith(['alpha'])
    })
})

describe('SearchParams Autocomplete keyboard behavior', () => {
    function renderWithSuggestions(entries: SearchParamsEntries, suggestions: ParamSuggestions) {
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

    test('key Autocomplete: Enter on highlighted suggestion commits the key via setEntries', () => {
        const { setEntries } = renderWithSuggestions(
            [['', '']],
            { keys: ['foo', 'bar'], valuesByKey: {} }
        )
        const keyInput = screen.getAllByRole('combobox')[0] as HTMLInputElement
        fireEvent.change(keyInput, { target: { value: 'fo' } })
        fireEvent.keyDown(keyInput, { key: 'ArrowDown' })
        fireEvent.keyDown(keyInput, { key: 'Enter' })
        const lastCall = setEntries.mock.calls.at(-1)![0]
        expect(lastCall).toEqual([['foo', '']])
    })

    test('key Autocomplete: typing already commits via onInputChange — Tab is a non-destructive move', () => {
        const { setEntries } = renderWithSuggestions(
            [['', '']],
            { keys: ['foo'], valuesByKey: {} }
        )
        const keyInput = screen.getAllByRole('combobox')[0] as HTMLInputElement
        fireEvent.change(keyInput, { target: { value: 'newkey' } })
        // Whatever the user does next (Tab to value, click, etc.) the key is already in state.
        const lastCall = setEntries.mock.calls.at(-1)![0]
        expect(lastCall).toEqual([['newkey', '']])
    })

    test('value Autocomplete: Enter on highlighted suggestion commits the value via setEntries', () => {
        const { setEntries } = renderWithSuggestions(
            [['lang', '']],
            { keys: ['lang'], valuesByKey: { lang: ['en', 'fr'] } }
        )
        const valueInput = screen.getAllByRole('combobox')[1] as HTMLInputElement
        fireEvent.mouseDown(valueInput)
        fireEvent.keyDown(valueInput, { key: 'ArrowDown' })
        fireEvent.keyDown(valueInput, { key: 'Enter' })
        const lastCall = setEntries.mock.calls.at(-1)![0]
        expect(lastCall).toEqual([['lang', 'en']])
    })

    test('key Autocomplete: blur (Tab) with highlighted suggestion commits via autoSelect', () => {
        const { setEntries } = renderWithSuggestions(
            [['', '']],
            { keys: ['foo', 'bar'], valuesByKey: {} }
        )
        const keyInput = screen.getAllByRole('combobox')[0] as HTMLInputElement
        fireEvent.change(keyInput, { target: { value: 'fo' } })
        fireEvent.keyDown(keyInput, { key: 'ArrowDown' })
        fireEvent.blur(keyInput)
        const lastCall = setEntries.mock.calls.at(-1)![0]
        expect(lastCall).toEqual([['foo', '']])
    })

    test('value Autocomplete: blur (Tab) with highlighted suggestion commits via autoSelect', () => {
        const { setEntries } = renderWithSuggestions(
            [['lang', '']],
            { keys: ['lang'], valuesByKey: { lang: ['en', 'fr'] } }
        )
        const valueInput = screen.getAllByRole('combobox')[1] as HTMLInputElement
        fireEvent.mouseDown(valueInput)
        fireEvent.keyDown(valueInput, { key: 'ArrowDown' })
        fireEvent.blur(valueInput)
        const lastCall = setEntries.mock.calls.at(-1)![0]
        expect(lastCall).toEqual([['lang', 'en']])
    })
})

describe('SearchParams row deletion ergonomics', () => {
    test('Cmd+Backspace on key input deletes the row', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['k1', 'v1'], ['k2', 'v2']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        const firstRowKey = inputs[0]
        fireEvent.keyDown(firstRowKey, { key: 'Backspace', metaKey: true })
        expect(setEntries).toHaveBeenCalledWith([['k2', 'v2']])
    })

    test('Cmd+Backspace on value input deletes the row', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['k1', 'v1'], ['k2', 'v2']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        const secondRowValue = inputs[3]
        fireEvent.keyDown(secondRowValue, { key: 'Backspace', metaKey: true })
        expect(setEntries).toHaveBeenCalledWith([['k1', 'v1']])
    })

    test('Ctrl+Backspace also deletes the row (Windows/Linux variant)', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['k1', 'v1'], ['k2', 'v2']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        fireEvent.keyDown(inputs[0], { key: 'Backspace', ctrlKey: true })
        expect(setEntries).toHaveBeenCalledWith([['k2', 'v2']])
    })

    test('plain Backspace (no modifier) does not remove the row', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['key', 'val']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        fireEvent.keyDown(inputs[0], { key: 'Backspace' })
        expect(setEntries).not.toHaveBeenCalled()
    })

    function Harness({ initialEntries }: { initialEntries: SearchParamsEntries }) {
        const [entries, setEntries] = React.useState<SearchParamsEntries>(initialEntries)
        return (
            <SearchParams
                entries={entries}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
    }

    test('clicking delete on row 1 of 2 moves focus to the (new) first row key input', () => {
        render(<Harness initialEntries={[['k1', 'v1'], ['k2', 'v2']]} />)
        const deleteButtons = screen.getAllByLabelText('delete')
        act(() => {
            fireEvent.click(deleteButtons[0])
        })
        const remainingInputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        // After deletion: 1 real row (k2/v2) + 1 trailing empty row = 4 textboxes.
        expect(remainingInputs).toHaveLength(4)
        expect(remainingInputs[0].value).toBe('k2')
        expect(document.activeElement).toBe(remainingInputs[0])
    })

    test('Cmd+Backspace on last row moves focus to the previous row', () => {
        render(<Harness initialEntries={[['k1', 'v1'], ['k2', 'v2']]} />)
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        act(() => {
            fireEvent.keyDown(inputs[2], { key: 'Backspace', metaKey: true })
        })
        const remainingInputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        // After deletion: 1 real row (k1/v1) + 1 trailing empty row = 4 textboxes.
        expect(remainingInputs).toHaveLength(4)
        expect(remainingInputs[0].value).toBe('k1')
        expect(document.activeElement).toBe(remainingInputs[0])
    })

    test('deleting the only remaining row moves focus to the trailing empty row key field', () => {
        render(<Harness initialEntries={[['only', 'val']]} />)
        const deleteButtons = screen.getAllByLabelText('delete')
        act(() => {
            fireEvent.click(deleteButtons[0])
        })
        // Only the trailing empty row remains: 2 empty textboxes, no delete button.
        const remainingInputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        expect(remainingInputs).toHaveLength(2)
        expect(remainingInputs[0].value).toBe('')
        expect(screen.queryByLabelText('delete')).not.toBeInTheDocument()
        expect(document.activeElement).toBe(remainingInputs[0])
    })
})

describe('SearchParams trailing-empty-row behavior', () => {
    test('renders one trailing empty row when entries is empty', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        expect(screen.getAllByRole('textbox')).toHaveLength(2)
        expect(screen.queryByLabelText('delete')).not.toBeInTheDocument()
    })

    test('renders entries.length + 1 rows total (real rows + trailing)', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['k1', 'v1'], ['k2', 'v2']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        // 2 real rows + 1 trailing = 6 textboxes
        expect(screen.getAllByRole('textbox')).toHaveLength(6)
        // Only the 2 real rows have delete buttons; trailing has none.
        expect(screen.getAllByLabelText('delete')).toHaveLength(2)
    })

    test('typing in trailing row pushes a new entry to state', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const keyInput = screen.getAllByRole('textbox')[0] as HTMLInputElement
        fireEvent.change(keyInput, { target: { value: 'newkey' } })
        expect(setEntries).toHaveBeenCalledWith([['newkey', '']])
    })

    test('typing in trailing value pushes a new entry with that value', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        const valueInput = screen.getAllByRole('textbox')[1] as HTMLInputElement
        fireEvent.change(valueInput, { target: { value: 'newval' } })
        expect(setEntries).toHaveBeenCalledWith([['', 'newval']])
    })

    test('Cmd+Backspace on the trailing row is a no-op', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['k1', 'v1']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        // The trailing row's key field is the 3rd textbox (after k1 key + value).
        const trailingKey = screen.getAllByRole('textbox')[2] as HTMLInputElement
        fireEvent.keyDown(trailingKey, { key: 'Backspace', metaKey: true })
        expect(setEntries).not.toHaveBeenCalled()
    })

    test('quick-paste in the trailing row appends parsed entries', () => {
        const setEntries = jest.fn()
        render(
            <SearchParams
                entries={[['existing', 'row']]}
                setEntries={setEntries}
                paramsWithDelimiter={{}}
            />
        )
        // Trailing row's key is at index 2.
        const trailingKey = screen.getAllByRole('textbox')[2] as HTMLInputElement
        const event = new Event('paste', { bubbles: true, cancelable: true })
        Object.defineProperty(event, 'clipboardData', {
            value: { getData: jest.fn(() => 'a=b&c=d') },
            configurable: true,
        })
        fireEvent(trailingKey, event)
        expect(setEntries).toHaveBeenCalledWith([
            ['existing', 'row'],
            ['a', 'b'],
            ['c', 'd'],
        ])
    })
})

describe('UrlEditor.addEntries empty filtering', () => {
    test('dropEmptyEntries filters fully-empty rows when serializing the URL', () => {
        const { dropEmptyEntries } = require('../../src/js/utils/searchParamsUtils')
        const filtered = dropEmptyEntries([
            ['env', 'staging'],
            ['', ''],
            ['debug', ''],
        ])
        // Builds the same query string fragment that addEntries would emit.
        const search = filtered
            .map(([k, v]: [string, string]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&')
        expect(search).toBe('env=staging&debug=')
        expect(search).not.toContain('=&')
        expect(search.startsWith('=')).toBe(false)
    })
})

describe('Tooltips for keyboard shortcuts', () => {
    test('Apply FAB tooltip mentions the apply shortcut', async () => {
        const user = userEvent.setup()
        render(
            <UrlEditor
                currentTabUrl="https://example.com/"
                updateCurrentTabUrl={jest.fn()}
                openNewTab={jest.fn()}
                presets={{}}
                paramsWithDelimiter={{}}
                quickActions={[]}
                suggestions={{ keys: [], valuesByKey: {} }}
                themeMode="light"
                setThemeMode={jest.fn()}
            />
        )
        const fab = screen.getByRole('button', { name: 'apply url' })
        await user.hover(fab)
        const tooltip = await screen.findByRole('tooltip')
        expect(tooltip.textContent).toContain('Apply')
        expect(tooltip.textContent).toContain('New tab')
    })

    test('Delete-row IconButton tooltip mentions Remove param', async () => {
        const user = userEvent.setup()
        render(
            <SearchParams
                entries={[['key', 'val']]}
                setEntries={jest.fn()}
                paramsWithDelimiter={{}}
            />
        )
        const deleteBtn = screen.getAllByLabelText('delete')[0]
        await user.hover(deleteBtn)
        const tooltip = await screen.findByRole('tooltip')
        expect(tooltip.textContent).toContain('Remove param')
    })
})
