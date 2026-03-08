import { useEffect, useState } from "react";

export type UseMediaQueryOptions = {
    mobileMaxWidth?: number;
    tabletMaxWidth?: number;
};

export type UseMediaQueryResult = {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
};

function resolveMediaMatches(mobileMaxWidth: number, tabletMaxWidth: number): UseMediaQueryResult {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return {
            isMobile: false,
            isTablet: false,
            isDesktop: true,
        };
    }

    const isMobile = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`).matches;
    const isTablet = window.matchMedia(
        `(min-width: ${mobileMaxWidth + 1}px) and (max-width: ${tabletMaxWidth}px)`,
    ).matches;
    const isDesktop = window.matchMedia(`(min-width: ${tabletMaxWidth + 1}px)`).matches;

    return { isMobile, isTablet, isDesktop };
}

export function useMediaQuery(options: UseMediaQueryOptions = {}): UseMediaQueryResult {
    const { mobileMaxWidth = 767, tabletMaxWidth = 1024 } = options;

    const [matches, setMatches] = useState<UseMediaQueryResult>(() =>
        resolveMediaMatches(mobileMaxWidth, tabletMaxWidth),
    );

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        const mobileQuery = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`);
        const tabletQuery = window.matchMedia(
            `(min-width: ${mobileMaxWidth + 1}px) and (max-width: ${tabletMaxWidth}px)`,
        );
        const desktopQuery = window.matchMedia(`(min-width: ${tabletMaxWidth + 1}px)`);

        const onChange = (): void => {
            setMatches({
                isMobile: mobileQuery.matches,
                isTablet: tabletQuery.matches,
                isDesktop: desktopQuery.matches,
            });
        };

        onChange();

        mobileQuery.addEventListener("change", onChange);
        tabletQuery.addEventListener("change", onChange);
        desktopQuery.addEventListener("change", onChange);
        return () => {
            mobileQuery.removeEventListener("change", onChange);
            tabletQuery.removeEventListener("change", onChange);
            desktopQuery.removeEventListener("change", onChange);
        };
    }, [mobileMaxWidth, tabletMaxWidth]);

    return matches;
}
