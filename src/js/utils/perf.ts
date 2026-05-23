declare const __DEV__: boolean;

const canMark = typeof performance !== 'undefined' && typeof performance.mark === 'function';

export const perfMark = (name: string) => {
    if (canMark) performance.mark(name);
};

export const perfMeasure = (name: string, startMark: string, endMark?: string) => {
    if (!canMark) return;
    try {
        performance.measure(name, startMark, endMark);
    } catch {}
};

const dumpPerf = () => {
    const measures = performance.getEntriesByType('measure').filter(e => e.name.startsWith('rp:'));
    const marks = performance.getEntriesByType('mark').filter(e => e.name.startsWith('rp:'));
    console.groupCollapsed('[ReParams perf] measures');
    console.table(measures.map(e => ({ name: e.name, 'ms': +e.duration.toFixed(2) })));
    console.groupEnd();
    console.groupCollapsed('[ReParams perf] marks (relative to timeOrigin)');
    console.table(marks.map(e => ({ name: e.name, 'ms since origin': +e.startTime.toFixed(2) })));
    console.groupEnd();
};

export const initPerfObservers = () => {
    if (!__DEV__) return;

    (window as any).__dumpPerf = dumpPerf;

    if (typeof PerformanceObserver === 'undefined') return;

    const longtaskObs = new PerformanceObserver((list) => {
        list.getEntries().forEach(e => {
            console.warn(`[ReParams perf] long task ${e.duration.toFixed(0)}ms`);
        });
    });
    try { longtaskObs.observe({ type: 'longtask', buffered: true }); } catch {}

    let cls = 0;
    const clsObs = new PerformanceObserver((list) => {
        list.getEntries().forEach((e: any) => { cls += e.value; });
    });
    try { clsObs.observe({ type: 'layout-shift', buffered: true }); } catch {}

    const fontObs = new PerformanceObserver((list) => {
        list.getEntries()
            .filter(e => e.name.includes('font') || e.name.includes('googleapis'))
            .forEach(e => {
                console.info(`[ReParams perf] font resource ${(e as PerformanceResourceTiming).duration.toFixed(0)}ms`, e.name);
            });
    });
    try { fontObs.observe({ type: 'resource', buffered: true }); } catch {}

    setTimeout(() => {
        console.info(`[ReParams perf] CLS after 1s: ${cls.toFixed(4)}`);
        dumpPerf();
    }, 1000);
};
