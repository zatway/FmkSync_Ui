import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/shared/ui_shadcn/button";
import { Input } from "@/shared/ui_shadcn/input";
import { useForgotPasswordMutation } from "@/modules/auth/api/authApi";
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
    email: z.string().min(1, "Укажите email").email("Некорректный email"),
});

type Values = z.infer<typeof schema>;

const ForgotPasswordPage = () => {
    const [done, setDone] = useState(false);
    const [forgot, { isLoading }] = useForgotPasswordMutation();

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    const submit = async (values: Values) => {
        try {
            await forgot({ email: values.email.trim() }).unwrap();
            setDone(true);
        } catch (err) {
            toast.error(getApiErrorMessage(err));
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
            <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
                <h1 className="text-xl font-semibold">Восстановление пароля</h1>
                {done ? (
                    <p className="text-sm text-muted-foreground">
                        Если указанный адрес зарегистрирован, на почту отправлена ссылка для сброса пароля.
                    </p>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                autoComplete="email"
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
                                Отправить ссылку
                            </Button>
                        </form>
                    </Form>
                )}
                <Button variant="link" className="px-0" asChild>
                    <Link to={AppRoutes.LOGIN}>Назад ко входу</Link>
                </Button>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
