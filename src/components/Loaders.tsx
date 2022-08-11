type Props = {
    show: boolean
}
export const SpinLoader = ({show}: Props) => {
    return (
        <div className={"spin-loader"} hidden={!show}/>
    )
}

export const BlocksLoader = ({show}: Props) => {
    return (
        <div className={"blocks-loader"}
             style={{display: show ? "block" : "none", height: 15, width: 15}}>
            <div></div>
            <div></div>
            <div></div>
        </div>
    )
}

