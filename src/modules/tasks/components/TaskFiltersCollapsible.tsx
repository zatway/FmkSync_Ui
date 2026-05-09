"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/shared/ui_shadcn/button";
import { cn } from "@/shared/lib/ui_shadcn/utils";
import { ChevronDown, ChevronUp, ListFilter } from "lucide-react";

type Props = {
    children: ReactNode;
    className?: string;
    /** На мобильных фильтры изначально свёрнуты, на md+ всегда видны */
    defaultOpen?: boolean;
};

export function TaskFiltersCollapsible({ children, className, defaultOpen = false }: Props) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex md:hidden">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 sm:justify-start"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                >
                    <ListFilter className="h-4 w-4 shrink-0" />
                    {open ? (
                        <>
                            Скрыть фильтры
                            <ChevronUp className="h-4 w-4 shrink-0" />
                        </>
                    ) : (
                        <>
                            Фильтры
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        </>
                    )}
                </Button>
            </div>
            <div className={cn("md:block", open ? "max-md:block" : "max-md:hidden")}>{children}</div>
        </div>
    );
}
