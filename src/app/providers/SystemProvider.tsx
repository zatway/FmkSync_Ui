import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {themeLocalService} from "@/shared/lib/localStorageService/themeLocalStorage";

export type Theme = "light" | "dark";

type SystemData = Record<string, unknown>;

type SystemContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    systemData: SystemData;
    setSystemData: (patch: Partial<SystemData>) => void;
};

const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";

    const savedTheme = themeLocalService.getTheme();
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const SystemContext = createContext<SystemContextValue | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export const SystemProvider = ({ children }: Props) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const [systemData, setSystemDataState] = useState<SystemData>({});

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        themeLocalService.setTheme(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const setSystemData = (patch: Partial<SystemData>) => {
        setSystemDataState((prev) => ({ ...prev, ...patch }));
    };

    const value = useMemo(
        () => ({ theme, setTheme, toggleTheme, systemData, setSystemData }),
        [theme, systemData]
    );

    return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};
