import { Callable } from "./type"

export const isCallable = (v: unknown) : v is Callable => typeof v === "function" && !v.toString().startsWith("class")