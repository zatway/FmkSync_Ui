import {ProjectHistoryEntryDto} from "@/types/dto/projects/ProjectHistoryEntryDto";
import {Card, CardContent, CardHeader} from "@/shared/ui_shadcn/card";
import {UserAvatar} from "@/shared/ui/UserAvatar";
import {format, parseISO} from "date-fns";
import {ru} from "date-fns/locale";

const emptyGuid = "00000000-0000-0000-0000-000000000000";

function renderValue(v: unknown) {
    if (v === null || v === undefined || v === "") {
        return <span className="text-muted-foreground italic">пусто</span>;
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        return String(v);
    }
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

export function HistoryEntry({ entry }: { entry: ProjectHistoryEntryDto }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-muted/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {entry.changedBy.id && entry.changedBy.id !== emptyGuid ? (
                            <UserAvatar
                                size="sm"
                                userId={entry.changedBy.id}
                                name={entry.changedBy.name}
                                hasAvatar={entry.changedBy.hasAvatar === true}
                            />
                        ) : (
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
                                aria-hidden
                            >
                                {entry.changedBy.name?.trim()?.[0]?.toUpperCase() ?? "?"}
                            </div>
                        )}
                        <div>
                            <p className="font-medium">{entry.changedBy.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {format(parseISO(entry.changedAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                            </p>
                        </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Изменено поле: <span className="font-semibold text-foreground">{entry.field}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p className="text-muted-foreground">Было:</p>
                        <p className="mt-1 font-medium break-words">
                            {renderValue(entry.oldValue)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Стало:</p>
                        <p className="mt-1 font-medium break-words">
                            {renderValue(entry.newValue)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
