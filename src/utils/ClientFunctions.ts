export const getPrivateToken = () => {
    return sessionStorage.getItem(process.env.NEXT_PUBLIC_PRIVATE_TOKEN_STORAGE_KEY as string)
}