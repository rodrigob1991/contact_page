import styled from "@emotion/styled"
import {mainColor, secondColor} from "../../colors"

export const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  overflow: hidden;
  background-image: radial-gradient(${mainColor} 10%,${secondColor} 70%);
  `
export const Footer = styled.div`
  display: flex;
  flex-direction: column;
    `