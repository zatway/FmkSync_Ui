import lightLogo from "@/shared/assets/icons/lightLogo.png";
import darkLogo from "@/shared/assets/icons/darkLogo.png";
import {FC} from "react";
import {themeLocalService} from "@/shared/lib/localStorageService/themeLocalStorage";
import {Theme} from "@/app/providers/SystemProvider";

interface LogoProps {
    mode?: Theme;
    width?: number;
    height?: number;
}

export const Logo: FC<LogoProps> = ({width, height, mode = themeLocalService.getTheme()}) => {
    return (
        mode === 'light' ?
            <img
                style={{width: width, height: height}}
                src={lightLogo}
                alt="komSync Logo"
                className="h-10 w-auto"
            /> :
            <img
                style={{width: width, height: height}}
                src={darkLogo}
                alt="komSync Logo"
                className="h-10 w-auto"
            />
    );
};
