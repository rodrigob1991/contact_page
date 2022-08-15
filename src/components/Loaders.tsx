type Props = {
    show: boolean
}
export const SpinLoader = ({show}: Props) => {
    return (
        <div className={"spin-loader"} style={{display: show ? "block" : "none"}}/>
    )
}

export const BlocksLoader = ({show}: Props) => {
    return (
        <div className={"blocks-loader"} style={{display: show ? "block" : "none"}}>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
}

