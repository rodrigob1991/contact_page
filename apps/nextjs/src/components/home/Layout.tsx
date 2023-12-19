import styled from "@emotion/styled"
import {mainColor, secondColor} from "../../theme"

export const Container = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  height: 100%;
  background-image: radial-gradient(${mainColor} 10%,${secondColor} 70%);
  `
export const Footer = styled.div`
  display: flex;
  flex-direction: column;
  `