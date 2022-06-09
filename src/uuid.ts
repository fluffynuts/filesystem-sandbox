import UUID from "pure-uuid";

export function uuid() {
    return new UUID(4).toString();
}
