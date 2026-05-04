import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { authLocalService } from "@/shared/lib";
import { connectToSignalR, disconnectFromSignalR } from "@/modules/signalr/signalRSlice";
import { registerDefaultSignalRToastHandlers } from "@/modules/signalr/signalRToastHandlers";
import { AppDispatch } from "./StoreProvider";

/**
 * Должен рендериться внутри BrowserRouter: после логина меняется pathname,
 * иначе эффект с [dispatch] один раз на /login так и не подключит хаб.
 */
export function SignalRBridge() {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();

    useEffect(() => {
        if (!authLocalService.hasAuthData()) {
            void dispatch(disconnectFromSignalR());
            return;
        }

        void dispatch(connectToSignalR());
        const unregisterToasts = registerDefaultSignalRToastHandlers();

        return () => {
            unregisterToasts();
        };
    }, [dispatch, location.pathname]);

    return null;
}
