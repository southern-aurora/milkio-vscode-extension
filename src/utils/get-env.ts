import os from "node:os";
import { env } from "node:process";

export const getEnv = () => {
    const result = { ...env };
    const USER_HOME = process.env.HOME || process.env.USERPROFILE;
    if (os.type() === 'Windows_NT') {
        env.PATH = env.PATH + `;${USER_HOME}\\.bun\\bin`;
    } else {
        env.PATH = env.PATH + `:${USER_HOME}/.bun/bin`;
    }

    return result;
};