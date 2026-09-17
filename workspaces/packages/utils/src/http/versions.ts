export const versions = {
    "1.1": "1.1", "2.0": "2.0", "3.0": "3.0"
} as const

export type Version = keyof typeof versions