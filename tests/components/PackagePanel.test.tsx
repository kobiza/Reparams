/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PackagePanel from '../../src/js/components/options/PackagePanel';
import { EditorStore, SettingsPackage } from '../../src/js/types/types';

const noop = () => { };

const makeStore = (): EditorStore => ({
    state: { modelVersion: 1, packages: {} },
    updatePackagePreset: noop,
    updatePackageParamsWithDelimiter: noop,
    updatePackageLabel: noop,
    updatePackageUrlPatterns: noop,
    updatePackageDomSelectors: noop,
    addNewPackage: noop,
    addPackages: noop,
    deletePackage: noop,
    clearPackageParamHistory: noop,
    disconnectPackage: noop,
    pendingFirstEdit: null,
    confirmOverride: noop,
    forkAsNewPackage: noop,
    cancelPendingEdit: noop,
    showNotification: noop,
});

const makePackage = (overrides: Partial<SettingsPackage> = {}): SettingsPackage => ({
    key: 'pkg-1',
    label: 'Test Package',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

describe('PackagePanel — connection indicator', () => {
    test('renders connected icon when sourceUrl is set and not overridden', () => {
        const pkg = makePackage({ sourceUrl: 'https://example.com/pkgs.json' });
        render(<PackagePanel packageData={pkg} packageKey={pkg.key} editorStore={makeStore()} />);

        expect(screen.getByLabelText('connected')).toBeInTheDocument();
        expect(screen.queryByLabelText('connected-overridden')).not.toBeInTheDocument();
        // rename pencil remains available — edits go through the first-edit prompt
        expect(screen.getByLabelText('rename')).toBeInTheDocument();
    });

    test('renders overridden icon when isOverride is true', () => {
        const pkg = makePackage({ sourceUrl: 'https://example.com/pkgs.json', isOverride: true });
        render(<PackagePanel packageData={pkg} packageKey={pkg.key} editorStore={makeStore()} />);

        expect(screen.getByLabelText('connected-overridden')).toBeInTheDocument();
        expect(screen.queryByLabelText('connected')).not.toBeInTheDocument();
    });

    test('hides connection icon when sourceUrl is absent', () => {
        const pkg = makePackage();
        render(<PackagePanel packageData={pkg} packageKey={pkg.key} editorStore={makeStore()} />);

        expect(screen.queryByLabelText('connected')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('connected-overridden')).not.toBeInTheDocument();
        expect(screen.getByLabelText('rename')).toBeInTheDocument();
    });
});
