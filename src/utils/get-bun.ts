import { states } from "../states";
import { join } from "path";

export const getBun = () => {
    if (!states.pull('absoluteBun')) {
        return 'bun';
    }

    const USER_HOME = process.env.HOME || process.env.USERPROFILE!;
    return join(USER_HOME, '.bun', 'bin', 'bun');
};