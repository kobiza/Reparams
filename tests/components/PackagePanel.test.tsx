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
    unlinkPackage: noop,
});

const makePackage = (overrides: Partial<SettingsPackage> = {}): SettingsPackage => ({
    key: 'pkg-1',
    label: 'Test Package',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    ...overrides,
});

describe('PackagePanel — lock indicator', () => {
    test('renders lock icon and hides rename pencil when gistId is set', () => {
        const pkg = makePackage({ gistId: 'abc123', gistRevision: 'sha1' });
        render(<PackagePanel packageData={pkg} packageKey={pkg.key} editorStore={makeStore()} />);

        expect(screen.getByLabelText('locked')).toBeInTheDocument();
        expect(screen.queryByLabelText('rename')).not.toBeInTheDocument();
    });

    test('hides lock icon and shows rename pencil when gistId is absent', () => {
        const pkg = makePackage();
        render(<PackagePanel packageData={pkg} packageKey={pkg.key} editorStore={makeStore()} />);

        expect(screen.queryByLabelText('locked')).not.toBeInTheDocument();
        expect(screen.getByLabelText('rename')).toBeInTheDocument();
    });
});
