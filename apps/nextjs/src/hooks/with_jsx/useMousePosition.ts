import { useEffect, useState } from "react"

export default function useMousePosition(when: "move" | "down" | "up"="move") {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    
    useEffect(() => {
      const type = `mouse${when}` as const
      const updateMousePosition = (e: MouseEvent) => {
        setMousePosition({x: e.clientX, y: e.clientY})
      }
      window.addEventListener(type, updateMousePosition)
      return () => {
        window.removeEventListener(type, updateMousePosition)
      }
    }, [])
    
    return mousePosition
  }