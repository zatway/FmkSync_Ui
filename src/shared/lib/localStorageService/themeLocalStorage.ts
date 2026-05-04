import { localStorageCore } from "../storageHelper/localStorageCore";
import {Theme} from "@/app/providers/SystemProvider";

const THEME_KEY = 'theme';

export const themeLocalService = {
    getTheme: (): Theme | null => {
        return localStorageCore.getItem<Theme>(THEME_KEY);
    },
    setTheme: (theme: Theme): void => {
        localStorageCore.setItem(THEME_KEY, theme);
    },
};
