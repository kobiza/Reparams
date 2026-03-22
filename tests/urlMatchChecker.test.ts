import { matchUrl } from '../src/js/utils/urlMatchChecker';

describe('matchUrl', () => {
    test('universal wildcard *://*/* matches any URL', () => {
        expect(matchUrl('https://google.com/path?q=1', '*://*/*')).toBe(true);
        expect(matchUrl('http://example.com/foo', '*://*/*')).toBe(true);
    });

    test('scheme+domain+wildcard matches correct domain', () => {
        expect(matchUrl('https://google.com/path?q=1', 'https://google.com/*')).toBe(true);
        expect(matchUrl('https://google.com/', 'https://google.com/*')).toBe(true);
    });

    test('scheme+domain+wildcard does not match different domain', () => {
        expect(matchUrl('https://other.com/path', 'https://google.com/*')).toBe(false);
    });

    test('subdomain wildcard matches subdomain', () => {
        expect(matchUrl('https://sub.google.com/page', '*://*.google.com/*')).toBe(true);
    });

    test('subdomain wildcard also matches root domain (subdomain group is optional)', () => {
        expect(matchUrl('https://google.com/page', '*://*.google.com/*')).toBe(true);
    });

    test('subdomain wildcard does not match completely different domain', () => {
        expect(matchUrl('https://otherdomain.com/page', '*://*.google.com/*')).toBe(false);
    });

    test('exact URL matches itself', () => {
        expect(matchUrl('https://google.com/path', 'https://google.com/path')).toBe(true);
    });

    test('exact URL does not match different path', () => {
        expect(matchUrl('https://google.com/other', 'https://google.com/path')).toBe(false);
    });

    test('.tld placeholder matches real TLDs', () => {
        expect(matchUrl('https://google.com/', 'https://google.tld/*')).toBe(true);
        expect(matchUrl('https://example.org/', 'https://example.tld/*')).toBe(true);
    });
});
