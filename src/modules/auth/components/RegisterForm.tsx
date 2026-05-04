import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRegisterMutation } from "@/modules/auth/api/authApi";
import { Logo } from "@/shared/ui/Logo/Logo";
import { Input } from "@/shared/ui_shadcn/input";
import { Button } from "@/shared/ui_shadcn/button";
import { UserRole } from "@/types/dto/enums/UserRole";
import { Checkbox } from "@/shared/ui_shadcn/checkbox";
import { DepartmentSelect, PositionSelect } from "@/modules/organization";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { getApiErrorMessage } from "@/shared/lib";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/ui_shadcn/form";

const roleMap = new Map<UserRole, string>([
    [UserRole.Admin, "Администратор"],
    [UserRole.Employee, "Сотрудник"],
    [UserRole.Manager, "Менеджер"],
    [UserRole.ReadOnly, "Наблюдатель"],
]);

const registerSchema = z
    .object({
        fullName: z.string().min(1, "Введите ФИО"),
        email: z.string().min(1, "Укажите email").email("Некорректный email"),
        password: z.string().min(6, "Минимум 6 символов"),
        confirmPassword: z.string().min(1, "Подтвердите пароль"),
        departmentId: z.string().min(1, "Выберите подразделение"),
        positionId: z.string().min(1, "Выберите должность"),
        role: z.nativeEnum(UserRole),
        agree: z.boolean().refine((v) => v === true, "Нужно согласие с условиями"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    });

type RegisterValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);
    const [registerMut, { isLoading }] = useRegisterMutation();

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            departmentId: "",
            positionId: "",
            role: UserRole.Employee,
            agree: false,
        },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    const departmentId = form.watch("departmentId");

    const handleSubmit = async (values: RegisterValues) => {
        try {
            await registerMut({
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                password: values.password,
                role: values.role,
                departmentId: values.departmentId,
                positionId: values.positionId,
            }).unwrap();

            setShowSuccess(true);
            setTimeout(() => navigate(AppRoutes.LOGIN), 4000);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-lg border">
            <div className="flex justify-center mb-6">
                <Logo height={150} />
            </div>

            <div className="text-center mb-6">
                <h2 className="font-bold text-lg">Регистрация</h2>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ФИО</FormLabel>
                                <FormControl>
                                    <Input autoComplete="name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" autoComplete="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Пароль</FormLabel>
                                <FormControl>
                                    <Input type="password" autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Повторите пароль</FormLabel>
                                <FormControl>
                                    <Input type="password" autoComplete="new-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Подразделение</FormLabel>
                                <FormControl>
                                    <DepartmentSelect
                                        selectedDepartmentId={field.value || undefined}
                                        onChange={(id) => {
                                            field.onChange(id ?? "");
                                            form.setValue("positionId", "");
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="positionId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Должность</FormLabel>
                                <FormControl>
                                    <PositionSelect
                                        departmentId={departmentId || undefined}
                                        selectedPositionId={field.value || undefined}
                                        onChange={(id) => field.onChange(id ?? "")}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Роль</FormLabel>
                                <FormControl>
                                    <select
                                        className="border rounded-md p-2 bg-background w-full h-10"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value as UserRole)}
                                    >
                                        {Object.values(UserRole).map((role) => (
                                            <option key={role} value={role}>
                                                {roleMap.get(role)}
                                            </option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="agree"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start gap-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(v) => field.onChange(v === true)}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal text-sm">
                                        Я согласен с пользовательским соглашением
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2"
                    >
                        {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                    </Button>
                    <button
                        type="button"
                        className="text-sm text-muted-foreground hover:underline text-center w-full"
                        onClick={() => navigate(AppRoutes.LOGIN)}
                    >
                        Есть аккаунт? Войти
                    </button>
                </form>
            </Form>

            {showSuccess && (
                <div className="mt-6 rounded-lg border p-4 bg-green-50 text-sm text-center dark:bg-green-950/30">
                    Регистрация прошла успешно. Ожидайте письмо на почту после подтверждения администратором.
                </div>
            )}
        </div>
    );
};

export default RegisterForm;
