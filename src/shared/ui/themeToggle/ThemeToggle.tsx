import { Sun, Moon } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { useTheme } from "@/shared/hooks/useTheme";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
        >
            {theme === "dark" ? (
                <Sun size={18} />
            ) : (
                <Moon size={18} />
            )}
        </Button>
    );
};

ThemeToggle.displayName = "ThemeToggle"

export {ThemeToggle};
