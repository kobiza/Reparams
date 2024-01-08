import {removeItem, replaceItem, toTrueObj} from "../src/js/utils/arrayUtils";

describe('replaceItem', () => {
    test('sanity', () => {
        const input = ['a', 'b', 'c']
        expect(replaceItem(input, 'b2', 1)).toEqual(['a', 'b2', 'c']);
    })
})

describe('removeItem', () => {
    test('sanity', () => {
        const input = ['a', 'b', 'c']
        expect(removeItem(input, 1)).toEqual(['a', 'c']);
    })
})

describe('toTrueObj', () => {
    test('sanity', () => {
        const input = [{name: 'a'}, {name: 'b'}, {name: 'c'}]
        expect(toTrueObj(input, v => v.name)).toEqual({
            a: true,
            b: true,
            c: true,
        });
    })
})


