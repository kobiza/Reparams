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
        // After deletion, only k2/v2 remain; remainingInputs[0] is the surviving key input.
        expect(remainingInputs).toHaveLength(2)
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
        expect(remainingInputs).toHaveLength(2)
        expect(remainingInputs[0].value).toBe('k1')
        expect(document.activeElement).toBe(remainingInputs[0])
    })

    test('deleting the only remaining row moves focus to the Add-Param button', () => {
        render(<Harness initialEntries={[['only', 'val']]} />)
        const deleteButtons = screen.getAllByLabelText('delete')
        act(() => {
            fireEvent.click(deleteButtons[0])
        })
        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
        const addBtn = screen.getByRole('button', { name: 'Add param' })
        expect(document.activeElement).toBe(addBtn)
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
