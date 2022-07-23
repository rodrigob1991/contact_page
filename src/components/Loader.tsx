type Props = {
    show: boolean
}
export const Loader = ({show}: Props) => {
    return (
        <div className={"loader"} hidden={!show}/>
    )
}