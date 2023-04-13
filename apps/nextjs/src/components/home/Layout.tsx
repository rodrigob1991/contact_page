import styled from "@emotion/styled"
import {mainColor, secondColor} from "../../colors"

export const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  `
export const Footer = styled.div`
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(${secondColor},${mainColor});
  height: 100%;
    `