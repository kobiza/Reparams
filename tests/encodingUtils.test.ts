import { decodeIfEncoded } from '../src/js/utils/encodingUtils'

describe('decodeIfEncoded', () => {
    test('plain string is returned unchanged', () => {
        expect(decodeIfEncoded('hello')).toBe('hello')
    })

    test('space-encoded value is decoded', () => {
        expect(decodeIfEncoded('John%20Doe')).toBe('John Doe')
    })

    test('multiple encoded characters are all decoded', () => {
        expect(decodeIfEncoded('hello%20world%21')).toBe('hello world!')
    })

    test('encoded equals sign is decoded', () => {
        expect(decodeIfEncoded('key%3Dvalue')).toBe('key=value')
    })

    test('encoded ampersand is decoded', () => {
        expect(decodeIfEncoded('a%26b')).toBe('a&b')
    })

    test('encoded plus sign is decoded', () => {
        expect(decodeIfEncoded('foo%2Bbar')).toBe('foo+bar')
    })

    test('encoded forward slash is decoded', () => {
        expect(decodeIfEncoded('path%2Fto')).toBe('path/to')
    })

    test('double-encoded value is only decoded one pass (%2520 → %20, not space)', () => {
        expect(decodeIfEncoded('John%2520Doe')).toBe('John%20Doe')
    })

    test('malformed percent sequence is returned unchanged without throwing', () => {
        expect(() => decodeIfEncoded('bad%ZZcode')).not.toThrow()
        expect(decodeIfEncoded('bad%ZZcode')).toBe('bad%ZZcode')
    })

    test('empty string is returned as empty string', () => {
        expect(decodeIfEncoded('')).toBe('')
    })
})
