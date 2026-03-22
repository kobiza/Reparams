/**
 * @jest-environment jsdom
 */
import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import UseViewerStoreContext, { ViewerStoreContext } from '../../src/js/components/popup/UseViewerStoreContext';
import { EditorModel, SettingsPackage } from '../../src/js/types/types';

// ---------------------------------------------------------------------------
// Mock chrome global — the component guards on chrome.tabs; setting it to
// undefined makes the guard falsy so no Chrome API calls are attempted.
// ---------------------------------------------------------------------------
beforeAll(() => {
    (global as any).chrome = {
        tabs: undefined,
        runtime: {
            onMessage: {
                addListener: jest.fn(),
                removeListener: jest.fn(),
            },
        },
    };
});

beforeEach(() => {
    localStorage.clear();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePackage(
    key: string,
    label: string,
    urlPatterns: string[],
    domSelectors: string[] = [],
    presetLabel = 'My Preset'
): SettingsPackage {
    return {
        key,
        label,
        conditions: {
            urlPatterns: urlPatterns.map((v, i) => ({ id: `u${i}`, value: v })),
            domSelectors: domSelectors.map((v, i) => ({ id: `d${i}`, value: v })),
        },
        presets: {
            p1: { label: presetLabel, entries: [['utm_source', 'test']] },
        },
        paramsWithDelimiter: [],
    };
}

function seedStorage(model: EditorModel) {
    localStorage.setItem('reparamsAppData', JSON.stringify(model));
}

// ---------------------------------------------------------------------------
// Consumer
// ---------------------------------------------------------------------------

function ViewerConsumer() {
    const store = useContext(ViewerStoreContext);
    const presetKeys = Object.keys(store.state.presets);
    return (
        <div>
            <span data-testid="preset-count">{presetKeys.length}</span>
            <pre data-testid="preset-keys">{JSON.stringify(presetKeys)}</pre>
        </div>
    );
}

function renderViewer(currentTabUrl: string) {
    return render(
        <UseViewerStoreContext currentTabUrl={currentTabUrl}>
            <ViewerConsumer />
        </UseViewerStoreContext>
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UseViewerStoreContext', () => {
    test('exposes no presets when no package matches the current URL', () => {
        const pkg = makePackage('p1', 'Google', ['https://google.com/*']);
        seedStorage({ modelVersion: '1.0', packages: { p1: pkg } });

        renderViewer('https://other.com/');

        expect(screen.getByTestId('preset-count')).toHaveTextContent('0');
    });

    test('exposes presets when a package URL pattern matches', () => {
        const pkg = makePackage('p1', 'Google', ['https://google.com/*'], [], 'Google Preset');
        seedStorage({ modelVersion: '1.0', packages: { p1: pkg } });

        renderViewer('https://google.com/search?q=hello');

        expect(screen.getByTestId('preset-count')).toHaveTextContent('1');
        expect(screen.getByTestId('preset-keys')).toHaveTextContent('Google Preset');
    });

    test('merges presets from multiple matching packages', () => {
        const pkg1 = makePackage('p1', 'Google', ['https://google.com/*'], [], 'Preset A');
        const pkg2 = makePackage('p2', 'Also Google', ['https://google.com/*'], [], 'Preset B');
        seedStorage({ modelVersion: '1.0', packages: { p1: pkg1, p2: pkg2 } });

        renderViewer('https://google.com/');

        expect(screen.getByTestId('preset-count')).toHaveTextContent('2');
    });

    test('returns no presets when localStorage is empty', () => {
        renderViewer('https://google.com/');
        expect(screen.getByTestId('preset-count')).toHaveTextContent('0');
    });
});
