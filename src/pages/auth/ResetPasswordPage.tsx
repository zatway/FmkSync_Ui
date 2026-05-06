import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { useResetPasswordMutation } from "@/modules/auth/api/authApi";
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

const schema = z.object({
    token: z.string().min(1, "Укажите токен из письма"),
    newPassword: z.string().min(6, "Минимум 6 символов"),
});

type Values = z.infer<typeof schema>;

const ResetPasswordPage = () => {
    const [params] = useSearchParams();
    const tokenFromUrl = params.get("token") ?? "";

    const defaultToken = useMemo(() => tokenFromUrl, [tokenFromUrl]);

    const [reset, { isLoading }] = useResetPasswordMutation();

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { token: defaultToken, newPassword: "" },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    useEffect(() => {
        if (tokenFromUrl) form.setValue("token", tokenFromUrl);
    }, [tokenFromUrl, form]);

    const submit = async (values: Values) => {
        try {
            await reset({ token: values.token.trim(), newPassword: values.newPassword }).unwrap();
            toast.success("Пароль обновлён. Сейчас откроется вход.");
            window.location.href = AppRoutes.LOGIN;
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
            <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                <h1 className="text-xl font-semibold">Новый пароль</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="token"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Токен</FormLabel>
                                    <FormControl>
                                        <Input autoComplete="off" readOnly {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Новый пароль</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            Сохранить
                        </Button>
                    </form>
                </Form>
                <Button variant="link" className="px-0" asChild>
                    <Link to={AppRoutes.LOGIN}>На страницу входа</Link>
                </Button>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
