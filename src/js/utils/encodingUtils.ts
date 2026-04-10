export function decodeIfEncoded(value: string): string {
    try {
        const decoded = decodeURIComponent(value)
        return decoded !== value ? decoded : value
    } catch {
        return value // malformed percent sequence — leave as-is
    }
}
