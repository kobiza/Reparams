/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectedPackageActions from '../../src/js/components/options/ConnectedPackageActions';
import { SettingsPackage } from '../../src/js/types/types';

const sourceUrl = 'https://example.com/data.json';

const makePackage = (overrides: Partial<SettingsPackage> = {}): SettingsPackage => ({
    key: 'pkg-1',
    label: 'Local Label',
    conditions: { urlPatterns: [], domSelectors: [] },
    presets: {},
    paramsWithDelimiter: [],
    sourceUrl,
    ...overrides,
});

const mockFetchOk = (text: string) => {
    (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => text,
    } as unknown as Response);
};

afterEach(() => {
    delete (global as any).fetch;
});

describe('ConnectedPackageActions — Pull latest', () => {
    test('overridden package: Yes/replace runs pull and fires success notification with remote label', async () => {
        const remote = {
            modelVersion: 1,
            packages: { 'pkg-1': makePackage({ label: 'Remote Label', sourceUrl: undefined }) },
        };
        mockFetchOk(JSON.stringify(remote));
        const addPackages = jest.fn();
        const showNotification = jest.fn();

        render(
            <ConnectedPackageActions
                packageData={makePackage({ isOverride: true })}
                addPackages={addPackages}
                disconnectPackage={() => { }}
                showNotification={showNotification}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Pull latest/ }));
        expect(screen.getByText(/local overrides/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Yes, replace/ }));

        await waitFor(() => {
            expect(showNotification).toHaveBeenCalledTimes(1);
        });
        expect(showNotification).toHaveBeenCalledWith('Updated "Remote Label" from the source.');

        // addPackages was called with replacement that drops isOverride.
        expect(addPackages).toHaveBeenCalledTimes(1);
        const [packagesObj, replace] = addPackages.mock.calls[0];
        expect(replace).toBe(true);
        expect(packagesObj['pkg-1'].label).toBe('Remote Label');
        expect(packagesObj['pkg-1'].sourceUrl).toBe(sourceUrl);
        expect(packagesObj['pkg-1'].isOverride).toBeUndefined();
    });

    test('non-overridden package: Pull latest fires success notification directly', async () => {
        const remote = {
            modelVersion: 1,
            packages: { 'pkg-1': makePackage({ label: 'Fresh', sourceUrl: undefined }) },
        };
        mockFetchOk(JSON.stringify(remote));
        const showNotification = jest.fn();

        render(
            <ConnectedPackageActions
                packageData={makePackage()}
                addPackages={jest.fn()}
                disconnectPackage={() => { }}
                showNotification={showNotification}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Pull latest/ }));

        await waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith('Updated "Fresh" from the source.');
        });
    });
});
