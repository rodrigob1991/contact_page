import styled from "@emotion/styled"
import {MdForwardToInbox} from "react-icons/md"
import {useFormModal} from "../FormComponents"
import {useTooltip} from "../../utils/Hooks"
import ComponentWithTooltip from "../ComponentWithTooltip";

export default function Sidebar(){
    const sendEmail = ({
                           from,
                           subject,
                           message
                       }: {
        from: string,
        subject: string,
        message: string
    }) => {
        const bodyParams = {
            sender: {email: from},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
            subject: subject,
            htmlContent: `<!DOCTYPE html>  
                <html> 
                    <body>  
                        ${message}
                    </body> 
                </html>`
        }
        const succeedResultMessage = {succeed: true, message: "email sent"}
        const unsucceedResultMessage = {succeed: false, message: "email was not sent"}
        const logError = (error: any) => {
            console.error(`Error sending the email: ${JSON.stringify(error)}`)
        }

        return fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
            },
            body: JSON.stringify(bodyParams),
        }).then((response) => {
                let nextThenArg
                if (response.ok) {
                    nextThenArg = "ok"
                } else {
                    nextThenArg = response.json()
                }
                return nextThenArg
            }
        ).then((resultMessageOrBody) => {
            let resultMessage
            if (resultMessageOrBody === "ok") {
                resultMessage = succeedResultMessage
            } else {
                resultMessage = unsucceedResultMessage
                logError(resultMessageOrBody)
            }
            return resultMessage
        }).catch((e) => {
            logError(e)
            return unsucceedResultMessage
        })
    }

    const [showSendMessageModal, SendMessageModal] = useFormModal(
        {
            inputElementsProps: {
                from: {type: "textInputEmail", required: true, placeholder: "from", width: 300, style:{ fontSize: "2rem"}},
                subject: {type: "textInput", placeholder: "subject", width: 300, style:{ fontSize: "2rem"}},
                message: {type: "textAreaInput", required: true, placeholder: "message", height: 250, width: 300, style:{ fontSize: "2rem"}}
            },
            processSubmission : sendEmail,
            position: {left: 50, top: 40},
            resultMessageStyle: {fontStyle: "2rem"},
            button: {text: "SEND EMAIL", style: {fontSize: "1.7rem"}}
        })

    return (
        <Container>
            {SendMessageModal}
            <ComponentWithTooltip ChildElement={<MdForwardToInbox size={50} style={{cursor: "pointer", color: "#DAA520"}}
                                                                  onClick={(e)=> showSendMessageModal()}/>}
                                  tooltipText={"send me an email"}
                                  tooltipCssProperties={{height: "35px", color: "#778899", borderColor: "#778899"}}/>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0px;
  align-items: center;
  height: 100%;
  padding-top: 150px;
  z-index: 5;
  width: 100px;
  border-left: 2px solid;
  border-color: #778899;
  background-color: white;
    `
const MessengerContainer = styled.div`
  display: flex;
  flex-direction: column;
    `