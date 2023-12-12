export const replaceItem = <T>(arr: Array<T>, value: T, index: number): Array<T> => {
    return [...arr.slice(0, index), value, ...arr.slice(index + 1)]
}

export const removeItem = <T>(arr: Array<T>, index: number): Array<T> => {
    return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

export const toTrueObj = <T>(arr: Array<T>, getKey: (item: T) => string) => {
    return arr.reduce<Record<string, true>>((acc, v) => {
        acc[getKey(v)] = true

        return acc
    }, {})
}
