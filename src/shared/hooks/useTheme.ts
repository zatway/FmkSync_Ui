import { useContext } from "react";
import { SystemContext } from "@/app/providers/SystemProvider";

export const useTheme = () => {
    const context = useContext(SystemContext);

    if (!context) {
        throw new Error("useTheme must be used within a SystemProvider");
    }

    const { theme, setTheme, toggleTheme } = context;

    return { theme, setTheme, toggleTheme };
};
