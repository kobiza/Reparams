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
        const incoming = { 'pkg-1': { ...samplePackage, label: 'Duplicate' } };
        renderContext(<AddPackagesConsumer packages={incoming} replace={false} />);
        await userEvent.click(screen.getByText('Import'));
        await waitFor(() => {
            const stored = JSON.parse(screen.getByTestId('packages').textContent!);
            const keys = Object.keys(stored);
            expect(keys).toContain('pkg-1');
            expect(keys.length).toBe(2);
        });
    });

    test('replace=false adds new-key package without conflict', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
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

describe('UseEditorStoreContext — clearPackageParamHistory', () => {
    function ClearHistoryConsumer({ packageKey }: { packageKey: string }) {
        const store = useContext(EditorStoreContext);
        const pkg = store.state.packages[packageKey];
        return (
            <div>
                <span data-testid="history-len">{pkg?.paramHistory?.length ?? 'undefined'}</span>
                <pre data-testid="package-json">{JSON.stringify(pkg)}</pre>
                <button onClick={() => store.clearPackageParamHistory(packageKey)}>Clear</button>
            </div>
        );
    }

    test('clears paramHistory on the target package without touching others', async () => {
        const modelWithHistory: EditorModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': {
                    ...samplePackage,
                    paramHistory: [
                        { key: 'a', value: '1' },
                        { key: 'b', value: '2' },
                    ],
                },
                'pkg-2': {
                    ...secondPackage,
                    paramHistory: [{ key: 'x', value: 'y' }],
                },
            },
        };
        localStorage.setItem('reparamsAppData', JSON.stringify(modelWithHistory));

        renderContext(<ClearHistoryConsumer packageKey="pkg-1" />);

        expect(screen.getByTestId('history-len')).toHaveTextContent('2');
        await userEvent.click(screen.getByText('Clear'));
        await waitFor(() => {
            expect(screen.getByTestId('history-len')).toHaveTextContent('0');
        });

        const stored = JSON.parse(localStorage.getItem('reparamsAppData')!) as EditorModel;
        expect(stored.packages['pkg-1'].paramHistory).toEqual([]);
        expect(stored.packages['pkg-2'].paramHistory).toEqual([{ key: 'x', value: 'y' }]);
    });

    test('clears paramHistory on a connected package without first-edit prompt (structural mutation bypasses guard)', async () => {
        const modelWithConnectedHistory: EditorModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': {
                    ...samplePackage,
                    sourceUrl: 'https://example.com/pkgs.json',
                    paramHistory: [{ key: 'a', value: '1' }],
                },
            },
        };
        localStorage.setItem('reparamsAppData', JSON.stringify(modelWithConnectedHistory));

        renderContext(<ClearHistoryConsumer packageKey="pkg-1" />);

        expect(screen.getByTestId('history-len')).toHaveTextContent('1');
        await userEvent.click(screen.getByText('Clear'));
        await waitFor(() => {
            expect(screen.getByTestId('history-len')).toHaveTextContent('0');
        });
    });

    test('preserves other package fields (label, presets, conditions) when clearing', async () => {
        const modelWithHistory: EditorModel = {
            modelVersion: 1,
            packages: {
                'pkg-1': {
                    ...samplePackage,
                    presets: { p1: { label: 'P1', entries: [['k', 'v']] } },
                    paramHistory: [{ key: 'a', value: '1' }],
                },
            },
        };
        localStorage.setItem('reparamsAppData', JSON.stringify(modelWithHistory));

        renderContext(<ClearHistoryConsumer packageKey="pkg-1" />);
        await userEvent.click(screen.getByText('Clear'));

        await waitFor(() => {
            expect(screen.getByTestId('history-len')).toHaveTextContent('0');
        });
        const stored = JSON.parse(localStorage.getItem('reparamsAppData')!) as EditorModel;
        const pkg = stored.packages['pkg-1'];
        expect(pkg.label).toBe('Sample Package');
        expect(pkg.presets).toEqual({ p1: { label: 'P1', entries: [['k', 'v']] } });
        expect(pkg.conditions).toEqual({ urlPatterns: [{ id: 'u1', value: '*://*/*' }], domSelectors: [] });
    });
});

describe('UseEditorStoreContext — first-edit prompt for connected packages', () => {
    const connectedPackage: SettingsPackage = {
        ...samplePackage,
        sourceUrl: 'https://example.com/pkgs.json',
    };
    const connectedModel: EditorModel = {
        modelVersion: 1,
        packages: { 'pkg-1': connectedPackage },
    };

    function ConnectedConsumer() {
        const store = useContext(EditorStoreContext);
        const pkg = store.state.packages['pkg-1'];
        const keys = Object.keys(store.state.packages);
        return (
            <div>
                <span data-testid="label">{pkg?.label ?? 'missing'}</span>
                <span data-testid="presets">{JSON.stringify(pkg?.presets ?? {})}</span>
                <span data-testid="is-override">{String(pkg?.isOverride ?? false)}</span>
                <span data-testid="pkg-count">{keys.length}</span>
                <span data-testid="pending">{store.pendingFirstEdit ? 'open' : 'closed'}</span>
                <button onClick={() => store.updatePackageLabel('pkg-1', 'Renamed')}>Rename</button>
                <button onClick={() => store.updatePackageLabel('pkg-1', 'Renamed Twice')}>RenameAgain</button>
                <button onClick={() => store.updatePackagePreset('pkg-1', { p1: { label: 'P1', entries: [] } })}>SetPreset</button>
                <button onClick={() => store.confirmOverride()}>Confirm</button>
                <button onClick={() => store.forkAsNewPackage()}>Fork</button>
                <button onClick={() => store.cancelPendingEdit()}>DismissPending</button>
                <button onClick={() => store.disconnectPackage('pkg-1')}>Disconnect</button>
            </div>
        );
    }

    test('data edit on connected non-overridden package opens pending prompt without applying', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(connectedModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));

        await waitFor(() => {
            expect(screen.getByTestId('pending')).toHaveTextContent('open');
        });
        expect(screen.getByTestId('label')).toHaveTextContent('Sample Package');
    });

    test('confirmOverride applies the captured edit and sets isOverride=true', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(connectedModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('open'));
        await userEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.getByTestId('label')).toHaveTextContent('Renamed');
        });
        expect(screen.getByTestId('is-override')).toHaveTextContent('true');
        expect(screen.getByTestId('pending')).toHaveTextContent('closed');
    });

    test('after override, subsequent edits go through without prompting', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify({
            modelVersion: 1,
            packages: { 'pkg-1': { ...connectedPackage, isOverride: true } },
        }));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => {
            expect(screen.getByTestId('label')).toHaveTextContent('Renamed');
        });
        expect(screen.getByTestId('pending')).toHaveTextContent('closed');
    });

    test('forkAsNewPackage creates a "Copy of …" new package and discards the captured edit', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(connectedModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('open'));
        await userEvent.click(screen.getByText('Fork'));

        await waitFor(() => {
            expect(screen.getByTestId('pkg-count')).toHaveTextContent('2');
        });
        // Original is untouched
        expect(screen.getByTestId('label')).toHaveTextContent('Sample Package');
        expect(screen.getByTestId('is-override')).toHaveTextContent('false');
        expect(screen.getByTestId('pending')).toHaveTextContent('closed');
        // New package is named "Copy of <prevName>"
        const stored = JSON.parse(localStorage.getItem('reparamsAppData')!);
        const labels = Object.values(stored.packages).map((p: any) => p.label);
        expect(labels).toContain('Copy of Sample Package');
    });

    test('cancelPendingEdit discards the captured edit without applying', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(connectedModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('open'));
        await userEvent.click(screen.getByText('DismissPending'));

        await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('closed'));
        expect(screen.getByTestId('label')).toHaveTextContent('Sample Package');
        expect(screen.getByTestId('is-override')).toHaveTextContent('false');
    });

    test('latest captured edit wins when multiple data mutations fire before confirm', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(connectedModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('open'));
        await userEvent.click(screen.getByText('RenameAgain'));
        await userEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.getByTestId('label')).toHaveTextContent('Renamed Twice');
        });
    });

    test('disconnectPackage strips sourceUrl and isOverride and bypasses the prompt', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify({
            modelVersion: 1,
            packages: { 'pkg-1': { ...connectedPackage, isOverride: true } },
        }));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Disconnect'));

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem('reparamsAppData')!) as EditorModel;
            const pkg = stored.packages['pkg-1'];
            expect(pkg.sourceUrl).toBeUndefined();
            expect(pkg.isOverride).toBeUndefined();
        });
        expect(screen.getByTestId('pending')).toHaveTextContent('closed');
    });

    test('unconnected package edits go through without prompt', async () => {
        localStorage.setItem('reparamsAppData', JSON.stringify(sampleModel));
        renderContext(<ConnectedConsumer />);

        await userEvent.click(screen.getByText('Rename'));
        await waitFor(() => {
            expect(screen.getByTestId('label')).toHaveTextContent('Renamed');
        });
        expect(screen.getByTestId('pending')).toHaveTextContent('closed');
    });
});
