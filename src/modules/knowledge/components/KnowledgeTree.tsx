"use client";

import { useState } from "react";
import { generatePath, Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { env } from "@/env";
import type { KnowledgeTreeNode } from "@/modules/knowledge/lib/knowledgeTree";

type Props = {
    nodes: KnowledgeTreeNode[];
    searchSuffix: string;
    currentSlug?: string;
    canEdit: boolean;
    onAddChild: (parentId: string) => void;
    depth: number;
};

function TreeRow({
    item,
    children,
    searchSuffix,
    currentSlug,
    canEdit,
    onAddChild,
    depth,
}: {
    item: KnowledgeTreeNode["item"];
    children: KnowledgeTreeNode[];
    searchSuffix: string;
    currentSlug?: string;
    canEdit: boolean;
    onAddChild: (parentId: string) => void;
    depth: number;
}) {
    const hasKids = children.length > 0;
    const [expanded, setExpanded] = useState(true);

    return (
        <li>
            <div className="group flex items-start gap-0.5">
                {hasKids ? (
                    <button
                        type="button"
                        className="mt-1.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-expanded={expanded}
                        aria-label={expanded ? "Свернуть" : "Развернуть"}
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="mt-1.5 inline-block w-5 shrink-0" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        <Link
                            to={
                                generatePath(env.ROUTE_KNOWLEDGE_ARTICLE, {
                                    slug: item.slug,
                                }) + searchSuffix
                            }
                            className={`block min-w-0 flex-1 rounded px-1.5 py-1 text-sm transition-colors hover:bg-accent ${
                                currentSlug === item.slug
                                    ? "bg-accent font-medium text-foreground"
                                    : "text-foreground/90"
                            }`}
                        >
                            <span className="flex min-w-0 items-baseline gap-1.5">
                                <span className="truncate">{item.title}</span>
                                {item.projectName ? (
                                    <span className="shrink-0 truncate text-[11px] font-normal text-muted-foreground">
                                        · {item.projectName}
                                    </span>
                                ) : null}
                            </span>
                        </Link>
                        {canEdit && (
                            <button
                                type="button"
                                className="shrink-0 rounded p-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                                title="Дочерняя статья"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddChild(item.id);
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>
                    {hasKids && expanded && (
                        <KnowledgeTree
                            nodes={children}
                            searchSuffix={searchSuffix}
                            currentSlug={currentSlug}
                            canEdit={canEdit}
                            onAddChild={onAddChild}
                            depth={depth + 1}
                        />
                    )}
                </div>
            </div>
        </li>
    );
}

export function KnowledgeTree({ nodes, searchSuffix, currentSlug, canEdit, onAddChild, depth }: Props) {
    return (
        <ul
            className={
                depth ? "ml-2 border-l border-border/80 pl-2.5 space-y-0.5" : "space-y-0.5"
            }
        >
            {nodes.map(({ item, children }) => (
                <TreeRow
                    key={item.id}
                    item={item}
                    children={children}
                    searchSuffix={searchSuffix}
                    currentSlug={currentSlug}
                    canEdit={canEdit}
                    onAddChild={onAddChild}
                    depth={depth}
                />
            ))}
        </ul>
    );
}
