import os from "node:os";
import { env } from "node:process";

export const getEnv = () => {
    const result = { ...env };
    return result;
};