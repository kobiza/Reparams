/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useDataIssue } from '../src/js/utils/useDataIssue';
import { localStorageKey } from '../src/js/utils/consts';

function Probe() {
    const { issue, dismiss } = useDataIssue();
    return (
        <div>
            <span data-testid="reason">{issue?.reason ?? 'none'}</span>
            <button onClick={dismiss}>Dismiss</button>
        </div>
    );
}

beforeEach(() => {
    localStorage.clear();
});

describe('useDataIssue', () => {
    test('no issue when localStorage is empty', () => {
        render(<Probe />);
        expect(screen.getByTestId('reason')).toHaveTextContent('none');
    });

    test('no issue when stored data is valid', () => {
        localStorage.setItem(
            localStorageKey,
            JSON.stringify({ modelVersion: 1, packages: {} })
        );
        render(<Probe />);
        expect(screen.getByTestId('reason')).toHaveTextContent('none');
    });

    test('surfaces parse reason on invalid JSON', () => {
        localStorage.setItem(localStorageKey, 'not-json');
        render(<Probe />);
        expect(screen.getByTestId('reason')).toHaveTextContent('parse');
    });

    test('surfaces future-version reason when modelVersion > current', () => {
        localStorage.setItem(
            localStorageKey,
            JSON.stringify({ modelVersion: 999, packages: {} })
        );
        render(<Probe />);
        expect(screen.getByTestId('reason')).toHaveTextContent('future-version');
    });

    test('dismiss clears the issue in state and leaves localStorage untouched', () => {
        localStorage.setItem(localStorageKey, 'not-json');
        render(<Probe />);
        expect(screen.getByTestId('reason')).toHaveTextContent('parse');

        act(() => {
            screen.getByText('Dismiss').click();
        });

        expect(screen.getByTestId('reason')).toHaveTextContent('none');
        expect(localStorage.getItem(localStorageKey)).toBe('not-json');
    });
});
