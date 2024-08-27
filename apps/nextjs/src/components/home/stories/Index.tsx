import { useState, MouseEventHandler, TouchEventHandler, useEffect } from "react"
import { StoryStates } from "./StoriesView"
import styled from "@emotion/styled"
import { mainColor, secondColor } from "../../../theme"
import useRef from "../../../hooks/references/useRef"

type Props = {
    storiesStates: StoryStates[]
}

export default function Index({storiesStates}: Props) {
    const [transparent, setTransparent] = useState(true)
    const [showAnchors, setShowAnchors] = useState(true)

    const onClickHandler: MouseEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation()
      setShowAnchors((showAnchors) => {
        let nextShowAnchors
        let nextTransparent
        if (showAnchors) {
            if (transparent) {
                nextShowAnchors = true
                nextTransparent = false
            } else {
                nextShowAnchors = false
                nextTransparent = true
            }
        } else {
            nextShowAnchors = true
            nextTransparent = false
        }
        setTransparent(nextTransparent)
        
        return nextShowAnchors
      })
    }
    const onTouchStartHandler: TouchEventHandler<HTMLDivElement> = (e) => {
    }
    const onMouseLeaveHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        setTransparent(true)
    }
    const onMouseOverHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        setTransparent(!showAnchors)
    }
    const onClickAnchorHandler: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.stopPropagation()
    }

    const [getContainerDiv, setContainerDiv] = useRef<HTMLDivElement>()
    useEffect(() => {
        document.addEventListener("touchstart", ({target}) => {
         const containerDiv = getContainerDiv()
         if (containerDiv && target instanceof Node && !(containerDiv.contains(target))) {
            setTransparent(true)
         }
        })
    }, [])

    return <Container ref={setContainerDiv} transparent={transparent} onClick={onClickHandler} onTouchStart={onTouchStartHandler} onMouseOver={onMouseOverHandler} onMouseLeave={onMouseLeaveHandler}>
           <Title>stories index</Title>
           {showAnchors &&
           <AnchorsContainer>
           {storiesStates.map(({htmlId, story: {title}}) =>
           <AnchorContainer>
           <Anchor href={"#" + htmlId} onClick={onClickAnchorHandler}>
           {title}
           </Anchor>
           </AnchorContainer>
           )}
           </AnchorsContainer>
           }
           </Container>
}

const Container = styled.div<{transparent: boolean}>` 
    opacity: ${({transparent}) => transparent ? 0.5 : 1};
    cursor: pointer;
`
const AnchorsContainer = styled.ul`
    z-index: 2;
    margin: 0px;
    border-style: solid;
    border-color: ${mainColor};
    padding: 0px;
    background-color: ${secondColor};
`
const Title = styled.h3`
    color: white;
    font-size: 2.2rem;
    font-weight: bold;
    text-align: center;
    background-color: ${mainColor};
    padding: 5px;
    margin: 0px;
`
const AnchorContainer = styled.li`
    list-style-type: none;
    border-bottom-style: solid;
    border-bottom-color: ${mainColor};
    padding: 5px;
    text-align: center;
    :last-of-type {
      border-bottom-style: none;
    }
`
const Anchor = styled.a`
    font-size: 2rem;
    font-weight: bold;
    text-align: center;
    color: white;
    :hover {
          color: ${mainColor};
    }
`