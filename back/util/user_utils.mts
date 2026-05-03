import { getStore } from "@netlify/blobs";
import bcrypt from "bcrypt";
import { ok, err, type Result } from "true-myth/result";

export interface User {
    username: string,
    password_hash: string
};

export enum GetUserError {
    UserNotFound
}
export async function get_user(username: string): Promise<Result<User, GetUserError>> {
    const user: User | null = await getStore("users").get(username, { consistency: "strong", type: "json" });
    if (user === null) {
        return err(GetUserError.UserNotFound);
    }
    return ok(user);
}

export enum RegisterError {
    UsernameExists
}
export async function register_user(username: string, password: string): Promise<Result<User, RegisterError>> {
    if (await getStore("users").get(username, { consistency: "strong" }) != null) {
        return err(RegisterError.UsernameExists);
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = { username, password_hash };
    await getStore("users").setJSON(username, user);
    return ok(user);
}

export async function check_user_password(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password_hash);
}
