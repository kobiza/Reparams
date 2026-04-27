/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataIssueDialog from '../../src/js/components/common/DataIssueDialog';
import { localStorageKey } from '../../src/js/utils/consts';

beforeEach(() => {
    localStorage.clear();
});

describe('DataIssueDialog — reason subtitles', () => {
    test('parse reason shows corruption subtitle', () => {
        render(
            <DataIssueDialog
                isOpen
                reason="parse"
                onDismiss={() => { }}
                onReset={() => { }}
            />
        );
        expect(screen.getByText(/corrupted/i)).toBeInTheDocument();
    });

    test('fixer-threw reason mentions a future release', () => {
        render(
            <DataIssueDialog
                isOpen
                reason="fixer-threw"
                onDismiss={() => { }}
                onReset={() => { }}
            />
        );
        expect(screen.getByText(/future release/i)).toBeInTheDocument();
    });

    test('future-version reason mentions newer version', () => {
        render(
            <DataIssueDialog
                isOpen
                reason="future-version"
                onDismiss={() => { }}
                onReset={() => { }}
            />
        );
        expect(screen.getByText(/newer version/i)).toBeInTheDocument();
    });
});

describe('DataIssueDialog — actions', () => {
    test('Dismiss calls onDismiss immediately', async () => {
        const onDismiss = jest.fn();
        render(
            <DataIssueDialog
                isOpen
                reason="parse"
                onDismiss={onDismiss}
                onReset={() => { }}
            />
        );
        await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
        expect(onDismiss).toHaveBeenCalled();
    });

    test('Reset requires confirmation before firing onReset', async () => {
        const onReset = jest.fn();
        render(
            <DataIssueDialog
                isOpen
                reason="parse"
                onDismiss={() => { }}
                onReset={onReset}
            />
        );
        await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
        expect(onReset).not.toHaveBeenCalled();
        expect(screen.getByText(/This will delete all your saved packages/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Confirm reset/ }));
        expect(onReset).toHaveBeenCalled();
    });

    test('Reset confirmation can be cancelled without firing onReset', async () => {
        const onReset = jest.fn();
        render(
            <DataIssueDialog
                isOpen
                reason="parse"
                onDismiss={() => { }}
                onReset={onReset}
            />
        );
        await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onReset).not.toHaveBeenCalled();
        // Back to the main action buttons
        expect(screen.getByRole('button', { name: /Export raw data/ })).toBeInTheDocument();
    });

    test('Export raw data triggers a blob download with verbatim localStorage contents', async () => {
        const rawCorrupt = 'definitely-not-json';
        localStorage.setItem(localStorageKey, rawCorrupt);

        const OriginalBlob = global.Blob;
        const blobParts: Array<{ parts: BlobPart[]; options: BlobPropertyBag | undefined }> = [];
        (global as any).Blob = class MockBlob {
            parts: BlobPart[];
            options: BlobPropertyBag | undefined;
            constructor(parts: BlobPart[], options?: BlobPropertyBag) {
                this.parts = parts;
                this.options = options;
                blobParts.push({ parts, options });
            }
        };
        const createObjectURL = jest.fn(() => 'blob:mock');
        const revokeObjectURL = jest.fn();
        const originalCreate = (URL as any).createObjectURL;
        const originalRevoke = (URL as any).revokeObjectURL;
        (URL as any).createObjectURL = createObjectURL;
        (URL as any).revokeObjectURL = revokeObjectURL;

        try {
            render(
                <DataIssueDialog
                    isOpen
                    reason="parse"
                    onDismiss={() => { }}
                    onReset={() => { }}
                />
            );
            await userEvent.click(screen.getByRole('button', { name: /Export raw data/ }));

            expect(createObjectURL).toHaveBeenCalled();
            expect(blobParts).toHaveLength(1);
            expect(blobParts[0].parts).toEqual([rawCorrupt]);
            expect(blobParts[0].options?.type).toBe('application/json');
        } finally {
            (URL as any).createObjectURL = originalCreate;
            (URL as any).revokeObjectURL = originalRevoke;
            global.Blob = OriginalBlob;
        }
    });
});
