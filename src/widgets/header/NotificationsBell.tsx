import { useDispatch, useSelector } from "react-redux";
import { Bell } from "lucide-react";
import { Button } from "@/shared/ui_shadcn/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui_shadcn/popover";
import {
    clearAll,
    markAllRead,
    markRead,
    selectUnreadCount,
    type AppNotificationItem,
} from "@/modules/notifications/notificationsSlice";
import type { AppDispatch, RootState } from "@/app/providers/StoreProvider";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function NotificationsBell() {
    const dispatch = useDispatch<AppDispatch>();
    const items = useSelector((s: RootState) => s.notifications.items);
    const unread = useSelector((s: RootState) => selectUnreadCount(s));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="relative shrink-0" aria-label="Уведомления">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(100%,380px)] max-w-[calc(100%-1rem)] p-0 sm:max-w-[380px]">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Уведомления</span>
                    <div className="flex gap-1">
                        {unread > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => dispatch(markAllRead())}
                            >
                                Прочитать все
                            </Button>
                        )}
                        {items.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => dispatch(clearAll())}
                            >
                                Очистить
                            </Button>
                        )}
                    </div>
                </div>
                <div className="max-h-[min(70vh,360px)] overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Пока нет уведомлений</p>
                    ) : (
                        <ul className="divide-y">
                            {items.map((n: AppNotificationItem) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-accent ${
                                            !n.read ? "bg-primary/5" : ""
                                        }`}
                                        onClick={() => {
                                            if (!n.read) dispatch(markRead(n.id));
                                        }}
                                    >
                                        <div className="font-medium leading-snug">{n.title}</div>
                                        {n.body && (
                                            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                                        )}
                                        <div className="mt-1 text-[10px] text-muted-foreground">
                                            {format(parseISO(n.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                                            {!n.read && (
                                                <span className="ml-2 text-primary">не прочитано</span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
