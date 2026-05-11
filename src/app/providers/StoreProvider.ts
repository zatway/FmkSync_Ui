import { configureStore } from '@reduxjs/toolkit'
import {api} from "../../shared/lib";
import "@/modules/tasks/api/tasksApi";
import "@/modules/taskComments/api/taskCommentsApi";
import "@/modules/projects/api/projectsApi";
import "@/modules/knowledge/api/knowledgeApi";
import "@/modules/search/api/searchApi";
import "@/modules/analytics/api/analyticsApi";
import "@/modules/organization/api/organizationApi";
import "@/modules/admin/api/adminApi";
import "@/shared/api/filesApi";
import signalRReducer, { connectToSignalR } from "@/modules/signalr/signalRSlice";
import notificationsReducer from "@/modules/notifications/notificationsSlice";

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        signalR: signalRReducer,
        notifications: notificationsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    connectToSignalR.fulfilled.type,
                    `${api.reducerPath}/executeQuery/fulfilled`,
                    `${api.reducerPath}/executeMutation/fulfilled`,
                ],
                ignoredPaths: [
                    `${api.reducerPath}.queries`,
                    `${api.reducerPath}.mutations`,
                    "signalR",
                ],
            },
        }).concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
