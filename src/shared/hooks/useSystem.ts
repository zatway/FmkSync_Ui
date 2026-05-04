import { useContext } from "react";
import { SystemContext } from "@/app/providers/SystemProvider";

export const useSystem = () => {
    const context = useContext(SystemContext);

    if (!context) {
        throw new Error("useSystem must be used within a SystemProvider");
    }

    return context;
};
