import styled from "@emotion/styled"
import {MdForwardToInbox} from "react-icons/md"
import {useFormModal} from "../FormComponents"
import ComponentWithTooltip from "../ComponentWithTooltip"

type Props = {
    show: boolean
}
export default function Sidebar({show}: Props){
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
        <Container show={show}>
            {SendMessageModal}
            <ComponentWithTooltip
                childElement={<MdForwardToInbox className={"sidebarIcon"} style={{cursor: "pointer", color: "#DAA520"}} onClick={(e) => showSendMessageModal()}/>}
                tooltipText={"send email"} tooltipStyle={{height: "35px",  width: "fit-content"}}
                tooltipTopDeviation={-40} tooltipLeftDeviation={-100}/>
        </Container>
    )
}

const Container = styled.div<{ show: boolean }>`
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 0px;
  top: 90px;
  align-items: center;
  height: 50%;
  padding-top: 70px;
  z-index: 5;
  width: 100px;
  border-left: 4px solid;
  border-top: 4px solid;
  border-bottom: 4px solid;
  border-color: #00008B;
  background-color: white;
    @media (max-width: 768px) {
    top: 70px;
    width: 50px;
  }
    `
const MessengerContainer = styled.div`
  display: flex;
  flex-direction: column;
    `