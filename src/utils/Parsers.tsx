import {isEmpty} from "./StringManipulations"
import React from "react"
import {firstCharAfterEqualAndSpaces} from "./RegularExpressions";
import Image from "next/image"

export const getJsxStoryBody = (storyBodyHtml: string) => {
    let jsx = <></>

    const tagBeginRgx = /[<]/
    const tagEndRgx = /[>]/
    const closeTagBeginRgx = /[</]/

    const getNextTagName = (startTag: string) => startTag.substring(1, startTag.indexOf("")).trim()
    const getNextAttrValue = (startTag: string, attrName: string) => {
        let attrValueStartIndex
        let attrValueEndIndex
        const firstCharNoSpaceIndex = startTag.search(firstCharAfterEqualAndSpaces)
        switch (startTag.at(firstCharNoSpaceIndex)) {
            case '"':
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = startTag.indexOf('"', 2)
                break
            case "'":
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = startTag.indexOf("'", 2)
                break
            default:
                attrValueStartIndex = firstCharNoSpaceIndex
                attrValueEndIndex = startTag.substring(firstCharNoSpaceIndex).search(" ")
        }

        return startTag.substring(attrValueStartIndex, attrValueEndIndex)
    }
    const getElementText = (startTag: string) => {
        return startTag.substring(startTag.search(tagEndRgx) + 1, startTag.search(closeTagBeginRgx))
    }
    //const attributeNameRgx = /[^"'>/= \0]/

    let leftDivs = storyBodyHtml
    while (!isEmpty(leftDivs)) {
        const startDivBeginIndex = leftDivs.search(tagBeginRgx)
        const startDivEndIndex = leftDivs.search(tagEndRgx)
        const startDiv = leftDivs.substring(startDivBeginIndex, startDivEndIndex + 1)

        if (getNextTagName(startDiv) !== "div") {
            throw new Error("Only divs must appears here")
        }

        let jsxDivChildren = <></>

        let beginChild = leftDivs.substring(startDivEndIndex + 1)
        while (!beginChild.startsWith("</div>")) {
            let jsxDivChild
            if (beginChild.at(0) === "<") {
                const tagNameChild = getNextTagName(beginChild)
                switch (tagNameChild) {
                    case "span":
                        jsxDivChild = <span className={getNextAttrValue(beginChild, "class")}>{getElementText(beginChild)}</span>
                        break
                    case "a":
                        <a className={getNextAttrValue(beginChild, "class")} href={getNextAttrValue(beginChild, "href")}>{getElementText(beginChild)}</a>
                        break
                    case "img":
                        jsxDivChild = <div style={{paddingLeft: div.style.paddingLeft}}>
                            <Image alt={""} src={divChild.src} layout={"intrinsic"} height={divChild.height} width={divChild.width}
                                   style={{maxWidth: "100%", height: "auto"}} /></div>
                        break
                    case "br":
                        break
                    default:
                        throw new Error("could not enter any case, tag name child:  " + tagNameChild)
                }
            } else {
                const endTextChildIndex = beginChild.search(tagBeginRgx)
                jsxDivChild = beginChild.substring(0, endTextChildIndex)

                beginChild = beginChild.substring(endTextChildIndex)
            }
            jsxDivChildren = <>{jsxDivChildren} {jsxDivChild}</>
        }
        jsx = <>{jsx}<div>{jsxDivChildren}</div></>
    }

    return jsx
}