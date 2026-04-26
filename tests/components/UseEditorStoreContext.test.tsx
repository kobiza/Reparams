/**
 * @jest-environment jsdom
 */
import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UseEditorStoreContext, { EditorStoreContext } from '../../src/js/components/options/UseEditorStoreContext';
import { EditorModel, SettingsPackage } from '../../src/js/types/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const samplePackage: SettingsPackage = {
    key: 'pkg-1',
    label: 'Sample Package',
    conditions: { urlPatterns: [{ id: 'u1', value: '*://*/*' }], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
};

const sampleModel: EditorModel = {
    modelVersion: 1,
    packages: { 'pkg-1': samplePackage },
};

const secondPackage: SettingsPackage = {
    key: 'pkg-2',
    label: 'Second Package',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
};

// ---------------------------------------------------------------------------
// Test consumer components
// ---------------------------------------------------------------------------

function BasicConsumer() {
    const store = useContext(EditorStoreContext);
    const pkgKeys = Object.keys(store.state.packages);
    return (
        <div>
            <span data-testid="pkg-count">{pkgKeys.length}</span>
            <pre data-testid="packages">{JSON.stringify(store.state.packages)}</pre>
            <button onClick={() => store.addNewPackage({ label: 'New Pkg' })}>Add</button>
            {pkgKeys.map(key => (
                <React.Fragment key={key}>
                    <span data-testid={`label-${key}`}>{store.state.packages[key].label}</span>
                    <button
                        data-testid={`delete-${key}`}
                        onClick={() => store.deletePackage(key)}
                    >
                        Delete
                    </button>
                    <button
                        data-testid={`rename-${key}`}
                        onClick={() => store.updatePackageLabel(key, 'Renamed')}
                    >
                        Rename
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

function AddPackagesConsumer({ packages, replace }: { packages: Record<string, SettingsPackage>; replace: boolean }) {
    const store = useContext(EditorStoreContext);
    return (
        <div>
            <pre data-testid="packages">{JSON.stringify(store.state.packages)}</pre>
            <button onClick={() => store.addPackages(packages, replace)}>Import</button>
        </div>
    );
}

function renderContext(children: React.ReactNode) {
    return render(<UseEditorStoreContext>{children}</UseEditorStoreContext>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    localStorage.clear();
});

describe('UseEditorStoreContext — initial state', () => {
    test('loads packages from localStorage on mount', () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        renderContext(<BasicConsumer />);
        expect(screen.getByTestId('packages')).toHaveTextContent('Sample Package');
    });

    test('falls back to empty packages when localStorage is empty', () => {
        renderContext(<BasicConsumer />);
        expect(screen.getByTestId('pkg-count')).toHaveTextContent('0');
    });
});

describe('UseEditorStoreContext — mutations', () => {
    test('addNewPackage adds a package', async () => {
        renderContext(<BasicConsumer />);
        await userEvent.click(screen.getByText('Add'));
        await waitFor(() => {
            expect(screen.getByTestId('pkg-count')).toHaveTextContent('1');
        });
    });

    test('deletePackage removes a package', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        renderContext(<BasicConsumer />);
        expect(screen.getByTestId('pkg-count')).toHaveTextContent('1');
        await userEvent.click(screen.getByTestId('delete-pkg-1'));
        await waitFor(() => {
            expect(screen.getByTestId('pkg-count')).toHaveTextContent('0');
        });
    });

    test('updatePackageLabel changes the label', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        renderContext(<BasicConsumer />);
        expect(screen.getByTestId('label-pkg-1')).toHaveTextContent('Sample Package');
        await userEvent.click(screen.getByTestId('rename-pkg-1'));
        await waitFor(() => {
            expect(screen.getByTestId('label-pkg-1')).toHaveTextContent('Renamed');
        });
    });
});

describe('UseEditorStoreContext — addPackages', () => {
    test('replace=false duplicates key when it already exists', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        // Import a package with the same key as samplePackage
        const incoming = { 'pkg-1': { ...samplePackage, label: 'Duplicate' } };
        renderContext(<AddPackagesConsumer packages={incoming} replace={false} />);
        await userEvent.click(screen.getByText('Import'));
        await waitFor(() => {
            const stored = JSON.parse(screen.getByTestId('packages').textContent!);
            const keys = Object.keys(stored);
            // Original 'pkg-1' still present, incoming got a new key
            expect(keys).toContain('pkg-1');
            expect(keys.length).toBe(2);
        });
    });

    test('replace=false adds new-key package without conflict', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        // secondPackage.key = 'pkg-2' which doesn't exist in state — added as-is
        const incoming = { 'pkg-2': secondPackage };
        renderContext(<AddPackagesConsumer packages={incoming} replace={false} />);
        await userEvent.click(screen.getByText('Import'));
        await waitFor(() => {
            const stored = JSON.parse(screen.getByTestId('packages').textContent!);
            expect(Object.keys(stored)).toContain('pkg-2');
            expect(stored['pkg-2'].label).toBe('Second Package');
        });
    });

    test('replace=true overwrites package with matching key', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        const incoming = { 'pkg-1': { ...samplePackage, label: 'Replaced' } };
        renderContext(<AddPackagesConsumer packages={incoming} replace={true} />);
        await userEvent.click(screen.getByText('Import'));
        await waitFor(() => {
            const stored = JSON.parse(screen.getByTestId('packages').textContent!);
            expect(stored['pkg-1'].label).toBe('Replaced');
        });
    });
});

describe('UseEditorStoreContext — localStorage persistence', () => {
    test('state changes are persisted to localStorage', async () => {
        renderContext(<BasicConsumer />);
        await userEvent.click(screen.getByText('Add'));
        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem('reparamsAppData')!);
            expect(Object.keys(stored.packages).length).toBe(1);
        });
    });
});
