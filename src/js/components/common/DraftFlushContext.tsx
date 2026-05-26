import { createContext, useContext, useEffect, useRef } from "react";

type DraftFlushRegistry = {
    register: (fn: () => void) => () => void;
    flushAll: () => void;
}

export const createDraftFlushRegistry = (): DraftFlushRegistry => {
    const callbacks = new Set<() => void>()
    return {
        register: (fn) => {
            callbacks.add(fn)
            return () => callbacks.delete(fn)
        },
        flushAll: () => callbacks.forEach(fn => fn()),
    }
}

const noop: DraftFlushRegistry = {
    register: () => () => {},
    flushAll: () => {},
}

export const DraftFlushContext = createContext<DraftFlushRegistry>(noop)

export const useRegisterDraftFlush = (flush: () => void) => {
    const { register } = useContext(DraftFlushContext)
    const flushRef = useRef(flush)
    flushRef.current = flush

    useEffect(() => register(() => flushRef.current()), [register])
}
