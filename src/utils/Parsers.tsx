import {getContainedString, isEmpty} from "./StringManipulations"
import React from "react"
import {firstCharAfterEqualAndSpaces} from "./RegularExpressions"
import Image from "next/image"

export const getStoryBodyJsx = (storyBodyHtml: string) => {
    let jsx = <></>

    const tagBeginRgx = /[<]/
    const tagEndRgx = /[>]/
    const closeTagBeginRgx = /[</]/

    const getNextTagName = (startTag: string) => startTag.substring(startTag.indexOf("<") + 1, startTag.search(/[\s]|[>]/)).trim()
    const getNextAttrValue = (startTag: string, attrName: string) => {
        const startAttr = startTag.substring(startTag.indexOf(attrName))
        let attrValueStartIndex
        let attrValueEndIndex
        const firstCharNoSpaceIndex = startAttr.search(firstCharAfterEqualAndSpaces)
        switch (startAttr.at(firstCharNoSpaceIndex)) {
            case '"':
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = startAttr.indexOf('"', 2)
                break
            case "'":
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = startAttr.indexOf("'", 2)
                break
            default:
                attrValueStartIndex = firstCharNoSpaceIndex
                attrValueEndIndex = startAttr.substring(firstCharNoSpaceIndex).search(" ")
        }
        return startAttr.substring(attrValueStartIndex, attrValueEndIndex)
    }
    const getElementText = (startTag: string) => {
        return startTag.substring(startTag.search(tagEndRgx) + 1, startTag.search(closeTagBeginRgx))
    }

    let leftDivs = storyBodyHtml.trim()
    while (!isEmpty(leftDivs)) {
        const startDivBeginIndex = leftDivs.search(tagBeginRgx)
        const startDivEndIndex = leftDivs.search(tagEndRgx)
        const startDiv = leftDivs.substring(startDivBeginIndex, startDivEndIndex + 1)
        const startDivTagName = getNextTagName(startDiv)
        if (startDivTagName !== "div") {
            throw new Error("Only divs must appears here,start div:" +  startDiv + ",tag name: " + startDivTagName)
        }

        let jsxDivChildren = <></>

        let beginChild = leftDivs.substring(startDivEndIndex + 1)
        while (!beginChild.startsWith("</div>")) {
            let jsxDivChild
            if (beginChild.at(0) === "<") {
                let closeTagIndex
                const tagNameChild = getNextTagName(beginChild)
                switch (tagNameChild) {
                    case "span":
                        jsxDivChild = <span id={getNextAttrValue(beginChild, "id")} className={getNextAttrValue(beginChild, "class")}>{getElementText(beginChild)}</span>
                        closeTagIndex = beginChild.indexOf(">", 2)
                        break
                    case "a":
                        jsxDivChild = <a id={getNextAttrValue(beginChild, "id")} className={getNextAttrValue(beginChild, "class")} href={getNextAttrValue(beginChild, "href")}>{getElementText(beginChild)}</a>
                        closeTagIndex = beginChild.indexOf(">", 2)
                        break
                    case "img":
                        jsxDivChild = <div id={getNextAttrValue(startDiv, "id")} style={{paddingLeft: getContainedString(getNextAttrValue(startDiv, "style"), ":", ";")}}>
                                      <Image alt={""} src={getNextAttrValue(beginChild, "src")} layout={"intrinsic"} height={parseInt(getNextAttrValue(beginChild, "height"))} width={parseInt(getNextAttrValue(beginChild, "width"))} style={{maxWidth: "100%", height: "auto"}} />
                                      </div>
                        closeTagIndex = beginChild.search(tagEndRgx)
                        break
                    case "br":
                        jsxDivChild = <br/>
                        closeTagIndex = beginChild.search(tagEndRgx)
                        break
                    default:
                        throw new Error("could not enter any case, tag name child: " + tagNameChild + ", beginChild: " + beginChild)
                }
                beginChild = beginChild.substring(closeTagIndex + 1)
            } else {
                const endTextChildIndex = beginChild.search(tagBeginRgx)
                jsxDivChild = beginChild.substring(0, endTextChildIndex)

                beginChild = beginChild.substring(endTextChildIndex)
            }
            jsxDivChildren = <>{jsxDivChildren} {jsxDivChild}</>
        }
        jsx = <>{jsx}<div>{jsxDivChildren}</div></>
        leftDivs = leftDivs.substring(leftDivs.indexOf("</div>") + "</div>".length).trim()
    }
    return jsx
}