import styled from "@emotion/styled"
import {getContainedString, isEmpty} from "../utils/StringFunctions"
import {
    createAnchor,
    createDiv,
    createImage,
    createSpan,
    createText,
    getTexts,
    hasSiblingOrParentSibling,
    isAnchor,
    isDiv,
    isSpan,
    isText,
    lookUpDivParent,
    positionCaretOn,
    removeNodesFromOneSide
} from "../utils/DomManipulations"
import React, {useEffect, useRef, useState} from "react"
import {ImageSelector, NumberInput, TextInput} from "./FormComponents"
import {FcPicture} from "react-icons/fc"
import {useRecordState} from "../utils/Hooks"
import {DeleteOrRecoverButton} from "./Buttons"

type Props = {
    show?: boolean
    isAsking?: (asking: boolean) => void
    fontSize: number
}
type OptionType = "defaultText" | "span" | "link" | "image"
type OptionTargetElement = HTMLSpanElement | HTMLAnchorElement | HTMLImageElement
type OptionTargetNode = Text | OptionTargetElement
type GetOptionTargetNode = (text: string, isLast: boolean)=> OptionTargetNode

export const Pallet = ({show=true, isAsking, fontSize}: Props) => {
    const isAskingTrue = () => {
        if (isAsking) {
            isAsking(true)
        }
    }
    const isAskingFalse = () => {
        if (isAsking) {
            isAsking(false)
        }
    }
    const lastElementAddedId = "lastElementAdded"
    const getLastElementAdded = () => {
        return document.querySelector("#" + lastElementAddedId) as OptionTargetElement | null
    }

    const handleMouseDown = (e: React.MouseEvent<Element>) => {
        e.preventDefault()
    }

    const handleCollapsedSelection = (optionType: OptionType, newNode: OptionTargetNode, anchor: ChildNode, anchorOffSet: number) => {
        const anchorParent = anchor.parentElement as HTMLDivElement | OptionTargetElement
        const anchorValue = anchor.nodeValue as string
        const anchorLength = anchorValue?.length

        const isInside = anchorOffSet !== anchorLength
        const isStart = anchorOffSet === 0
        const isEnd = anchorOffSet === anchorLength
        const isAnchorText = isText(anchor)
        const isParentDiv = isDiv(anchorParent)
        const isParentSpan = isSpan(anchorParent)
        const isParentAnchor = isAnchor(anchorParent)
        const isParentSpanOrAnchor = isParentSpan || isParentAnchor

        const isTextStart = isAnchorText && isParentDiv && isStart
        const isInsideText = isAnchorText && isParentDiv && isInside
        const isTextEnd = isAnchorText && isParentDiv && isEnd
        const isTextStartInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isStart
        const isInsideTextInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isInside
        const isTextEndInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isEnd

        switch (true) {
            case (!isAnchorText):
                anchor.after(newNode)
                break
            case (optionType === "defaultText" && (isTextStart || isInsideText || isTextEnd)):
                // do nothing.
                break
            case (optionType === "image"):
                const divParent = lookUpDivParent(anchor)
                if (!divParent) {
                    throw new Error("must be an div parent always")
                }
                divParent.after(newNode)
                break
            case (isTextStart):
                anchor.before(newNode)
                break
            case (isInsideText):
                const leftText = createText(anchorValue.substring(0, anchorOffSet))
                const rightText = createText(anchorValue.substring(anchorOffSet))
                anchor.after(leftText, newNode, rightText)
                anchor.remove()
                break
            case (isTextEnd):
                anchor.after(newNode)
                break
            case (isTextStartInSpanOrAnchor):
                anchorParent.before(newNode)
                break
            case (isInsideTextInSpanOrAnchor):
                const leftSpanOrAnchor = anchorParent.cloneNode()
                leftSpanOrAnchor.appendChild(createText(anchorValue.substring(0, anchorOffSet)))
                const rightSpanOrAnchor = anchorParent.cloneNode()
                rightSpanOrAnchor.appendChild(createText(anchorValue.substring(anchorOffSet)))
                anchorParent.after(leftSpanOrAnchor, newNode, rightSpanOrAnchor)
                anchorParent.remove()
                break
            case (isTextEndInSpanOrAnchor):
                anchorParent.after(newNode)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }
    const handleRangeSelection = (optionType: OptionType, getNewNode: GetOptionTargetNode, range: Range) => {
        if (optionType === "image") {
            // for now i don't  insert images when select ranges
            return
        }

        const copySelectedFragment = range.cloneContents()

        // it seem that range.startContainer is always a text node
        const rangeStartText = range.startContainer as Text
        const rangeStartTextValue = rangeStartText.nodeValue as string
        const rangeStartTextParent = rangeStartText.parentElement as HTMLDivElement | HTMLSpanElement
        const startOffSet = range.startOffset
        const firstCharRangeStartTextSelected = startOffSet === 0
        const startSelectedFragment = copySelectedFragment.firstChild
        const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
        const modifyStartRange = startSelectedFragmentIsDiv && (!firstCharRangeStartTextSelected || hasSiblingOrParentSibling(rangeStartText, "left", (p) => isDiv(p)))
        if (modifyStartRange) {
            const rangeStartTextDivParent = lookUpDivParent(rangeStartText)
            if (!rangeStartTextDivParent) {
                throw new Error("range start must have a div parent up the hierarchy")
            }

            const texts = getTexts(startSelectedFragment)
            const newNode = getNewNode(texts, false)

            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (!firstCharRangeStartTextSelected) {
                const remainSameStyleText = createText((rangeStartTextValue).substring(0, startOffSet))
                rangeStartTextParent.replaceChild(remainSameStyleText, rangeStartText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeStartText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom, "right", removeNodeToRemoveFrom, (p) => isDiv(p))
            rangeStartTextDivParent.appendChild(newNode)

            copySelectedFragment.removeChild(startSelectedFragment)

            range.setStartAfter(rangeStartTextDivParent)
        }

        const rangeEndText = range.endContainer as Text
        const rangeEndTextValue = rangeEndText.nodeValue as string
        const rangeEndTextParent = rangeEndText.parentElement as HTMLSpanElement | HTMLDivElement
        const endOffSet = range.endOffset
        const lastCharRangeEndTextSelected = endOffSet === rangeEndText.length
        const endSelectedFragment = copySelectedFragment.lastChild
        const endSelectedFragmentIsDiv = endSelectedFragment && isDiv(endSelectedFragment)
        // this is when the selection end over part of a div
        const modifyEndRange = endSelectedFragmentIsDiv && (!lastCharRangeEndTextSelected || hasSiblingOrParentSibling(rangeEndText, "right", (p)=> isDiv(p)))
        if (modifyEndRange) {
            const rangeEndTextDivParent = lookUpDivParent(rangeEndText)
            if (!rangeEndTextDivParent) {
                throw new Error("range end must have a div parent up the hierarchy")
            }

            const texts = getTexts(endSelectedFragment)
            const newNode = getNewNode(texts, true)

            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (!lastCharRangeEndTextSelected) {
                const remainSameStyleText = createText((rangeEndTextValue).substring(endOffSet))
                rangeEndTextParent.replaceChild(remainSameStyleText, rangeEndText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeEndText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom,"left", removeNodeToRemoveFrom, (p)=> isDiv(p))
            rangeEndTextDivParent.insertBefore(newNode, rangeEndTextDivParent.firstChild)

            copySelectedFragment.removeChild(endSelectedFragment)

            range.setEndBefore(rangeEndTextDivParent)
        }

        if (!startSelectedFragmentIsDiv) {
            const texts = getTexts(copySelectedFragment)
            if (!isEmpty(texts)) {
                const children = []
                children[1] = getNewNode(texts, true)
                // this is to avoid getting an span inside other span
                if (copySelectedFragment.childNodes.length === 1
                    && isText(copySelectedFragment.childNodes[0])
                    && (isSpan(rangeStartTextParent) || isAnchor(rangeStartTextParent))) {
                    if (firstCharRangeStartTextSelected || lastCharRangeEndTextSelected) {
                        if (firstCharRangeStartTextSelected) {
                            range.setStartBefore(rangeStartTextParent)
                        }
                        if (lastCharRangeEndTextSelected) {
                            range.setEndAfter(rangeStartTextParent)
                        }
                    } else {
                        const leftSpanOrAnchor = rangeStartTextParent.cloneNode()
                        leftSpanOrAnchor.appendChild(createText(rangeStartTextValue.substring(0, startOffSet)))
                        children[0] = leftSpanOrAnchor
                        const rightSpanOrAnchor = rangeStartTextParent.cloneNode()
                        rightSpanOrAnchor.appendChild(createText(rangeEndTextValue.substring(endOffSet, rangeEndTextValue.length)))
                        children[2] = rightSpanOrAnchor

                        range.setStartBefore(rangeStartTextParent)
                        range.setEndAfter(rangeStartTextParent)
                    }
                }
                copySelectedFragment.replaceChildren(...children.filter((c) => c))
            }
        } else {
            const divs = copySelectedFragment.childNodes
            divs.forEach((n,i) => {
                if (n instanceof HTMLDivElement) {
                    const newNode = getNewNode(getTexts(n), !modifyEndRange && (i + 1 === divs.length))
                    n.replaceChildren(newNode)
                } else {
                    throw new Error("I do not expect a node here not to be a div")
                }
            })
        }
        range.deleteContents()
        range.insertNode(copySelectedFragment)
    }

    const handleClickPalletOption = (optionType: OptionType, className?: string) => {
        const selection = window.getSelection() as Selection
        const anchorNode = selection.anchorNode as ChildNode
        const anchorOffset = selection.anchorOffset

        // use to ask href of links and p props of images
        const {top: rectTop,left: rectLeft} = selection.getRangeAt(0).getBoundingClientRect()

        let getNewNode: GetOptionTargetNode
        let onFinally: () => void

        const elementProps = {className: className, tabIndex: -1}

        switch (optionType) {
            case "defaultText":
                let lastDefaultText: Text
                getNewNode = (t, isLast) => {
                    const defaultText = createText(t)
                    if (isLast) {
                        lastDefaultText = defaultText
                    }
                    return defaultText
                }
                onFinally = () => { positionCaretOn(lastDefaultText) }
                break
            case "span":
                let lastSpan: HTMLSpanElement
                getNewNode = (t, isLast) => {
                    const span = createSpan({innerHTML: t, ...elementProps})
                    if (isLast) {
                        lastSpan = span
                    }
                    return span
                }
                onFinally = () => { lastSpan.id = ""; positionCaretOn(lastSpan) }
                break
            case "link":
                getNewNode = (t, isLast) => {
                    const link = createAnchor({innerHTML: t, ...elementProps})
                    if (isLast) {
                        link.id = lastElementAddedId
                    }
                    return link
                }
                onFinally = () => {
                    isAskingTrue()
                    askHRef(rectTop, rectLeft)
                }
                break
            case "image":
                updateInsertOrModifyImage((ip) => {
                    const div = createDiv({props: {contentEditable: "false"}, styles: {paddingLeft: ip.parent.left + "px"}})
                    const image = createImage(ip.image)
                    image.setAttribute("onclick", `{
                        window.modifyImageElement(this)
                    }`)
                    div.append(image)
                    handleCollapsedSelection(optionType, div, anchorNode, anchorOffset)
                })
                isAskingTrue()
                askImageProps(rectTop, rectLeft)
                return
        }

        if (selection.isCollapsed) {
            handleCollapsedSelection(optionType, getNewNode("-", true), anchorNode, anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(optionType, getNewNode, selection.getRangeAt(i))
            }
        }
        // to give time to update the DOM
        setTimeout(onFinally, 100)
    }

    const processHRef = (hRef: string) => {
        const lastLinkAdded = getLastElementAdded() as HTMLAnchorElement
        positionCaretOn(lastLinkAdded)
        lastLinkAdded.id = ""
        lastLinkAdded.href = hRef
    }
    const [askHRef, askHRefIsShowing, AskHRef] = useAskHRef({processHRef: processHRef, isAskingFalse: isAskingFalse})

    const modifyImageElement = (img: HTMLImageElement) => {
        const divParent = img.parentElement as HTMLDivElement
        updateInsertOrModifyImage(({image:{id, src, height,width}, parent:{left}}) => {
            img.id = id
            img.src = src
            img.height = height
            img.width = width
            divParent.style.paddingLeft = left + "px"
        })
        updateRemoveImage(() => {
            (img.parentElement as HTMLDivElement).remove()
        })

        isAskingTrue()
        const imgRect = img.getBoundingClientRect()
        askImageProps(imgRect.top, imgRect.left, {image:{id: img.id, src: img.src, height: img.height, width: img.width}, parent:{left: parseInt(getContainedString(divParent.style.paddingLeft, undefined, "px"))}})
    }
    useEffect(() => {
        window.modifyImageElement = modifyImageElement
    }, [])

    const [insertOrModifyImage, setInsertOrModifyImage] = useState<InsertOrModifyImage>((ip)=> {})
    const updateInsertOrModifyImage = (fun: InsertOrModifyImage)=> { setInsertOrModifyImage((f: InsertOrModifyImage)=> fun) }
    const [removeImage, setRemoveImage] = useState<RemoveImage>(() => {})
    const updateRemoveImage = (fun: RemoveImage) => { setRemoveImage(() => fun) }

    const [askImageProps, askImagePropsIsShowing, AskImageProps] = useAskImageProps({insertOrModifyImage: insertOrModifyImage, removeImage: removeImage, isAskingFalse: isAskingFalse})

    const palletOptionClass = "palletOption"
    const spanClasses = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    const linkClass = "linkOption"
    const getOptionClass = (className?: string) =>  className ? palletOptionClass + " " + className : palletOptionClass

    const optionSeparator = <span style={{color: "#000000"}}>-</span>

    return (
        <Container show={show || askHRefIsShowing() || askImagePropsIsShowing()}>
            <span className={getOptionClass()}
                  onMouseDown={handleMouseDown}
                  onClick={(e) => handleClickPalletOption("defaultText")}>
                a
            </span>
            {optionSeparator}
            {spanClasses.map((spanClass, index) =>
                <>
                <span className={getOptionClass(spanClass)}
                      onMouseDown={handleMouseDown}
                      onClick={(e) => handleClickPalletOption("span", spanClass)}>
                    a
                </span>
                    {optionSeparator}
                </>
            )}
            <a className={getOptionClass(linkClass)}
               onMouseDown={handleMouseDown}
               onClick={(e)=> handleClickPalletOption("link", linkClass)}>
                Link
            </a>
            {optionSeparator}
            <FcPicture onMouseDown={handleMouseDown} size={25} onClick={(e)=> handleClickPalletOption("image")} style={{cursor: "pointer"}}/>
            {AskHRef}
            {AskImageProps}
        </Container>
    )
}

const Container = styled.div<{ show: boolean}>`
  display: ${({show}) => (show ? "flex" : "none") + ";"}
  flex-direction: row;
  align-items: center;
  padding: 5px;
  gap: 10px;
  overflow: auto; 
  border-style: solid;
  border-color: #778899;
  background-color: #FFFFFF;
 `
type UseAskHRefProps = {
    processHRef: (hRef: string)=> void
    isAskingFalse: ()=> void
}
const useAskHRef = ({processHRef, isAskingFalse}: UseAskHRefProps): [Ask, IsShowing, JSX.Element] => {
    const [hRef, setHRef] = useState("")

    const refToInput = useRef<HTMLInputElement | null>(null)
    const focusInput = () => refToInput.current?.focus()

    const handleOnEnter = () => {
        isAskingFalse()
        processHRef(hRef)
        setHRef("")
        hide()
    }

    const [ask, hide, isShowing, Ask] = useAsk({
        childElement: <TextInput placeholder={"href"}
                                 ref={refToInput}
                                 width={150}
                                 value={hRef}
                                 setValue={setHRef}
                                 onEnter={handleOnEnter}/>,
        onShow: focusInput
    })
    return [ask, isShowing, Ask]
}

type ImageProps = { image: {id: string, src: string, height: number, width: number}, parent: {left: number}}
type InsertOrModifyImage = (ip: ImageProps) => void
type RemoveImage = () => void
type UseAskImagePropsProps = {
    insertOrModifyImage: InsertOrModifyImage
    removeImage: RemoveImage
    isAskingFalse: ()=> void
}
const useAskImageProps = ({insertOrModifyImage, removeImage, isAskingFalse}: UseAskImagePropsProps): [(top: number, left: number, ip?: ImageProps)=> void, IsShowing, JSX.Element] => {
    const {state: imageProps, setState: setImageProp, setDefaultState: setImagePropsDefault} = useRecordState({image: {id: "", src: "", height: 0, width: 0}, parent: {left: 0}})
    const {height, width, id, src} = imageProps.image
    const {left} = imageProps.parent

    const [modifying, setModifying] = useState(false)

    const askImageProps = (top: number, left: number, ip?: ImageProps) => {
        if (ip) {
            setModifying(true)
            setImageProp(ip)
        }
        ask(top, left)
    }

    const processImage = (id: string, dataUrl: string) => {
        setImageProp({image: {id: id, src: dataUrl}})
    }

    const close = () => {
        isAskingFalse()
        setImagePropsDefault()
        setRemove(false)
        setModifying(false)
        hide()
    }
    const handleOnClickAccept = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (remove) {
            removeImage()
        } else {
            insertOrModifyImage(imageProps)
        }
        close()
    }
    const handleOnClickCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
        close()
    }

    const [remove, setRemove] = useState(false)
    const handleRemove = () => {
        setRemove(true)
    }
    const handleRecover = () => {
        setRemove(false)
    }

    const refToHeightInput = useRef<HTMLInputElement | null>(null)
    const focusHeightInput = ()=> refToHeightInput.current?.focus()

    const getWrapFormOption = (e: JSX.Element) =>
        <div style={{color: "grey", display: "flex", flexDirection: "row", paddingBottom: 2, paddingTop: 2, borderBottomStyle: "solid", borderWidth: "thin",width: "150px"}}>
            {e}
        </div>
    const getFormOptionLabel = (str: string) =>
        <span style={{fontSize: 20, width: 70}}>{str}:</span>

    const [ask, hide, isShowing, Ask] = useAsk({
        childElement:   <div style={{padding: 5}}>
                        {getWrapFormOption(<>
                                           {getFormOptionLabel("height")}
                                           <NumberInput disabled={remove} style={{ width: "60%"}} ref={refToHeightInput} value={height} setValue={(v) => setImageProp({image:{height: v}})}/>
                                           </>)
                        }
                        {getWrapFormOption(<>
                                           {getFormOptionLabel("width")}
                                           <NumberInput disabled={remove} style={{ width: "60%"}} value={width} setValue={(v) => setImageProp({image:{width: v}})}/>
                                           </>)
                        }
                        {getWrapFormOption(<>
                            {getFormOptionLabel("left")}
                            <NumberInput disabled={remove} style={{ width: "60%"}} value={left} setValue={(v) => setImageProp({parent:{left: v}})}/>
                        </>)
                        }
                        {getWrapFormOption(<>
                                           <ImageSelector disabled={remove} processImage={processImage}
                                               label={getFormOptionLabel("src")} imageMaxSize={10}/>
                                           <span style={{
                                               fontSize: 20, display: "inline-block", overflow: "hidden",
                                               textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                               {id}</span>
                                           </>)
                        }
                        {modifying && <div style={{display: "flex", justifyContent: "center", padding: 5}}>
                                      <DeleteOrRecoverButton handleRecover={()=> {handleRecover()}} handleDelete={()=> {handleRemove()}} color={"gray"}/>
                                      </div>
                        }
                        <div style={{display: "flex"}}>
                            <button style={{width: "50%"}} onClick={handleOnClickAccept}>accept</button>
                            <button style={{width: "50%"}} onClick={handleOnClickCancel}>cancel</button>
                        </div>
                        </div>,
        onShow: focusHeightInput,
        maxWidth: 290
    })
    return [askImageProps, isShowing, Ask]
}
type AskContainerProps = { show: boolean, position: { top: number, left: number }, maxWidth?: number}
const AskContainer = styled.div<AskContainerProps>`
  display: ${({show, position:{top, left}, maxWidth}) => (show ? "flex" : "none") + ";"
    + "top: " + top + "px;"
    + "left: " + left + "px;"
    + (maxWidth ? "max-width: " + maxWidth + "px;" : "")}
  flex-direction: column;
  align-items: center;
  z-index: 1;
  position: absolute;
  cursor: move;
  border-style: solid;
  border-color: #000000;
  background-color: white;
`
type Ask = (top: number, left: number) => void
type Hide = () => void
type IsShowing = () => boolean
type UseAskProps = {
    childElement: JSX.Element
    onShow: ()=> void
    maxWidth?: number
}
const useAsk = ({childElement, onShow, maxWidth}: UseAskProps): [Ask, Hide, IsShowing , JSX.Element] => {
    const askInitialStates = {show: false, position: {top: 0, left: 0}}
    const {state, setState, setDefaultState: hide} = useRecordState(askInitialStates)
    const ask = (top: number, left: number) => {
        setState({show: true, position: {top: top, left: left}})
    }
    useEffect(() => {
        if (state.show) {
            onShow()
        }
    }, [state.show])

    const isShowing = () => state.show

    const Element = (
        <AskContainer {...state} maxWidth={maxWidth}>
            {childElement}
        </AskContainer>
    )
    return [ask, hide, isShowing, Element]
}
