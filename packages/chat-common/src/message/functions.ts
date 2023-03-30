import {messageParts} from "../model/constants"
import {
    CommonMessagePartsPositions,
    CutMessage,
    GotAllMessageParts,
    GotMessageParts,
    Message,
    MessagePartsPositions, MessageTemplate
} from "./types"
import {getIndexOnOccurrence} from "utils/src/strings"

type AnyMessagePartsPositions<M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP = M["positions"]> = { [K in CMPP]: K extends keyof MPP ? MPP[K] : never }
type LastPosition<MPP extends MessagePartsPositions, LASTS = [4, 3, 2, 1]> = LASTS extends [infer LAST, ...infer REST] ? LAST extends MPP[keyof MPP] ? LAST : LastPosition<MPP, REST> : never

export const getMessage = <M extends Message>(parts: GotAllMessageParts<M>) => {
    let message = ""
    if (messageParts.prefix in parts)
        message += parts.prefix
    if (messageParts.originPrefix in parts)
        message += ":" + parts.originPrefix
    if (messageParts.number in parts)
        message += ":" + parts.number
    if (messageParts.guessId in parts)
        message += ":" + parts.guessId
    if (messageParts.body in parts)
        message += ":" + parts.body

    return message as M["template"]
}

export const getMessagePrefix = <M extends MessageTemplate>(m: M) => {
    return m.substring(0, 3) as (M extends `${infer MP}:${any}` ? MP : never)
}

export const getMessageParts = <M extends Message, CMPP extends CommonMessagePartsPositions<M>=CommonMessagePartsPositions<M>>(m: M["template"], whatGet: AnyMessagePartsPositions<M, CMPP>) => {
    const parts: any = {}
    const getPartSeparatorIndex = (occurrence: number) => getIndexOnOccurrence(m, ":", occurrence)
    if (messageParts.prefix in whatGet)
        parts["prefix"] = m.substring(0, 3)
    if (messageParts.originPrefix in whatGet)
        parts["originPrefix"] = m.substring(4, 7)
    if (messageParts.number in whatGet)
        parts["number"] = m.substring(8, getPartSeparatorIndex(whatGet.number as 2 | 3))
    if (messageParts.guessId in whatGet) {
        const guessIdPosition = whatGet.guessId as 3 | 4
        parts["guessId"] = m.substring(getPartSeparatorIndex(guessIdPosition - 1) + 1, getPartSeparatorIndex(guessIdPosition))
    }
    if (messageParts.body in whatGet)
        parts["body"] = m.substring(getPartSeparatorIndex((whatGet.body as 3 | 4) - 1) + 1, m.length - 1)

    return parts as GotMessageParts<M, CMPP>
}

export const getCutMessage = <M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP extends M["positions"] = M["positions"]>(m: M["template"], whatCut: AnyMessagePartsPositions<M, CMPP>, lastPosition: LastPosition<MPP>) => {
    let cutMessage: string = m
    let position = 0
    let cutSize = 0
    let cutCount = 0
    let partStartIndex = 0
    let partEndIndex = 0
    const findPartBoundaryIndex = (start = true) => {
        const currentPosition = position - cutCount
        let index
        if (currentPosition === 1 && start) {
            index = 0
        } else if (start) {
            index = getIndexOnOccurrence(cutMessage, ":", currentPosition - 1) + 1
        } else {
            index = getIndexOnOccurrence(cutMessage, ":", currentPosition) - 1
        }
        return index
    }
    const cut = () => {
        let cutStartIndex = partStartIndex - (position === lastPosition ? 1 : 0)
        let cutEndIndex = partEndIndex + (position === lastPosition ? 0 : 2)
        cutMessage = cutMessage.substring(0, cutStartIndex ) + cutMessage.substring(cutEndIndex)
        cutSize += cutEndIndex - cutStartIndex
        cutCount ++
    }

    if (messageParts.prefix in whatCut) {
        position = 1
        partEndIndex = 2
        cut()
    }
    if (messageParts.originPrefix in whatCut) {
        position = 2
        partStartIndex = 4 - cutSize
        partEndIndex = 6 - cutSize
        cut()
    }
    if (messageParts.number in whatCut) {
        position = whatCut.number as 2 | 3
        partStartIndex = 8 - cutSize
        partEndIndex = findPartBoundaryIndex(false)
        cut()
    }
    if (messageParts.guessId in whatCut) {
        position = whatCut.guessId as 3 | 4
        partStartIndex = findPartBoundaryIndex()
        partEndIndex = findPartBoundaryIndex(false)
        cut()
    }
    if (messageParts.body in whatCut) {
        position = whatCut.body as 3 | 4
        partStartIndex = findPartBoundaryIndex()
        partEndIndex = m.length - 1
        cut()
    }

    return cutMessage as CutMessage<[M], CMPP>
}
