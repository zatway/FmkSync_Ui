import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui_shadcn/card";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { Label } from "@/shared/ui_shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui_shadcn/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui_shadcn/dialog";
import {
    useApproveRegistrationMutation,
    useDeleteAdminUserMutation,
    useGetAdminUsersQuery,
    useGetPendingRegistrationsQuery,
    useLazyGetDepartmentUsersQuery,
    useLazyGetPositionUsersQuery,
    useRejectRegistrationMutation,
    useUpdateAdminUserMutation,
    useUpdateUserRoleMutation,
} from "@/modules/admin/api/adminApi";
import type { AdminUserListItemDto } from "@/modules/admin/api/adminApi";
import {
    useAddedDepartmentsMutation,
    useAddedPositionsMutation,
    useDeleteDepartmentMutation,
    useDeletePositionMutation,
    useGetDepartmentsQuery,
    useGetPositionsQuery,
} from "@/modules/organization/api/organizationApi";
import { UserRole } from "@/types/dto/enums/UserRole";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/lib";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import { Trash2 } from "lucide-react";

const AdminPage = () => {
    const { data: registrations = [], isLoading: regLoading } = useGetPendingRegistrationsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetAdminUsersQuery();
    const [approve, { isLoading: approving }] = useApproveRegistrationMutation();
    const [reject, { isLoading: rejecting }] = useRejectRegistrationMutation();
    const [updateRole, { isLoading: roleSaving }] = useUpdateUserRoleMutation();
    const [updateUser, { isLoading: userSaving }] = useUpdateAdminUserMutation();
    const [deleteUser, { isLoading: userDeleting }] = useDeleteAdminUserMutation();
    const { data: departments = [] } = useGetDepartmentsQuery();
    const [addDepartment, { isLoading: addingDep }] = useAddedDepartmentsMutation();
    const [addPosition, { isLoading: addingPos }] = useAddedPositionsMutation();
    const [deleteDepartment, { isLoading: deletingDep }] = useDeleteDepartmentMutation();
    const [deletePosition, { isLoading: deletingPos }] = useDeletePositionMutation();
    const [fetchDeptUsers, deptUsersState] = useLazyGetDepartmentUsersQuery();
    const [fetchPosUsers, posUsersState] = useLazyGetPositionUsersQuery();

    const [deptDeleteOpen, setDeptDeleteOpen] = useState(false);
    const [deptDeleteTarget, setDeptDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deptReassignDeptId, setDeptReassignDeptId] = useState("");
    const [deptReassignPosId, setDeptReassignPosId] = useState("");

    const [posDeleteOpen, setPosDeleteOpen] = useState(false);
    const [posDeleteTarget, setPosDeleteTarget] = useState<{
        id: string;
        name: string;
        departmentId: string;
    } | null>(null);
    const [posReassignToId, setPosReassignToId] = useState("");
    const [newDepartmentName, setNewDepartmentName] = useState("");
    const [newPositionName, setNewPositionName] = useState("");
    const [positionDepartmentId, setPositionDepartmentId] = useState<string>("");

    const allPositionsQuery = useGetPositionsQuery();
    const positionsList = allPositionsQuery.data ?? [];

    const deptReassignPositions = useGetPositionsQuery(deptReassignDeptId || undefined, {
        skip: !deptDeleteOpen || !deptReassignDeptId,
    });
    const deptReassignPosList = deptReassignPositions.data ?? [];

    useEffect(() => {
        if (!deptReassignDeptId) {
            setDeptReassignPosId("");
            return;
        }
        const list = deptReassignPositions.data ?? [];
        if (list.length === 0) {
            setDeptReassignPosId("");
            return;
        }
        setDeptReassignPosId((prev) => (list.some((p) => p.id === prev) ? prev : list[0]!.id));
    }, [deptReassignDeptId, deptReassignPositions.data]);

    const posReassignOptions = useMemo(() => {
        if (!posDeleteTarget?.departmentId) return [];
        return positionsList.filter(
            (p) => p.departmentId === posDeleteTarget.departmentId && p.id !== posDeleteTarget.id,
        );
    }, [positionsList, posDeleteTarget]);

    useEffect(() => {
        if (!posDeleteOpen || !posDeleteTarget) return;
        setPosReassignToId((prev) =>
            posReassignOptions.some((p) => p.id === prev)
                ? prev
                : posReassignOptions[0]?.id ?? "",
        );
    }, [posDeleteOpen, posDeleteTarget, posReassignOptions]);

    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

    const [editOpen, setEditOpen] = useState(false);
    const [editUser, setEditUser] = useState<AdminUserListItemDto | null>(null);
    const [editFullName, setEditFullName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editDepartmentId, setEditDepartmentId] = useState("");
    const [editPositionId, setEditPositionId] = useState("");

    const positionsForEdit = useGetPositionsQuery(editDepartmentId || undefined, {
        skip: !editDepartmentId || !editOpen,
    });
    const editPositions = positionsForEdit.data ?? [];

    useEffect(() => {
        if (!editOpen || !editUser) return;
        setEditFullName(editUser.fullName);
        setEditEmail(editUser.email);
        setEditPassword("");
        setEditDepartmentId(editUser.departmentId);
        setEditPositionId(editUser.positionId);
    }, [editOpen, editUser]);

    useEffect(() => {
        if (!editOpen || !editDepartmentId || editPositions.length === 0) return;
        if (!editPositions.some((p) => p.id === editPositionId)) {
            setEditPositionId(editPositions[0]!.id);
        }
    }, [editOpen, editDepartmentId, editPositions, editPositionId]);

    const filteredUsers = useMemo(() => {
        const query = q.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter !== "all" && u.role !== roleFilter) return false;
            if (!query) return true;
            return (
                u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
            );
        });
    }, [users, q, roleFilter]);

    const openEdit = (u: AdminUserListItemDto) => {
        setEditUser(u);
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editUser) return;
        try {
            await updateUser({
                userId: editUser.id,
                data: {
                    fullName: editFullName.trim(),
                    email: editEmail.trim(),
                    departmentId: editDepartmentId,
                    positionId: editPositionId,
                    newPassword: editPassword.trim() || undefined,
                },
            }).unwrap();
            toast.success("Сохранено");
            setEditOpen(false);
        } catch (e) {
            toast.error(getApiErrorMessage(e));
        }
    };

    return (
        <div className="min-w-0 max-w-full space-y-5 sm:space-y-6">
            <h1 className="text-xl font-bold sm:text-2xl">Админ-панель</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Подразделения и должности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="new-dep">Новое подразделение</Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <Input
                                id="new-dep"
                                value={newDepartmentName}
                                onChange={(e) => setNewDepartmentName(e.target.value)}
                                placeholder="Название отдела"
                            />
                            <Button
                                type="button"
                                disabled={addingDep || !newDepartmentName.trim()}
                                onClick={async () => {
                                    try {
                                        await addDepartment({ name: newDepartmentName.trim() }).unwrap();
                                        setNewDepartmentName("");
                                        toast.success("Подразделение добавлено");
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Добавить
                            </Button>
                        </div>
                    </div>
                    <ul className="rounded-md border divide-y text-sm">
                        {departments.map((d) => (
                            <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                <span>{d.name}</span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive shrink-0"
                                    disabled={deletingDep}
                                    aria-label="Удалить подразделение"
                                    onClick={() => {
                                        setDeptDeleteTarget({ id: d.id, name: d.name });
                                        setDeptReassignDeptId("");
                                        setDeptReassignPosId("");
                                        setDeptDeleteOpen(true);
                                        void fetchDeptUsers(d.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <div className="space-y-2">
                        <Label>Новая должность</Label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <Select value={positionDepartmentId} onValueChange={setPositionDepartmentId}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <SelectValue placeholder="Подразделение" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                value={newPositionName}
                                onChange={(e) => setNewPositionName(e.target.value)}
                                placeholder="Название должности"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                disabled={addingPos || !newPositionName.trim() || !positionDepartmentId}
                                onClick={async () => {
                                    try {
                                        await addPosition({
                                            name: newPositionName.trim(),
                                            departmentId: positionDepartmentId,
                                        }).unwrap();
                                        setNewPositionName("");
                                        toast.success("Должность добавлена");
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Добавить
                            </Button>
                        </div>
                    </div>
                    <ul className="rounded-md border divide-y text-sm max-h-48 overflow-y-auto">
                        {positionsList.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                <span>
                                    {p.name}
                                    {p.departmentId && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            —{" "}
                                            {departments.find((d) => d.id === p.departmentId)?.name ?? "отдел"}
                                        </span>
                                    )}
                                </span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive shrink-0"
                                    disabled={deletingPos}
                                    aria-label="Удалить должность"
                                    onClick={() => {
                                        setPosDeleteTarget({
                                            id: p.id,
                                            name: p.name,
                                            departmentId: p.departmentId ?? "",
                                        });
                                        setPosReassignToId("");
                                        setPosDeleteOpen(true);
                                        void fetchPosUsers(p.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Заявки на регистрацию</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {regLoading && <p className="text-muted-foreground">Загрузка…</p>}
                    {!regLoading && registrations.length === 0 && (
                        <p className="text-muted-foreground">Нет заявок</p>
                    )}
                    {registrations.map((r) => (
                        <div
                            key={r.id}
                            className="border rounded-md p-3 flex items-center justify-between gap-3"
                        >
                            <div>
                                <div className="font-medium">
                                    {r.fullName} ({r.email})
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Запрошенная роль: {r.requestedRole}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" disabled={approving} onClick={() => approve(r.id)}>
                                    Одобрить
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={rejecting}
                                    onClick={() => reject(r.id)}
                                >
                                    Отклонить
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Пользователи (одобренные)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {usersLoading && <p className="text-muted-foreground">Загрузка…</p>}
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Input
                            placeholder="Поиск по ФИО или email…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <Select
                            value={roleFilter}
                            onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
                        >
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Роль" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все роли</SelectItem>
                                {Object.values(UserRole).map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredUsers.map((u) => (
                        <div
                            key={u.id}
                            className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <UserAvatar
                                    userId={u.id}
                                    name={u.fullName}
                                    hasAvatar={u.hasAvatar === true}
                                    className="shrink-0"
                                />
                                <div className="min-w-0">
                                    <div className="font-medium truncate">
                                        {u.fullName}{" "}
                                        <span className="text-muted-foreground font-normal">({u.email})</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {u.departmentName} · {u.positionName}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" variant="outline" disabled={u.email === "admin@fmksync.local"} onClick={() => openEdit(u)}>
                                    Редактировать
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={userSaving || u.email === "admin@fmksync.local"}
                                    onClick={() =>
                                        updateUser({ userId: u.id, data: { isApproved: !u.isApproved } })
                                    }
                                >
                                    {u.isApproved ? "Деактивировать" : "Активировать"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="link"
                                    className="text-destructive"
                                    disabled={userDeleting || u.email === "admin@fmksync.local"}
                                    onClick={() => deleteUser({ userId: u.id })}
                                >
                                    Удалить
                                </Button>
                                <Select
                                    value={u.role}
                                    disabled={u.email === "admin@fmksync.local"}
                                    onValueChange={(role) =>
                                        updateRole({ userId: u.id, role: role as UserRole })
                                    }
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UserRole).map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                    {roleSaving && (
                        <p className="text-xs text-muted-foreground">Сохранение роли…</p>
                    )}
                    {userSaving && (
                        <p className="text-xs text-muted-foreground">Сохранение пользователя…</p>
                    )}
                    {userDeleting && (
                        <p className="text-xs text-muted-foreground">Удаление пользователя…</p>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={deptDeleteOpen}
                onOpenChange={(open) => {
                    setDeptDeleteOpen(open);
                    if (!open) setDeptDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Удаление подразделения</DialogTitle>
                    </DialogHeader>
                    {deptDeleteTarget && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="font-medium">«{deptDeleteTarget.name}»</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Будут безвозвратно удалены все проекты этого подразделения (задачи, вложения,
                                комментарии и т.д.).
                            </p>
                            {deptUsersState.isFetching && (
                                <p className="text-muted-foreground">Загрузка списка сотрудников…</p>
                            )}
                            {!deptUsersState.isFetching && (
                                <>
                                    {(deptUsersState.data ?? []).length > 0 ? (
                                        <ul className="max-h-40 overflow-y-auto rounded border divide-y">
                                            {(deptUsersState.data ?? []).map((u) => (
                                                <li key={u.id} className="px-2 py-1.5">
                                                    {u.fullName}{" "}
                                                    <span className="text-muted-foreground">({u.email})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground">В подразделении нет сотрудников.</p>
                                    )}
                                </>
                            )}
                            {(deptUsersState.data ?? []).length > 0 && (
                                <div className="space-y-2 rounded-md border p-3">
                                    <p className="text-xs text-muted-foreground">
                                        Переназначьте всех в другое подразделение и должность, либо удалите учётные
                                        записи сотрудников.
                                    </p>
                                    <div className="space-y-1">
                                        <Label>Подразделение для переноса</Label>
                                        <Select
                                            value={deptReassignDeptId}
                                            onValueChange={setDeptReassignDeptId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments
                                                    .filter((x) => x.id !== deptDeleteTarget.id)
                                                    .map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>
                                                            {d.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Должность после переноса</Label>
                                        <Select
                                            value={deptReassignPosId}
                                            onValueChange={setDeptReassignPosId}
                                            disabled={!deptReassignDeptId || deptReassignPosList.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Сначала выберите отдел" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {deptReassignPosList.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
                        {(deptUsersState.data ?? []).length > 0 && (
                            <>
                                <Button
                                    type="button"
                                    disabled={
                                        deletingDep ||
                                        deptUsersState.isFetching ||
                                        !deptReassignDeptId ||
                                        !deptReassignPosId
                                    }
                                    onClick={async () => {
                                        if (!deptDeleteTarget) return;
                                        try {
                                            await deleteDepartment({
                                                id: deptDeleteTarget.id,
                                                options: {
                                                    reassignToDepartmentId: deptReassignDeptId,
                                                    positionIdForReassignedUsers: deptReassignPosId,
                                                },
                                            }).unwrap();
                                            toast.success("Подразделение удалено");
                                            setDeptDeleteOpen(false);
                                            setDeptDeleteTarget(null);
                                        } catch (e) {
                                            toast.error(getApiErrorMessage(e));
                                        }
                                    }}
                                >
                                    Перенести сотрудников и удалить подразделение
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={deletingDep || deptUsersState.isFetching}
                                    onClick={async () => {
                                        if (!deptDeleteTarget) return;
                                        const n = (deptUsersState.data ?? []).length;
                                        if (
                                            !confirm(
                                                `Будут удалены учётные записи всех сотрудников этого подразделения (${n}), затем само подразделение. Это действие необратимо. Продолжить?`,
                                            )
                                        )
                                            return;
                                        try {
                                            await deleteDepartment({
                                                id: deptDeleteTarget.id,
                                                options: { deleteAllUsers: true },
                                            }).unwrap();
                                            toast.success("Подразделение удалено");
                                            setDeptDeleteOpen(false);
                                            setDeptDeleteTarget(null);
                                        } catch (e) {
                                            toast.error(getApiErrorMessage(e));
                                        }
                                    }}
                                >
                                    Удалить всех сотрудников и подразделение
                                </Button>
                            </>
                        )}
                        {(deptUsersState.data ?? []).length === 0 && !deptUsersState.isFetching && (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deletingDep}
                                onClick={async () => {
                                    if (!deptDeleteTarget) return;
                                    if (!confirm(`Удалить подразделение «${deptDeleteTarget.name}»?`)) return;
                                    try {
                                        await deleteDepartment({ id: deptDeleteTarget.id, options: {} }).unwrap();
                                        toast.success("Удалено");
                                        setDeptDeleteOpen(false);
                                        setDeptDeleteTarget(null);
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Удалить подразделение
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setDeptDeleteOpen(false);
                                setDeptDeleteTarget(null);
                            }}
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={posDeleteOpen}
                onOpenChange={(open) => {
                    setPosDeleteOpen(open);
                    if (!open) setPosDeleteTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Удаление должности</DialogTitle>
                    </DialogHeader>
                    {posDeleteTarget && (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="font-medium">«{posDeleteTarget.name}»</span>
                            </p>
                            {posUsersState.isFetching && (
                                <p className="text-muted-foreground">Загрузка списка сотрудников…</p>
                            )}
                            {!posUsersState.isFetching && (
                                <>
                                    {(posUsersState.data ?? []).length > 0 ? (
                                        <ul className="max-h-40 overflow-y-auto rounded border divide-y">
                                            {(posUsersState.data ?? []).map((u) => (
                                                <li key={u.id} className="px-2 py-1.5">
                                                    {u.fullName}{" "}
                                                    <span className="text-muted-foreground">({u.email})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground">На этой должности нет сотрудников.</p>
                                    )}
                                </>
                            )}
                            {(posUsersState.data ?? []).length > 0 && posReassignOptions.length > 0 && (
                                <div className="space-y-2 rounded-md border p-3">
                                    <Label>Перенести сотрудников на должность</Label>
                                    <Select value={posReassignToId} onValueChange={setPosReassignToId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите должность" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {posReassignOptions.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {(posUsersState.data ?? []).length > 0 && posReassignOptions.length === 0 && (
                                <p className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
                                    В этом подразделении нет другой должности для переноса. Добавьте должность в том же
                                    отделе или удалите учётные записи сотрудников ниже.
                                </p>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
                        {(posUsersState.data ?? []).length > 0 && posReassignOptions.length > 0 && (
                            <Button
                                type="button"
                                disabled={deletingPos || posUsersState.isFetching || !posReassignToId}
                                onClick={async () => {
                                    if (!posDeleteTarget) return;
                                    try {
                                        await deletePosition({
                                            id: posDeleteTarget.id,
                                            options: { reassignToPositionId: posReassignToId },
                                        }).unwrap();
                                        toast.success("Должность удалена");
                                        setPosDeleteOpen(false);
                                        setPosDeleteTarget(null);
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Перенести сотрудников и удалить должность
                            </Button>
                        )}
                        {(posUsersState.data ?? []).length > 0 && (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deletingPos || posUsersState.isFetching}
                                onClick={async () => {
                                    if (!posDeleteTarget) return;
                                    const n = (posUsersState.data ?? []).length;
                                    if (
                                        !confirm(
                                            `Будут удалены учётные записи всех сотрудников на этой должности (${n}), затем сама должность. Продолжить?`,
                                        )
                                    )
                                        return;
                                    try {
                                        await deletePosition({
                                            id: posDeleteTarget.id,
                                            options: { deleteAllUsers: true },
                                        }).unwrap();
                                        toast.success("Должность удалена");
                                        setPosDeleteOpen(false);
                                        setPosDeleteTarget(null);
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Удалить всех сотрудников и должность
                            </Button>
                        )}
                        {(posUsersState.data ?? []).length === 0 && !posUsersState.isFetching && (
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deletingPos}
                                onClick={async () => {
                                    if (!posDeleteTarget) return;
                                    if (!confirm(`Удалить должность «${posDeleteTarget.name}»?`)) return;
                                    try {
                                        await deletePosition({ id: posDeleteTarget.id, options: {} }).unwrap();
                                        toast.success("Удалено");
                                        setPosDeleteOpen(false);
                                        setPosDeleteTarget(null);
                                    } catch (e) {
                                        toast.error(getApiErrorMessage(e));
                                    }
                                }}
                            >
                                Удалить должность
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setPosDeleteOpen(false);
                                setPosDeleteTarget(null);
                            }}
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Редактирование пользователя</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>ФИО</Label>
                            <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Новый пароль (оставьте пустым, чтобы не менять)</Label>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Подразделение</Label>
                            <Select
                                value={editDepartmentId}
                                onValueChange={(v) => {
                                    setEditDepartmentId(v);
                                    setEditPositionId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Должность</Label>
                            <Select value={editPositionId} onValueChange={setEditPositionId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {editPositions.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="button" onClick={() => void saveEdit()} disabled={userSaving}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPage;
