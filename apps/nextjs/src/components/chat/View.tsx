import styled from "@emotion/styled";

export type MessageView = { user: string, body: string }

type Props = {
    messages: MessageView[]
    users:    string[]
}

export default function ChatView(){

}

const Container = styled.form<{ topPosition: number, leftPosition: number}>`
  display: flex;
  ${({topPosition, leftPosition}) => 
    "top: " + topPosition + "%;"
    + "left: " + leftPosition + "%;"}
  flex-direction: column;
  align-items: center;
  z-index: 1; 
  position: fixed;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 15px;
  gap: 15px;
  overflow: auto; 
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
 `