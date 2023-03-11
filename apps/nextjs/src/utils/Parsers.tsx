import {getIndexOnOccurrence, isEmpty} from "utils/src/strings"
import React from "react"
import {firstCharAfterEqualAndSpaces} from "utils/src/regularExpressions"
import Image from "next/image"

export const getStoryBodyJsx = (storyBodyHtml: string) => {
    let jsx = <></>

    const tagBeginRgx = /[<]/
    const tagEndRgx = /[>]/
    const closeTagBeginRgx = new RegExp("</")

    const getNextTagName = (startTag: string) => startTag.substring(startTag.indexOf("<") + 1, startTag.search(/[\s]|[>]/)).trim()
    const getNextAttrValue = (startTag: string, attrName: string) => {
        const startAttr = startTag.substring(startTag.indexOf(attrName))
        let attrValueStartIndex
        let attrValueEndIndex
        const firstCharNoSpaceIndex = startAttr.search(firstCharAfterEqualAndSpaces)
        switch (startAttr.at(firstCharNoSpaceIndex)) {
            case '"':
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = getIndexOnOccurrence(startAttr, '"', 2)
                break
            case "'":
                attrValueStartIndex = firstCharNoSpaceIndex + 1
                attrValueEndIndex = getIndexOnOccurrence(startAttr, "'", 2)
                break
            default:
                attrValueStartIndex = firstCharNoSpaceIndex
                attrValueEndIndex = startAttr.substring(firstCharNoSpaceIndex).search(" ")
        }
        return startAttr.substring(attrValueStartIndex, attrValueEndIndex)
    }
    const getText = (startOnElementOrText: string) => {
        let text
        if (startOnElementOrText.at(0) === "<") {
            text = startOnElementOrText.substring(startOnElementOrText.search(tagEndRgx) + 1, startOnElementOrText.search(closeTagBeginRgx))
        } else {
            text = startOnElementOrText.substring(0, startOnElementOrText.search(tagBeginRgx))
        }
        return text.replaceAll("&nbsp;", "\u00A0")
    }

    let leftDivs = storyBodyHtml.trim()
    while (!isEmpty(leftDivs)) {
        const startOnDivBeginIndex = leftDivs.search(tagBeginRgx)
        const startOnDivEndIndex = leftDivs.search(tagEndRgx)
        const startOnDiv = leftDivs.substring(startOnDivBeginIndex, startOnDivEndIndex + 1)
        const startOnDivTagName = getNextTagName(startOnDiv)
        if (startOnDivTagName !== "div") {
            throw new Error("Only divs must appears here,start div:" +  startOnDiv + ",tag name: " + startOnDivTagName)
        }

        let jsxDivChildren = <></>

        let startOnChild = leftDivs.substring(startOnDivEndIndex + 1)
        while (!startOnChild.startsWith("</div>")) {
            let jsxDivChild
            if (startOnChild.at(0) === "<") {
                let closeTagIndex
                const tagNameChild = getNextTagName(startOnChild)
                switch (tagNameChild) {
                    case "span":
                        jsxDivChild = <span id={getNextAttrValue(startOnChild, "id")} className={getNextAttrValue(startOnChild, "class")}>{getText(startOnChild)}</span>
                        closeTagIndex = getIndexOnOccurrence(startOnChild, ">", 2)
                        break
                    case "a":
                        jsxDivChild = <a id={getNextAttrValue(startOnChild, "id")} className={getNextAttrValue(startOnChild, "class")} href={getNextAttrValue(startOnChild, "href")}>{getText(startOnChild)}</a>
                        closeTagIndex = getIndexOnOccurrence(startOnChild, ">", 2)
                        break
                    case "img":
                        jsxDivChild = <div id={getNextAttrValue(startOnDiv, "id")} style={{width: "100%", justifyContent: "center", display: "flex"}}>
                                      <Image alt={""} src={getNextAttrValue(startOnChild, "src")} layout={"intrinsic"} height={parseInt(getNextAttrValue(startOnChild, "height"))} width={parseInt(getNextAttrValue(startOnChild, "width"))} style={{maxWidth: "100%", height: "auto"}} />
                                       </div>
                        closeTagIndex = startOnChild.search(tagEndRgx)
                        break
                    case "br":
                        jsxDivChild = <br/>
                        closeTagIndex = startOnChild.search(tagEndRgx)
                        break
                    default:
                        throw new Error("could not enter any case, tag name child: " + tagNameChild + ", beginChild: " + startOnChild)
                }
                startOnChild = startOnChild.substring(closeTagIndex + 1)
            } else {
                jsxDivChild = getText(startOnChild)
                startOnChild = startOnChild.substring(startOnChild.search(tagBeginRgx))
            }
            jsxDivChildren = <>{jsxDivChildren} {jsxDivChild}</>
        }
        jsx = <>{jsx}<div>{jsxDivChildren}</div></>
        leftDivs = leftDivs.substring(leftDivs.indexOf("</div>") + "</div>".length).trim()
    }
    return jsx
}