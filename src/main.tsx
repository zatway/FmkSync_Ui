import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from "./app/App.tsx";
import {store} from "./app/providers/StoreProvider.ts";
import {Provider} from "react-redux";
import { SystemProvider } from "@/app/providers/SystemProvider";
import './globals.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <SystemProvider>
            <Provider store={store}>
                <App/>
            </Provider>
        </SystemProvider>
    </StrictMode>
)
