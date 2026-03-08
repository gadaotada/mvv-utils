import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseCountDownOptions = {
    autoStart?: boolean;
    intervalMs?: number;
    step?: number;
    onComplete?: () => void | Promise<void>;
};

export type UseCountDownControls = {
    value: number;
    isRunning: boolean;
    start: () => void;
    pause: () => void;
    reset: (nextValue?: number) => void;
    set: (nextValue: number) => void;
};

export function useCountDown(initialValue: number, options: UseCountDownOptions = {}): UseCountDownControls {
    const { autoStart = false, intervalMs = 1000, step = 1, onComplete } = options;

    const [value, setValue] = useState<number>(Math.max(0, initialValue));
    const [isRunning, setIsRunning] = useState<boolean>(autoStart);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const timerId = window.setInterval(() => {
            setValue((currentValue) => {
                if (currentValue <= 0) {
                    return 0;
                }

                const nextValue = Math.max(0, currentValue - Math.max(1, step));
                if (nextValue === 0) {
                    setIsRunning(false);
                    void onCompleteRef.current?.();
                }
                return nextValue;
            });
        }, Math.max(1, intervalMs));

        return () => {
            window.clearInterval(timerId);
        };
    }, [intervalMs, isRunning, step]);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(
        (nextValue?: number) => {
            setValue(Math.max(0, nextValue ?? initialValue));
            setIsRunning(autoStart);
        },
        [autoStart, initialValue],
    );

    const set = useCallback((nextValue: number) => {
        setValue(Math.max(0, nextValue));
    }, []);

    return useMemo(
        () => ({
            value,
            isRunning,
            start,
            pause,
            reset,
            set,
        }),
        [isRunning, pause, reset, set, start, value],
    );
}
