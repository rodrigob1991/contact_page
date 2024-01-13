import styled from "@emotion/styled"
import {mainColor, secondColor} from "../../theme"

export const Container = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  height: 100%;
  background-image: radial-gradient(${mainColor} 10%,${secondColor} 70%);
  border: 3px solid ${mainColor};
  `
export const Footer = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: ${secondColor};
  border-top: 3px solid ${mainColor};
  `